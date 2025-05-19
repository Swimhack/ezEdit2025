import { Router }        from 'express';
import { z }             from 'zod';
import { catchAsync }    from '../lib/catchAsync';
import { getFtp }        from '../lib/creds';
import { getDiff }       from '../lib/ai';
import { supa }          from '../lib/supa';

export const refactor = Router();

/* POST /ai/refactor/:siteId */
refactor.post('/:siteId', catchAsync(async (req, res) => {
  const { siteId } = req.params;
  const { path, prompt } = z.object({
    path: z.string(),
    prompt: z.string().min(3),
  }).parse(req.body);

  const ftp = await getFtp(siteId, req.user.id);
  const original = (await ftp.read(path)).toString('utf8');
  const diff = await getDiff(original, prompt);
  await ftp.close();

  if (!diff?.startsWith('---')) return res.status(422).json({ error: 'Invalid diff' });

  // Optional: audit log
  await supa.from('file_events').insert({
    site_id : siteId,
    path,
    action  : 'update',
    prev_size : original.length,
    next_size : diff.length,
    who     : req.user.id,
  });

  res.json({ diff });
})); 