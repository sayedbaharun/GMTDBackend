const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to update import statements in a file
function updateImports(filePath) {
  try {
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the express import statement for Router
    content = content.replace(
      /import\s+{\s*Router\s*}\s+from\s+['"]express['"];/g,
      `import * as express from 'express';\nconst Router = express.Router;`
    );
    
    // Replace the express import statement
    content = content.replace(
      /import\s+express\s+from\s+['"]express['"];/g,
      `import * as express from 'express';`
    );
    
    // Replace the types import statement
    content = content.replace(
      /import\s+{\s*Request,\s*Response,\s*NextFunction\s*}\s+from\s+['"]express['"];/g,
      `import * as express from 'express';\ntype Request = express.Request;\ntype Response = express.Response;\ntype NextFunction = express.NextFunction;`
    );
    
    // Replace the Request type import statement
    content = content.replace(
      /import\s+{\s*Request\s*}\s+from\s+['"]express['"];/g,
      `import * as express from 'express';\ntype Request = express.Request;`
    );
    
    // Replace the Response type import statement
    content = content.replace(
      /import\s+{\s*Response\s*}\s+from\s+['"]express['"];/g,
      `import * as express from 'express';\ntype Response = express.Response;`
    );
    
    // Replace raw express middleware
    content = content.replace(
      /express\.raw\(/g,
      'express.raw('
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    
    console.log(`Updated imports in ${filePath}`);
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Get all TypeScript files in the project
function getAllTypeScriptFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Recurse into subdirectories
      results = results.concat(getAllTypeScriptFiles(filePath));
    } else if (file.endsWith('.ts')) {
      results.push(filePath);
    }
  });
  
  return results;
}

// Get all TypeScript files
const srcDir = path.join(__dirname, 'src');
const tsFiles = getAllTypeScriptFiles(srcDir);

// Update imports in each TypeScript file
tsFiles.forEach(file => {
  updateImports(file);
});

console.log('Import statements have been updated in all TypeScript files.');

// Restart the TypeScript build workflow
console.log('Starting TypeScript build...');
try {
  execSync('npx tsc');
  console.log('TypeScript build completed successfully.');
} catch (error) {
  console.error('TypeScript build failed:', error.message);
}