import { Router, Request, Response } from 'express';
import { db } from '../index';
import { opticalTemplates } from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

/**
 * "fields" (jsonb) alaninin standart yapisi -- hem web hem mobil bu yapiyi
 * uretip/tuketecek, ikisi de ayni backend'e bagli oldugu icin ekranlar
 * birbirinden bagimsiz gelistirilebilir.
 *
 * {
 *   imageWidth: number, imageHeight: number,
 *   corners: [{x,y}, {x,y}, {x,y}, {x,y}] | null,
 *   nameBlock: { x, y, width, height, rows, cols } | null,
 *   studentNoBlock: { x, y, width, height, rows, cols } | null,
 *   answerBlocks: [
 *     { subjectLabel, startQuestion, questionCount, optionCount, x, y, width, height }
 *   ]
 * }
 */

router.get('/', async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user?.id;
    const templates = await db.select().from(opticalTemplates).where(eq(opticalTemplates.teacherId, teacherId));
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ message: 'Sablonlar getirilirken hata olustu', error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user?.id;
    const id = parseInt(req.params.id);
    const [template] = await db
      .select()
      .from(opticalTemplates)
      .where(and(eq(opticalTemplates.id, id), eq(opticalTemplates.teacherId, teacherId)));
    if (!template) {
      return res.status(404).json({ message: 'Sablon bulunamadi' });
    }
    res.json(template);
  } catch (error: any) {
    res.status(500).json({ message: 'Sablon getirilirken hata olustu', error: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user?.id;
    const { name, type, fields, previewImage } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Sablon adi zorunludur.' });
    }
    if (!type || !['4_choice', '5_choice'].includes(type)) {
      return res.status(400).json({ message: 'Gecersiz secenek turu (4_choice veya 5_choice olmali).' });
    }
    if (!fields) {
      return res.status(400).json({ message: 'fields (isaretlenen alanlar) zorunludur.' });
    }

    const [created] = await db.insert(opticalTemplates).values({
      teacherId,
      name: name.trim(),
      type,
      fields,
      previewImage: previewImage || null,
      createdAt: new Date(),
    }).returning();

    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ message: 'Sablon olusturulurken hata olustu', error: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user?.id;
    const id = parseInt(req.params.id);
    const { name, type, fields, previewImage } = req.body;

    const [existing] = await db
      .select()
      .from(opticalTemplates)
      .where(and(eq(opticalTemplates.id, id), eq(opticalTemplates.teacherId, teacherId)));
    if (!existing) {
      return res.status(404).json({ message: 'Sablon bulunamadi' });
    }

    const [updated] = await db.update(opticalTemplates)
      .set({
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(fields !== undefined && { fields }),
        ...(previewImage !== undefined && { previewImage }),
      })
      .where(eq(opticalTemplates.id, id))
      .returning();

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: 'Sablon guncellenirken hata olustu', error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user?.id;
    const id = parseInt(req.params.id);

    const [existing] = await db
      .select()
      .from(opticalTemplates)
      .where(and(eq(opticalTemplates.id, id), eq(opticalTemplates.teacherId, teacherId)));
    if (!existing) {
      return res.status(404).json({ message: 'Sablon bulunamadi' });
    }

    await db.delete(opticalTemplates).where(eq(opticalTemplates.id, id));
    res.json({ message: 'Sablon silindi' });
  } catch (error: any) {
    res.status(500).json({ message: 'Sablon silinirken hata olustu', error: error.message });
  }
});

export default router;
