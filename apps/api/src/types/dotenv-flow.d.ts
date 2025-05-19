declare module 'dotenv-flow' {
  export function config(options?: {
    node_env?: string;
    default_node_env?: string;
    path?: string;
    pattern?: string;
    silent?: boolean;
  }): { parsed: { [key: string]: string } } | undefined;
  
  export function load(options?: {
    node_env?: string;
    default_node_env?: string;
    path?: string;
    pattern?: string;
    silent?: boolean;
  }): { [key: string]: string };
  
  export function parse(src: string): { [key: string]: string };
}
