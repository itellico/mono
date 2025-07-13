/**
 * Shared utilities for all MCP servers
 */

import * as fs from 'fs';
import * as path from 'path';

export function readYamlFrontmatter(content: string): { frontmatter: any; markdown: string } {
  const lines = content.split('\n');
  
  if (lines[0] !== '---') {
    return { frontmatter: {}, markdown: content };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { frontmatter: {}, markdown: content };
  }

  const frontmatterContent = lines.slice(1, endIndex).join('\n');
  const markdownContent = lines.slice(endIndex + 1).join('\n').trim();

  // Simple YAML parsing for frontmatter
  const frontmatter: any = {};
  frontmatterContent.split('\n').forEach(line => {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      frontmatter[key] = value.replace(/^["']|["']$/g, '');
    }
  });

  return { frontmatter, markdown: markdownContent };
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function formatDate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export async function ensureDirectory(dirPath: string): Promise<void> {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function calculateCompletion(items: Array<{ status: string }>): number {
  if (items.length === 0) return 0;
  const completed = items.filter(item => item.status === 'completed').length;
  return Math.round((completed / items.length) * 100);
}