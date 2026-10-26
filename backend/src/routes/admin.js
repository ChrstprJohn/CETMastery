import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middleware/admin.js';
import { HttpError } from '../middleware/errors.js';
import { getPrisma } from '../lib/prisma.js';
import { getSupabaseAuth } from '../services/supabase.js';

const common = {
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and single hyphens.'),
  sortOrder: z.number().int().min(0).max(2147483647),
  isPublished: z.boolean(),
};
const title = z.string().trim().min(1).max(120);
const description = z.string().trim().max(2000);
export const curriculumSchemas = {
  subjects: z.object({ ...common, name: title, description }).strict(),
  topics: z.object({ ...common, title, description, subjectId: z.uuid() }).strict(),
  lessons: z.object({ ...common, title, summary: description, content: z.string().max(200000), topicId: z.uuid() }).strict(),
};
const models = { subjects: 'subject', topics: 'topic', lessons: 'lesson' };
function parse(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, result.error.issues.map((issue) => `${issue.path.join('.') || 'Request'}: ${issue.message}`).join(' '));
  return result.data;
}

export function createAdminRouter({ getDatabase = getPrisma, getAuthClient = getSupabaseAuth, config } = {}) {
  const router = Router();
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.use(requireAdmin(getAuthClient, config, getDatabase));
  router.get('/session', (req, res) => res.json({ data: { mode: req.adminMode } }));
  for (const [resource, model] of Object.entries(models)) {
    const schema = curriculumSchemas[resource];
    router.get(`/${resource}`, async (_req, res) => {
      const include = resource === 'subjects' ? { _count: { select: { topics: true } } }
        : resource === 'topics' ? { subject: { select: { id: true, name: true } }, _count: { select: { lessons: true } } }
        : { topic: { select: { id: true, title: true, subjectId: true } } };
      const data = await getDatabase()[model].findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], include });
      res.json({ data });
    });
    router.post(`/${resource}`, async (req, res) => {
      const data = parse(schema, req.body);
      res.status(201).json({ data: await getDatabase()[model].create({ data }) });
    });
    router.put(`/${resource}/:id`, async (req, res) => {
      const id = parse(z.uuid(), req.params.id);
      const data = parse(schema, req.body);
      res.json({ data: await getDatabase()[model].update({ where: { id }, data }) });
    });
    router.delete(`/${resource}/:id`, async (req, res) => {
      const id = parse(z.uuid(), req.params.id);
      await getDatabase()[model].delete({ where: { id } });
      res.status(204).end();
    });
  }
  router.use((error, _req, _res, next) => {
    if (error.code === 'P2002') return next(new HttpError(409, 'This slug already exists in the selected parent. Choose another slug.'));
    if (error.code === 'P2003') return next(new HttpError(409, 'The selected parent no longer exists, or this entry still contains topics or lessons. Remove or move its children before deleting it.'));
    if (error.code === 'P2025') return next(new HttpError(404, 'This entry no longer exists. Refresh the list.'));
    next(error);
  });
  return router;
}
