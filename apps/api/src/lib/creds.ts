import { supa } from './supa';
import { FTPClient } from 'packages/shared/ftp';

export async function getFtp(siteId: string, userId: string) {
  // RLS ensures the user can only see their own row
  const { data, error } = await supa
    .from('mysites')
    .select('host, username, decrypt_pass(password) as password, root_path')
    .eq('id', siteId)
    .single();

  if (error || !data) throw new Error(error?.message || 'Site not found');

  const ftp = new FTPClient(data.host, data.username, data.password);
  await ftp.connect();
  await ftp.cd(data.root_path ?? '/');
  return ftp; // remember to ftp.close() in the caller!
} 