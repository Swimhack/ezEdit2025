/**
 * Monaco Editor language detection and configuration
 * Maps file extensions to Monaco Editor language identifiers
 */

/**
 * File extension to Monaco language mapping
 */
const LANGUAGE_MAP: Record<string, string> = {
  // JavaScript & TypeScript
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',

  // Web technologies
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',

  // Data formats
  '.json': 'json',
  '.xml': 'xml',
  '.yaml': 'yaml',
  '.yml': 'yaml',

  // Programming languages
  '.php': 'php',
  '.py': 'python',
  '.java': 'java',
  '.c': 'c',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.cs': 'csharp',
  '.go': 'go',
  '.rs': 'rust',
  '.rb': 'ruby',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.scala': 'scala',
  '.clj': 'clojure',
  '.fs': 'fsharp',
  '.vb': 'vb',

  // Shell & Scripts
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',
  '.fish': 'shell',
  '.ps1': 'powershell',
  '.bat': 'bat',
  '.cmd': 'bat',

  // SQL
  '.sql': 'sql',
  '.mysql': 'mysql',
  '.pgsql': 'pgsql',

  // Markup & Documentation
  '.md': 'markdown',
  '.markdown': 'markdown',
  '.rst': 'restructuredtext',
  '.tex': 'latex',

  // Configuration
  '.ini': 'ini',
  '.cfg': 'ini',
  '.conf': 'ini',
  '.toml': 'toml',
  '.dockerfile': 'dockerfile',
  '.dockerignore': 'plaintext',
  '.gitignore': 'plaintext',
  '.gitattributes': 'plaintext',
  '.editorconfig': 'ini',
  '.env': 'plaintext',
  '.env.local': 'plaintext',
  '.env.development': 'plaintext',
  '.env.production': 'plaintext',

  // Web frameworks
  '.vue': 'vue',
  '.svelte': 'svelte',

  // Other formats
  '.r': 'r',
  '.m': 'objective-c',
  '.mm': 'objective-cpp',
  '.pl': 'perl',
  '.lua': 'lua',
  '.dart': 'dart',
  '.elm': 'elm',
  '.haskell': 'haskell',
  '.hs': 'haskell',
  '.ml': 'ocaml',
  '.pas': 'pascal',
  '.ada': 'ada'
};

/**
 * Get Monaco Editor language identifier from filename
 */
export function getLanguageFromFilename(filename: string): string {
  // Extract extension
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) {
    // Check for special files without extensions
    const basename = filename.toLowerCase();
    if (basename === 'dockerfile') return 'dockerfile';
    if (basename === 'makefile') return 'makefile';
    if (basename === 'rakefile') return 'ruby';
    if (basename === 'gemfile') return 'ruby';
    if (basename === 'podfile') return 'ruby';
    return 'plaintext';
  }

  const extension = filename.substring(lastDot).toLowerCase();
  return LANGUAGE_MAP[extension] || 'plaintext';
}

/**
 * Check if a file is supported by Monaco Editor
 */
export function isLanguageSupported(filename: string): boolean {
  const language = getLanguageFromFilename(filename);
  return language !== 'plaintext' || hasSpecialHandling(filename);
}

/**
 * Check if filename has special handling (files without extensions)
 */
function hasSpecialHandling(filename: string): boolean {
  const basename = filename.toLowerCase();
  return ['dockerfile', 'makefile', 'rakefile', 'gemfile', 'podfile'].includes(basename);
}

/**
 * Get file icon based on language/extension
 */
export function getLanguageIcon(filename: string): string {
  const language = getLanguageFromFilename(filename);

  const iconMap: Record<string, string> = {
    javascript: '📄',
    typescript: '📘',
    html: '🌐',
    css: '🎨',
    scss: '🎨',
    sass: '🎨',
    less: '🎨',
    json: '📋',
    xml: '📄',
    yaml: '📄',
    php: '📄',
    python: '🐍',
    java: '☕',
    c: '📄',
    cpp: '📄',
    csharp: '📄',
    go: '📄',
    rust: '🦀',
    ruby: '💎',
    swift: '📄',
    kotlin: '📄',
    shell: '🐚',
    powershell: '📄',
    sql: '🗄️',
    markdown: '📝',
    dockerfile: '🐳',
    vue: '💚',
    svelte: '🟠'
  };

  return iconMap[language] || '📄';
}

/**
 * Monaco Editor theme configuration
 */
export const MONACO_THEMES = {
  light: 'light',
  dark: 'vs-dark',
  'high-contrast': 'hc-black'
} as const;

/**
 * Default Monaco Editor options
 */
export const DEFAULT_MONACO_OPTIONS = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: 'on' as const,
  minimap: { enabled: true },
  automaticLayout: true,
  scrollBeyondLastLine: false,
  renderWhitespace: 'selection' as const,
  folding: true,
  lineNumbers: 'on' as const,
  rulers: [80, 120],
  bracketPairColorization: { enabled: true },
  suggestOnTriggerCharacters: true,
  quickSuggestions: true,
  parameterHints: { enabled: true },
  formatOnPaste: true,
  formatOnType: true
};

/**
 * Language-specific Monaco Editor options
 */
export function getLanguageOptions(language: string): Partial<typeof DEFAULT_MONACO_OPTIONS> {
  switch (language) {
    case 'markdown':
      return {
        wordWrap: 'on' as const
      };

    case 'json':
      return {
        formatOnPaste: true,
        formatOnType: true
      };

    case 'yaml':
    case 'yml':
      return {
        tabSize: 2
      };

    case 'python':
      return {
        tabSize: 4
      };

    case 'go':
      return {
        tabSize: 4
      };

    default:
      return {};
  }
}