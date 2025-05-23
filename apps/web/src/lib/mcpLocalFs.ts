// super-barebones helper – no error handling
export async function listDir(path = ".") {
  return (await window.mcp.localfs.list_directory({ path }))?.entries ?? [];
}

export async function readFile(path: string) {
  return await window.mcp.localfs.read_file({ path });
}

export async function writeFile(path: string, content: string) {
  return await window.mcp.localfs.write_file({
    path,
    content
  });
}

// Add TypeScript type declaration for window.mcp
declare global {
  interface Window {
    mcp: {
      localfs: {
        list_directory: (params: { path: string }) => Promise<{ entries: any[] }>;
        read_file: (params: { path: string }) => Promise<string>;
        write_file: (params: { path: string, content: string }) => Promise<any>;
      }
    }
  }
}
