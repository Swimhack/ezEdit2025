import { Router } from 'express';
import { FTPClient, FTPConfig } from '@ezedit/shared/src/ftp';

const router = Router();

router.get('/', async (req, res) => {
  // TODO: Validate and parse query params for FTP credentials and file path
  // Use FTPClient to read file content
  // Stream file content (text/binary)
  res.send(''); // placeholder
});

router.put('/', async (req, res) => {
  // TODO: Validate and parse body for FTP credentials, file path, and content
  // Use FTPClient to write file content
  res.send({ ok: true }); // placeholder
});

export default router; 