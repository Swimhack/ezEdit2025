#!/usr/bin/env node

/**
 * Tailwind Tokenizer
 * Converts Windsurf design tokens to Tailwind configuration
 */

const fs = require('fs');
const path = require('path');

// Check if file path is provided
if (process.argv.length < 3) {
  console.error('Usage: tailwind-tokenizer <tokens-file.json>');
  process.exit(1);
}

const tokensFilePath = process.argv[2];

// Read tokens file
try {
  const tokensData = fs.readFileSync(tokensFilePath, 'utf8');
  const tokens = JSON.parse(tokensData);
  
  // Generate Tailwind config
  const tailwindConfig = generateTailwindConfig(tokens);
  
  // Output to stdout
  console.log(tailwindConfig);
} catch (error) {
  console.error(`Error processing tokens file: ${error.message}`);
  process.exit(1);
}

/**
 * Generates a Tailwind config file from design tokens
 * @param {Object} tokens - Design tokens object
 * @returns {string} - Tailwind config as a string
 */
function generateTailwindConfig(tokens) {
  const config = {
    theme: {
      extend: {}
    }
  };
  
  // Map token categories to Tailwind config
  if (tokens.colors) {
    config.theme.extend.colors = tokens.colors;
  }
  
  if (tokens.spacing) {
    config.theme.extend.spacing = tokens.spacing;
  }
  
  if (tokens.borderRadius) {
    config.theme.extend.borderRadius = tokens.borderRadius;
  }
  
  if (tokens.fontFamily) {
    config.theme.extend.fontFamily = tokens.fontFamily;
  }
  
  if (tokens.fontSize) {
    config.theme.extend.fontSize = tokens.fontSize;
  }
  
  if (tokens.boxShadow) {
    config.theme.extend.boxShadow = tokens.boxShadow;
  }
  
  // Convert to ESM format
  return `/** @type {import('tailwindcss').Config} */
export default ${JSON.stringify(config, null, 2)};
`;
}
