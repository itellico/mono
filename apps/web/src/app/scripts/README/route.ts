import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const scriptsReadmePath = join(process.cwd(), 'scripts', 'README.md');
    const content = readFileSync(scriptsReadmePath, 'utf-8');
    
    // Convert markdown to HTML for better display
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>itellico Mono Scripts Documentation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
      background: #fafafa;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1, h2, h3 { color: #333; }
    h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h2 { margin-top: 30px; }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Monaco', 'Menlo', monospace;
    }
    pre {
      background: #f8f8f8;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      border-left: 3px solid #007acc;
    }
    pre code { background: none; padding: 0; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th { background: #f8f9fa; font-weight: 600; }
    .emoji { font-size: 1.2em; }
    .nav-link {
      display: inline-block;
      margin: 10px 0;
      padding: 8px 16px;
      background: #007acc;
      color: white;
      text-decoration: none;
      border-radius: 4px;
    }
    .nav-link:hover { background: #005999; }
  </style>
</head>
<body>
  <div class="container">
    <div style="margin-bottom: 20px;">
      <a href="/admin" class="nav-link">← Back to Admin</a>
      <a href="/docs" class="nav-link">📚 Documentation Hub</a>
    </div>
    <pre style="white-space: pre-wrap; font-family: inherit; background: none; border: none; padding: 0;">${content}</pre>
  </div>
</body>
</html>`;

    return new NextResponse(htmlContent, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    console.error('Error serving scripts README:', error);
    return NextResponse.json(
      { error: 'Failed to load scripts documentation' },
      { status: 500 }
    );
  }
}