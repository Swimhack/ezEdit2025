import { Router } from 'express';
import OpenAI from 'openai';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

router.post('/refactor', async (req, res) => {
  // TODO: Validate and parse body for original code and user request
  // Use OpenAI to get a unified diff
  // Return the diff
  res.send({ diff: '' }); // placeholder
});

export default router; 