// FTP operations wrapper for MCP
import type { Site } from '../stores/sites';
import type { FileEntry, FTPService } from './mcp-types';

/**
 * Set FTP credentials for the current session
 * @param site The site credentials to use for FTP connections
 */
export async function setFtpCredentials(site: Site) {
  return await window.mcp.ftp.set_credentials({
    host: site.host,
    user: site.user,
    password: site.pass,
    port: site.port || 21,
    secure: site.secure || false,
    passive: site.passive || true
  });
}

/**
 * List directory contents on the FTP server
 * @param path Directory path (defaults to root)
 * @returns Array of directory entries
 */
export async function listDir(path = "/"): Promise<FileEntry[]> {
  try {
    return (await window.mcp.ftp.list_directory({ path }))?.entries ?? [];
  } catch (error) {
    console.error("FTP list directory error:", error);
    throw error;
  }
}

/**
 * Read file contents from the FTP server
 * @param path File path to read
 * @returns File contents as string
 */
export async function readFile(path: string) {
  try {
    return await window.mcp.ftp.read_file({ path });
  } catch (error) {
    console.error(`FTP read file error for ${path}:`, error);
    throw error;
  }
}

/**
 * Write file contents to the FTP server
 * @param path File path to write
 * @param content Content to write
 */
export async function writeFile(path: string, content: string) {
  try {
    return await window.mcp.ftp.write_file({
      path,
      content
    });
  } catch (error) {
    console.error(`FTP write file error for ${path}:`, error);
    throw error;
  }
}

/**
 * Delete a file or directory on the FTP server
 * @param path Path to delete
 * @param isDirectory Whether the path is a directory
 */
export async function deleteItem(path: string, isDirectory: boolean) {
  try {
    return await window.mcp.ftp.delete_item({
      path,
      isDirectory
    });
  } catch (error) {
    console.error(`FTP delete error for ${path}:`, error);
    throw error;
  }
}

/**
 * Rename/move a file or directory on the FTP server
 * @param oldPath Current path
 * @param newPath New path
 */
export async function renameItem(oldPath: string, newPath: string) {
  try {
    return await window.mcp.ftp.rename_item({
      oldPath,
      newPath
    });
  } catch (error) {
    console.error(`FTP rename error from ${oldPath} to ${newPath}:`, error);
    throw error;
  }
}

// Note: Global type declarations are now in mcp-types.ts
