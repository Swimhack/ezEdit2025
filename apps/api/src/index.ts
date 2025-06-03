// Required dependencies: dotenv-flow, express, cors, helmet
import * as dotenv from 'dotenv-flow';
dotenv.config();

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { HttpError, ServerError } from './lib/httpError';
import { attachUser } from './lib/auth';

// Import routes
import ftpRouter from './routes/ftp';
import sftpRouter from './routes/sftp.routes';
import sftpClientRouter from './routes/sftp-client.routes';
import llmRouter from './routes/llm.routes';

// Import placeholders until these routes are properly implemented
const files = express.Router();
files.get('/', (_req, res) => res.json({ status: 'ok' }));

const refactor = express.Router();
refactor.post('/', (_req, res) => res.json({ status: 'ok' }));

const chatRouter = express.Router();
chatRouter.post('/', (_req, res) => res.json({ status: 'ok' }));

const app: express.Application = express();
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(attachUser);

// Root route handler for API health check
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'ezEdit API Server is running',
    version: '1.0.0',
    endpoints: [
      '/ftp/connect - Test FTP connection',
      '/ftp/list - List FTP directory contents',
      '/ftp/content - Get or update file content',
      '/ftp/directory - Create directory',
      '/ftp/file - Delete file',
      '/ftp/directory - Delete directory',
      '/sftp/connect - Test SFTP connection',
      '/sftp/list - List SFTP directory contents',
      '/sftp/read - Read file content',
      '/sftp/write - Write file content',
      '/sftp/directory - Create directory',
      '/sftp/file - Delete file',
      '/sftp/directory - Delete directory',
      '/api/sftp-client/connect - Test SFTP connection (new client)',
      '/api/sftp-client/list - List SFTP directory contents',
      '/api/sftp-client/read - Read file content',
      '/api/sftp-client/write - Write file content',
      '/api/llm/prompt - Send prompt to LLM',
      '/api/llm/status - Check LLM integration status'
    ]
  });
});

// Mount route handlers
app.use('/api', chatRouter);
app.use('/ftp', ftpRouter);
app.use('/sftp', sftpRouter);
app.use('/api/sftp-client', sftpClientRouter);
app.use('/api/llm', llmRouter);

app.use('/files', files);
app.use('/ai/refactor', refactor);

app.use(
  (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const e = err instanceof HttpError ? err : ServerError(String(err));
    res.status(e.status).json({ error: e.message });
  }
);

// TODO: /files, /content, /ai/refactor

export default app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
  });
} 