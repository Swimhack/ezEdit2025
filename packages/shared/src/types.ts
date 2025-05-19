// Define all types explicitly to avoid Zod inference issues

// User related types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
}

// Website related types
export interface Website {
  id: string;
  name: string;
  url: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Page related types
export interface Page {
  id: string;
  websiteId: string;
  path: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Edit related types
export interface Edit {
  id: string;
  pageId: string;
  userId: string;
  content: string;
  status: 'draft' | 'pending' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

// If you need to use Zod schemas for validation, import them from a separate file
// This allows types to be used without Zod dependencies
// Note: We're not exporting the Zod schemas in this file to avoid TypeScript errors
