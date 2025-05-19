import { supa } from './supa';
import type { SiteCred } from 'packages/shared/src/schemas';

export async function saveSite(userId: string, body: SiteCred) {
  const { data, error } = await supa.rpc('encrypt_pass', { raw: body.password });
  if (error) throw error;

  const { error: insErr } = await supa.from('mysites').insert({
    owner_id: userId,
    name: body.name,
    host: body.host,
    username: body.username,
    password: data,           // encrypted bytea
    root_path: body.rootPath,
  });
  if (insErr) throw insErr;
} 