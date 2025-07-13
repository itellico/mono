#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { glob } from 'glob';
import * as ts from 'typescript';

interface MissingPermission {
  file: string;
  line: number;
  method: string;
  httpMethod: string;
}

function checkFile(filePath: string): MissingPermission[] {
  const content = readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );

  const missing: MissingPermission[] = [];
  let hasPublicOnClass = false;

  // Check if class has @Public decorator
  function checkClassDecorators(node: ts.Node) {
    if (ts.isClassDeclaration(node)) {
      const decorators = ts.getDecorators(node) || [];
      for (const decorator of decorators) {
        if (getDecoratorName(decorator) === 'Public') {
          hasPublicOnClass = true;
          break;
        }
      }
    }
    ts.forEachChild(node, checkClassDecorators);
  }
  checkClassDecorators(sourceFile);

  function visit(node: ts.Node) {
    if (ts.isMethodDeclaration(node) && node.name) {
      const decorators = ts.getDecorators(node) || [];
      let hasHttpDecorator = false;
      let httpMethod = '';
      let hasPermissionDecorator = false;
      let hasPublicDecorator = false;

      for (const decorator of decorators) {
        const decoratorName = getDecoratorName(decorator);
        
        if (['Get', 'Post', 'Put', 'Delete', 'Patch'].includes(decoratorName)) {
          hasHttpDecorator = true;
          httpMethod = decoratorName;
        }
        
        if (decoratorName === 'Permission' || decoratorName === 'Auth') {
          hasPermissionDecorator = true;
        }

        if (decoratorName === 'Public') {
          hasPublicDecorator = true;
        }
      }

      // Skip if method or class has @Public decorator, or has @Permission/@Auth decorator
      if (hasHttpDecorator && !hasPermissionDecorator && !hasPublicDecorator && !hasPublicOnClass) {
        const methodName = node.name.getText();
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        missing.push({
          file: filePath,
          line,
          method: methodName,
          httpMethod
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  function getDecoratorName(decorator: ts.Decorator): string {
    const expr = decorator.expression;
    if (ts.isCallExpression(expr) && ts.isIdentifier(expr.expression)) {
      return expr.expression.text;
    } else if (ts.isIdentifier(expr)) {
      return expr.text;
    }
    return '';
  }

  visit(sourceFile);
  return missing;
}

async function main() {
  const controllerFiles = await glob('**/*.controller.ts', {
    cwd: '/Users/mm2/dev_mm/mono/apps/api-nest/src',
    absolute: true
  });

  const allMissing: MissingPermission[] = [];

  for (const file of controllerFiles) {
    const missing = checkFile(file);
    allMissing.push(...missing);
  }

  if (allMissing.length === 0) {
    console.log('✅ All controller methods with HTTP decorators have @Permission decorators!');
  } else {
    console.log(`❌ Found ${allMissing.length} methods missing @Permission decorators:\n`);
    
    // Group by file
    const byFile = allMissing.reduce((acc, item) => {
      if (!acc[item.file]) acc[item.file] = [];
      acc[item.file].push(item);
      return acc;
    }, {} as Record<string, MissingPermission[]>);

    for (const [file, items] of Object.entries(byFile)) {
      console.log(`\n📁 ${file.replace('/Users/mm2/dev_mm/mono/apps/api-nest/src/', '')}`);
      for (const item of items) {
        console.log(`   Line ${item.line}: @${item.httpMethod}() ${item.method}()`);
      }
    }
  }
}

main().catch(console.error);