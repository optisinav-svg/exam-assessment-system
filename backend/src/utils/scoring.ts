/**
 * Net Hesaplama Motoru
 * ---------------------
 * Türkiye'deki sınav sistemlerinde kullanılan standart net hesaplama mantığı:
 *
 *  - 5 seçenekli sınav: her 4 yanlış, 1 doğruyu eksiltir
 *  - 4 seçenekli sınav: her 3 yanlış, 1 doğruyu eksiltir
 *  - 3 seçenekli sınav: her 2 yanlış, 1 doğruyu eksiltir
 *
 * "negativeMarking" (yanlışların doğruları eksiltmesi) kapalıysa,
 * net = doğru sayısı olur (yanlışların hiçbir etkisi olmaz).
 */

export type OptionCount = 3 | 4 | 5;

export interface ScoringInput {
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  optionCount?: OptionCount | number;
  negativeMarking?: boolean;
}

export interface ScoringResult {
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  net: number;
  score: number; // 100 üzerinden karşılığı
}

// Seçenek sayısına göre "kaç yanlış 1 doğruyu eksiltir" katsayısı
function getDivisor(optionCount?: number): number {
  switch (optionCount) {
    case 3:
      return 2;
    case 5:
      return 4;
    case 4:
    default:
      return 3;
  }
}

export function calculateNet({
  correctCount,
  wrongCount,
  totalQuestions,
  optionCount = 4,
  negativeMarking = true,
}: ScoringInput): ScoringResult {
  const safeCorrect = Math.max(0, correctCount);
  const safeWrong = Math.max(0, wrongCount);
  const emptyCount = Math.max(0, totalQuestions - safeCorrect - safeWrong);

  let net: number;
  if (negativeMarking) {
    const divisor = getDivisor(optionCount);
    net = safeCorrect - safeWrong / divisor;
  } else {
    net = safeCorrect;
  }

  // Net, 0'ın altına düşmez ve 2 ondalık basamağa yuvarlanır
  net = Math.max(0, Math.round(net * 100) / 100);

  const score =
    totalQuestions > 0 ? Math.round((net / totalQuestions) * 100) : 0;

  return {
    correctCount: safeCorrect,
    wrongCount: safeWrong,
    emptyCount,
    net,
    score,
  };
}

/**
 * Öğrencinin verdiği cevapları (answers) doğru cevap anahtarıyla (correctAnswers)
 * karşılaştırıp doğru/yanlış/boş sayısını çıkarır.
 * Beklenen format: { "1": "A", "2": "B", ... } şeklinde soru no -> şık
 */
export function compareAnswers(
  answers: Record<string, string | null | undefined>,
  correctAnswers: Record<string, string>
): { correctCount: number; wrongCount: number } {
  let correctCount = 0;
  let wrongCount = 0;

  for (const questionNo of Object.keys(correctAnswers)) {
    const given = answers?.[questionNo];
    const correct = correctAnswers[questionNo];

    if (!given) {
      continue; // boş bırakılmış
    }
    if (given === correct) {
      correctCount++;
    } else {
      wrongCount++;
    }
  }

  return { correctCount, wrongCount };
}
