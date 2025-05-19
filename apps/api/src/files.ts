import { Router } from 'express';
import { FTPClient, FTPConfig } from '@ezedit/shared/src/ftp';

const router = Router();

router.get('/', async (req, res) => {
  // TODO: Validate and parse query params for FTP credentials and path
  // Use FTPClient to list directory contents
  // Return directory tree metadata
  res.send([]); // placeholder
});

export default router; 