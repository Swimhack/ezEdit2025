#!/usr/bin/env node

/**
 * Component Generator
 * Converts Windsurf component definitions to React components
 */

const fs = require('fs');
const path = require('path');

// Check if file path is provided
if (process.argv.length < 4) {
  console.error('Usage: component-generator <components-file.json> <output-directory>');
  process.exit(1);
}

const componentsFilePath = process.argv[2];
const outputDirectory = process.argv[3];

// Ensure output directory exists
if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory, { recursive: true });
}

// Read components file
try {
  const componentsData = fs.readFileSync(componentsFilePath, 'utf8');
  const { components } = JSON.parse(componentsData);
  
  // Generate React components
  components.forEach(component => {
    const componentCode = generateReactComponent(component);
    const filePath = path.join(outputDirectory, `${component.name}.tsx`);
    fs.writeFileSync(filePath, componentCode);
    console.log(`Generated component: ${filePath}`);
  });
  
  console.log(`Successfully generated ${components.length} components`);
} catch (error) {
  console.error(`Error processing components file: ${error.message}`);
  process.exit(1);
}

/**
 * Generates a React component from a component definition
 * @param {Object} component - Component definition
 * @returns {string} - React component code
 */
function generateReactComponent(component) {
  const { name, description, className, variants, parts, props } = component;
  
  // Generate props interface
  let propsInterface = 'interface Props {\n';
  if (props) {
    Object.entries(props).forEach(([propName, propDef]) => {
      const optional = propDef.default !== undefined ? '' : '?';
      propsInterface += `  /** ${propDef.description} */\n`;
      propsInterface += `  ${propName}${optional}: ${propDef.type};\n`;
    });
  }
  propsInterface += '  className?: string;\n';
  propsInterface += '}\n\n';
  
  // Generate component function
  let componentFunction = '';
  
  if (variants) {
    // Component with variants
    componentFunction = `export function ${name}({ 
  variant = 'primary',
  className = '',
  children,
  ...props
}: Props & { variant?: '${variants.map(v => v.name).join('\' | \'')}' }) {
  const variantClasses = {
${variants.map(v => `    '${v.name}': '${v.className}'`).join(',\n')}
  };

  return (
    <button
      className={\`\${variantClasses[variant]} \${className}\`}
      {...props}
    >
      {children}
    </button>
  );
}`;
  } else if (parts) {
    // Component with parts (compound component)
    const mainComponentClass = className || '';
    
    componentFunction = `export function ${name}({ className = '', children, ...props }: Props) {
  return (
    <div className={\`${mainComponentClass} \${className}\`} {...props}>
      {children}
    </div>
  );
}

${parts.map(part => `
${name}.${capitalizeFirstLetter(part.name)} = function ${capitalizeFirstLetter(part.name)}({ className = '', children, ...props }: Props) {
  return (
    <div className={\`${part.className} \${className}\`} {...props}>
      {children}
    </div>
  );
};
`).join('\n')}`;
  } else {
    // Simple component
    componentFunction = `export function ${name}({ className = '', children, ...props }: Props) {
  return (
    <div className={\`${className || ''} \${className}\`} {...props}>
      {children}
    </div>
  );
}`;
  }
  
  // Assemble the full component file
  return `import React from 'react';

/**
 * ${description || name + ' component'}
 */
${propsInterface}${componentFunction}

export default ${name};

// Helper function
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
`;
}
