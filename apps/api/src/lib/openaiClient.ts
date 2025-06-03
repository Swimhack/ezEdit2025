/**
 * OpenAI Client Utility
 * Handles interactions with OpenAI's API for LLM capabilities
 */
import OpenAI from 'openai';
import { z } from 'zod';

// Initialize OpenAI with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// LLM Request Schema
export const LlmRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt text is required'),
  model: z.string().default('gpt-4o'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().positive().optional(),
  systemPrompt: z.string().optional(),
});

// LLM Request Type
export type LlmRequest = z.infer<typeof LlmRequestSchema>;

/**
 * Send a prompt to the OpenAI API and get a completion
 * 
 * @param request LLM request configuration
 * @returns Promise resolving to the LLM response
 */
export async function promptLLM(request: LlmRequest): Promise<string> {
  try {
    // Validate request
    const validatedRequest = LlmRequestSchema.parse(request);
    
    // Build messages array
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
    
    // Add system prompt if provided
    if (validatedRequest.systemPrompt) {
      messages.push({
        role: 'system',
        content: validatedRequest.systemPrompt
      });
    }
    
    // Add user prompt
    messages.push({
      role: 'user',
      content: validatedRequest.prompt
    });
    
    // Create completion
    const completion = await openai.chat.completions.create({
      model: validatedRequest.model,
      messages,
      temperature: validatedRequest.temperature,
      max_tokens: validatedRequest.maxTokens,
    });
    
    // Return the generated content
    return completion.choices[0].message.content || '';
    
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error(`Failed to get LLM response: ${error instanceof Error ? error.message : String(error)}`);
  }
}
