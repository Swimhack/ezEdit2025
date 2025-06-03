/**
 * LLM Service
 * Frontend service for interacting with the OpenAI LLM API
 */
import axios from 'axios';

/**
 * LLM Request interface
 */
export interface LlmRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * LLM Response interface
 */
export interface LlmResponse {
  success: boolean;
  model?: string;
  prompt?: string;
  response?: string;
  message?: string;
}

/**
 * LLM Service
 */
export class LlmService {
  private baseUrl: string;

  constructor() {
    // Use environment variable or default to localhost:3000
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }

  /**
   * Check if LLM integration is configured
   * 
   * @returns Promise resolving to status information
   */
  public async checkStatus(): Promise<{ success: boolean; configured: boolean; message: string }> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/llm/status`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        configured: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Send prompt to LLM and get completion
   * 
   * @param request LLM request options
   * @returns Promise resolving to LLM response
   */
  public async sendPrompt(request: LlmRequest): Promise<LlmResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/llm/prompt`, request);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Export singleton instance
export const llmService = new LlmService();
