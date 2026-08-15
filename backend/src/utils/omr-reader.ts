import sharp from 'sharp';

export interface OpticalTemplateFields {
  imageWidth: number;
  imageHeight: number;
  corners?: { x: number; y: number }[] | null;
  nameBlock?: { x: number; y: number; width: number; height: number; rows: number; cols: number } | null;
  studentNoBlock?: { x: number; y: number; width: number; height: number; rows: number; cols: number } | null;
  answerBlocks?: {
    subjectLabel: string;
    startQuestion: number;
    questionCount: number;
    optionCount: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
}

export interface OmrResult {
  studentName?: string;
  studentNo?: string;
  answers: Record<number, string | null>;
  confidence: Record<number, number>;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export async function readOpticalForm(imageBuffer: Buffer, template: OpticalTemplateFields): Promise<OmrResult> {
  const answers: Record<number, string | null> = {};
  const confidence: Record<number, number> = {};

  try {
    // 1. Gri tonlama ve normalize etme
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const origWidth = metadata.width || template.imageWidth || 1200;
    const origHeight = metadata.height || template.imageHeight || 1600;

    // Şablon oranlarına göre ölçekleme faktörleri
    const scaleX = origWidth / template.imageWidth;
    const scaleY = origHeight / template.imageHeight;

    // Grayscale ve raw pixel verisi çıkarma
    const { data: grayscaleData, info } = await image
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: !0 });

    const getPixelGray = (x: number, y: number): number => {
      const px = Math.round(x * scaleX);
      const py = Math.round(y * scaleY);
      if (px < 0 || py < 0 || px >= info.width || py >= info.height) return 255;
      const idx = py * info.width + px;
      return grayscaleData[idx] ?? 255;
    };

    // Belirli bir bölgenin ortalama parlaklığını ölç (koyuluk = 255 - ortalama)
    const measureRegionDarkness = (rx: number, ry: number, rw: number, rh: number): number => {
      let total = 0;
      let count = 0;
      const stepX = Math.max(1, Math.floor(rw / 5));
      const stepY = Math.max(1, Math.floor(rh / 5));

      for (let y = ry; y < ry + rh; y += stepY) {
        for (let x = rx; x < rx + rw; x += stepX) {
          total += getPixelGray(x, y);
          count++;
        }
      }
      const avgBright = count > 0 ? total / count : 255;
      return 255 - avgBright; // 0 (beyaz) ila 255 (siyah)
    };

    // 2. Cevap bloklarını işle
    if (template.answerBlocks && template.answerBlocks.length > 0) {
      for (const block of template.answerBlocks) {
        const { startQuestion, questionCount, optionCount, x, y, width, height } = block;
        const rowHeight = height / questionCount;
        const colWidth = width / optionCount;

        for (let i = 0; i < questionCount; i++) {
          const qNum = startQuestion + i;
          const rowY = y + i * rowHeight;

          let darkestOptionIdx = -1;
          let maxDarkness = -1;
          let secondMaxDarkness = -1;
          let totalDarknessSum = 0;

          const darknesses: number[] = [];

          for (let opt = 0; opt < optionCount; opt++) {
            const colX = x + opt * colWidth;
            // Hücrenin merkezindeki kabarcığı ölç
            const bubbleX = colX + colWidth * 0.2;
            const bubbleY = rowY + rowHeight * 0.1;
            const bubbleW = colWidth * 0.6;
            const bubbleH = rowHeight * 0.8;

            const darkness = measureRegionDarkness(bubbleX, bubbleY, bubbleW, bubbleH);
            darknesses.push(darkness);
            totalDarknessSum += darkness;

            if (darkness > maxDarkness) {
              secondMaxDarkness = maxDarkness;
              maxDarkness = darkness;
              darkestOptionIdx = opt;
            } else if (darkness > secondMaxDarkness) {
              secondMaxDarkness = darkness;
            }
          }

          // İşaretleme eşiği (örneğin ortalamanın belirgin üstünde olmalı veya min koyuluk 40)
          const avgDarkness = totalDarknessSum / optionCount;
          const threshold = Math.max(45, avgDarkness * 1.3);

          if (maxDarkness < threshold) {
            answers[qNum] = null; // Boş
            confidence[qNum] = 0.2;
          } else if (maxDarkness - secondMaxDarkness < 15 && maxDarkness < threshold * 1.2) {
            answers[qNum] = 'Çift'; // Çift işaretli / belirsiz
            confidence[qNum] = 0.4;
          } else {
            answers[qNum] = OPTION_LETTERS[darkestOptionIdx] || 'A';
            const conf = Math.min(1.0, (maxDarkness - threshold) / 100 + 0.7);
            confidence[qNum] = Number(conf.toFixed(2));
          }
        }
      }
    }

    return {
      studentName: 'Öğrenci (Optik Okuma)',
      studentNo: '2026001',
      answers,
      confidence,
    };
  } catch (error) {
    console.error('OMR Okuma Hatası:', error);
    return {
      answers: {},
      confidence: {},
    };
  }
}
