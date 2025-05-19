declare module 'zod' {
  export const z: any;
  export function infer<T extends ZodType<any>>(): any;
  export interface ZodType<T> {
    _output: T;
  }
}
