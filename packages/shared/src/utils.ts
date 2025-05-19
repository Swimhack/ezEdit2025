import { z } from './zodSchemas';

/**
 * Validates data against a Zod schema and returns the validated data
 * @param schema The Zod schema to validate against
 * @param data The data to validate
 * @returns The validated data
 * @throws If validation fails
 */
export function validateData<T>(schema: any, data: unknown): T {
  return schema.parse(data);
}

/**
 * Validates data against a Zod schema and returns the validated data or null if validation fails
 * @param schema The Zod schema to validate against
 * @param data The data to validate
 * @returns The validated data or null if validation fails
 */
export function validateDataSafe<T>(schema: any, data: unknown): T | null {
  try {
    return schema.parse(data);
  } catch (error) {
    return null;
  }
}

/**
 * Formats a date as an ISO string
 * @param date The date to format
 * @returns The formatted date
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Generates a random UUID
 * @returns A random UUID
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}
