import { Router } from 'express';
import { z } from 'zod';
import { getSampleQuestion, scoreSample } from '../services/practice.js';

export const practiceRouter = Router();
const answerSchema = z.object({
  questionId: z.string().min(1).max(100),
  optionId: z.enum(['a', 'b', 'c', 'd']),
}).strict();

practiceRouter.get('/question', (_req, res) => res.json({ data: getSampleQuestion() }));

practiceRouter.post('/answer', (req, res) => {
  const parsed = answerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { message: 'Choose a valid answer for this question.' } });
  const result = scoreSample(parsed.data.questionId, parsed.data.optionId);
  if (!result) return res.status(404).json({ error: { message: 'Practice question not found.' } });
  return res.json({ data: result });
});
