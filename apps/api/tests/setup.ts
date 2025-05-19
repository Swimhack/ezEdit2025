import { vi } from 'vitest';
import * as creds from '../../src/lib/creds';
import { MockFtp } from './helpers/mockFtp';

vi.spyOn(creds, 'getFtp').mockImplementation(async () => {
  const ftp = new MockFtp();
  ftp.data.set('/index.html', Buffer.from('<h1>Hello</h1>'));
  return ftp as any;
}); 