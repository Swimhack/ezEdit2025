import { Router }        from 'express';
import { z }             from 'zod';
import { catchAsync }    from '../lib/catchAsync';
import { BadRequest }    from '../lib/httpError';
import { getFtp }        from '../lib/creds';
import { supa }          from '../lib/supa';

export const files = Router();

/* GET /files/:siteId */
files.get('/:siteId', catchAsync(async (req, res) => {
  const { siteId } = req.params;
  if (!siteId) throw BadRequest('siteId required');

  const ftp   = await getFtp(siteId, req.user.id);
  const root  = z.string().default('/').parse(req.query.root);
  const list  = await ftp.list(root);
  ftp.close();

  res.json(list.map(f => ({
    name: f.name,
    path: `${root}/${f.name}`.replace('//','/'),
    type: f.isDirectory ? 'dir' : 'file',
    size: f.size,
    mtime: f.modifiedAt.getTime(),
  })));
}));

/* GET /content/:siteId */
files.get('/:siteId/content', catchAsync(async (req, res) => {
  const { siteId } = req.params;
  const { path }   = z.object({ path: z.string() }).parse(req.query);

  const ftp = await getFtp(siteId, req.user.id);
  const buf = await ftp.read(path);
  ftp.close();

  res.send(buf);
}));

/* PUT /content/:siteId */
files.put('/:siteId/content', catchAsync(async (req, res) => {
  const { siteId } = req.params;
  const { path, content } = z.object({
    path: z.string(),
    content: z.string(),
  }).parse(req.body);

  const ftp = await getFtp(siteId, req.user.id);
  const prev = await ftp.read(path);
  await ftp.write(path, content);
  ftp.close();

  await supa.from('file_events').insert({
    site_id   : siteId,
    path,
    action    : 'update',
    prev_size : prev.length,
    next_size : content.length,
    who       : req.user.id,
  });

  res.json({ ok: true });
})); 