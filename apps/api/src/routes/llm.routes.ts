/**
 * LLM Routes
 * API endpoints for OpenAI LLM operations
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import { promptLLM, LlmRequestSchema } from '../lib/openaiClient';
import { z } from 'zod';

const router: Router = Router();

/**
 * Send prompt to LLM and get completion
 * POST /api/llm/prompt
 */
router.post('/prompt', async (req: Request, res: Response) => {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'
      });
    }
    
    // Validate request body
    const request = LlmRequestSchema.parse(req.body);
    
    // Send prompt to LLM
    const response = await promptLLM(request);
    
    res.status(200).json({
      success: true,
      model: request.model,
      prompt: request.prompt,
      response
    });
    
  } catch (error) {
    console.error('LLM request error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid LLM request parameters',
        errors: error.errors
      });
    }
    
    const errorStatus = error instanceof Error && 'status' in error ? (error as any).status : 500;
    res.status(errorStatus).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Check if OpenAI integration is properly configured
 * GET /api/llm/status
 */
router.get('/status', (_req: Request, res: Response) => {
  const isConfigured = !!process.env.OPENAI_API_KEY;
  
  res.status(200).json({
    success: true,
    configured: isConfigured,
    message: isConfigured 
      ? 'OpenAI API integration is properly configured' 
      : 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'
  });
});

export default router;
