declare module 'zod' {
  export const z: any;
  export type infer<T> = T extends ZodType<infer R> ? R : never;
  export interface ZodType<T> {
    _output: T;
  }
}
