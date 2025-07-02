// Tool: run-command.js
// Executes shell commands using Node.js and returns the output.
// Expected input: { command: string }
// Returns: { success: boolean, output?: string, error?: string }

const { exec } = require('child_process');

module.exports = async function runCommandTool(input) {
  const { command } = input || {};
  return new Promise((resolve) => {
    if (!command || typeof command !== 'string') {
      resolve({ success: false, error: 'No command provided' });
      return;
    }

    exec(command, { shell: true }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, error: stderr || error.message });
      } else {
        resolve({ success: true, output: stdout });
      }
    });
  });
};
