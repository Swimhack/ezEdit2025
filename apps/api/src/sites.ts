import { Router } from 'express';
import { z } from 'zod';
import { saveSite } from './lib/saveSite';
import { supa } from './lib/supa';
import type { SiteCred } from 'packages/shared/src/schemas';

const router = Router();

// GET /sites - list user's sites
router.get('/', async (req, res) => {
  if (!req.user?.sub) return res.status(401).json({ error: 'Unauthorized' });
  const { data, error } = await supa
    .from('mysites')
    .select('id, name, host, username, root_path, created_at')
    .eq('owner_id', req.user.sub);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /sites - create new site
router.post('/', async (req, res) => {
  if (!req.user?.sub) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const body = z.object({
      name: z.string().min(1),
      host: z.string().min(1),
      username: z.string().min(1),
      password: z.string().min(1),
      rootPath: z.string().min(1).default('/'),
    }).parse(req.body);
    await saveSite(req.user.sub, body as SiteCred);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /sites/:id - update site
router.put('/:id', async (req, res) => {
  if (!req.user?.sub) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;
  try {
    const body = z.object({
      host: z.string().min(1),
      username: z.string().min(1),
      password: z.string().min(1),
      rootPath: z.string().min(1).default('/'),
    }).parse(req.body);
    // Encrypt new password
    const { data, error } = await supa.rpc('encrypt_pass', { raw: body.password });
    if (error) throw error;
    const { error: updErr } = await supa.from('mysites')
      .update({
        host: body.host,
        username: body.username,
        password: data,
        root_path: body.rootPath,
      })
      .eq('id', id)
      .eq('owner_id', req.user.sub);
    if (updErr) throw updErr;
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /sites/:id - delete site
router.delete('/:id', async (req, res) => {
  if (!req.user?.sub) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;
  const { error } = await supa.from('mysites')
    .delete()
    .eq('id', id)
    .eq('owner_id', req.user.sub);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

export default router; 