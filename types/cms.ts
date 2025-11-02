// ==================== CMS Connection Types ====================

export interface WordPressConnection {
  id: string;
  name: string;
  type: 'wordpress';
  siteUrl: string;
  username: string;
  applicationPassword: string;
  basePath?: string;
}

export interface WixConnection {
  id: string;
  name: string;
  type: 'wix';
  siteId: string;
  apiKey: string;
  refreshToken?: string;
}

export type CMSConnection = WordPressConnection | WixConnection;

// ==================== WordPress Types ====================

export interface WordPressPost {
  id: number;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  slug: string;
  status: 'publish' | 'draft' | 'pending' | 'private';
  modified: string;
  type: string;
}

export interface WordPressPage extends WordPressPost {}

export interface WordPressMedia {
  id: number;
  source_url: string;
  title: {
    rendered: string;
  };
  mime_type: string;
}

// ==================== Wix Types ====================

export interface WixPage {
  id: string;
  title: string;
  url: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  lastModified: string;
}

export interface WixCollection {
  id: string;
  displayName: string;
  fields: Array<{
    key: string;
    displayName: string;
    type: string;
  }>;
}

export interface WixDataItem {
  _id: string;
  [key: string]: any;
}

// ==================== Natural Language Editing ====================

export interface NLEditRequest {
  connectionId: string;
  resourceType: 'page' | 'post' | 'content';
  resourceId: string;
  instruction: string;
  context?: {
    currentContent?: string;
    metadata?: Record<string, any>;
  };
}

export interface NLEditResponse {
  success: boolean;
  updatedContent?: string;
  changes?: string[];
  error?: string;
}
