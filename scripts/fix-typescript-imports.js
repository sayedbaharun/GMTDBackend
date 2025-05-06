/**
 * This script automatically fixes Express import issues in the codebase
 * It addresses the most common TypeScript compilation errors with express types
 */

const fs = require('fs');
const path = require('path');

// Define the directories to process
const directories = [
  '../src/controllers',
  '../src/middleware',
  '../src/routes'
];

// Fix for the express.ts type definition file
const fixExpressTypes = () => {
  const expressTypesPath = path.join(__dirname, '..', 'src', 'types', 'express.ts');
  if (!fs.existsSync(expressTypesPath)) {
    console.error('Could not find express types file at:', expressTypesPath);
    return false;
  }
  
  const newContent = `import * as express from 'express';

// Define AuthenticatedRequest that extends Express Request
export interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    email: string;
    fullName?: string;
    phone?: string;
    companyName?: string;
    industry?: string;
    companySize?: string;
    role?: string;
    goals?: string[];
    subscriptionId?: string;
    subscriptionStatus?: string;
    onboardingStep?: string;
    onboardingComplete?: boolean;
    stripeCustomerId?: string;
    subscriptionTier?: string;
    isAdmin?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
}`;

  try {
    fs.writeFileSync(expressTypesPath, newContent);
    console.log('✅ Fixed express.ts types file');
    return true;
  } catch (error) {
    console.error('Error fixing express.ts types file:', error);
    return false;
  }
};

// Process each file in the specified directories
const processFile = (filePath) => {
  if (!filePath.endsWith('.ts')) return;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace imports from express
    if (content.includes('import { Request, Response') || 
        content.includes('import {Request, Response') ||
        content.includes('import {Request,Response')) {
      content = content.replace(/import\s*{(.*)}\s*from\s*['"]express['"]/g, 
                            `import * as express from 'express'`);
      modified = true;
    }
    
    // Replace AuthenticatedRequest import if needed
    if (content.includes('import { AuthenticatedRequest }') && !content.includes('from \'../types/express\'')) {
      content = content.replace(/import\s*{\s*AuthenticatedRequest\s*}\s*from\s*['"][^'"]+['"]/g, 
                            `import { AuthenticatedRequest } from '../types/express'`);
      modified = true;
    }
    
    // Replace direct usage of Request and Response
    if (content.includes(': Request') || content.includes(':Request')) {
      content = content.replace(/:\s*Request([,\)\s])/g, `: express.Request$1`);
      modified = true;
    }
    if (content.includes(': Response') || content.includes(':Response')) {
      content = content.replace(/:\s*Response([,\)\s])/g, `: express.Response$1`);
      modified = true;
    }
    if (content.includes(': NextFunction') || content.includes(':NextFunction')) {
      content = content.replace(/:\s*NextFunction([,\)\s])/g, `: express.NextFunction$1`);
      modified = true;
    }
    
    // Fix property name inconsistencies
    if (content.includes('onboarding_complete')) {
      content = content.replace(/onboarding_complete/g, 'onboardingComplete');
      modified = true;
    }
    if (content.includes('stripe_customer_id')) {
      content = content.replace(/stripe_customer_id/g, 'stripeCustomerId');
      modified = true;
    }
    if (content.includes('full_name')) {
      content = content.replace(/full_name/g, 'fullName');
      modified = true;
    }
    if (content.includes('subscription_id')) {
      content = content.replace(/subscription_id/g, 'subscriptionId');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed imports in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
};

// Process directories recursively
const processDirectory = (directory) => {
  const dirPath = path.join(__dirname, directory);
  
  if (!fs.existsSync(dirPath)) {
    console.error(`Directory not found: ${dirPath}`);
    return;
  }
  
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      processDirectory(path.join(directory, file));
    } else {
      processFile(filePath);
    }
  });
};

// Main execution
console.log('🔧 Starting TypeScript Express import fixes...');

// Fix the express.ts types file first
if (!fixExpressTypes()) {
  console.error('Failed to fix express.ts types file. Aborting.');
  process.exit(1);
}

// Process all directories
directories.forEach(dir => {
  console.log(`📁 Processing directory: ${dir}`);
  processDirectory(dir);
});

console.log('✨ Express import fixes completed!');
console.log('Now run "npx tsc" to check if there are any remaining TypeScript errors.');
