---
title: MDX Best Practices
sidebar_label: MDX Best Practices
---

# MDX Best Practices for Documentation

MDX is a powerful format that combines Markdown with JSX, but it has specific parsing rules that can cause compilation errors if not followed correctly.

## Common MDX Issues and Solutions

### 1. Less-Than Signs with Numbers

**❌ Problem:**
```markdown
The response time is &lt;100ms
Memory usage: &lt;512MB
```

**✅ Solution:**
```markdown
The response time is &lt;100ms
Memory usage: Less than 512MB
```

### 2. Comparison Operators in Tables

**❌ Problem:**
```markdown
| Metric | Value |
|--------|-------|
| Time   | &lt;5ms  |
| Size   | >1GB  |
```

**✅ Solution:**
```markdown
| Metric | Value |
|--------|-------|
| Time   | &lt;5ms |
| Size   | &gt;1GB |
```

### 3. HTML-like Syntax

**❌ Problem:**
```markdown
Use <Component prop=value> syntax
The <div> element
```

**✅ Solution:**
```markdown
Use `<Component prop=value>` syntax
The `<div>` element
```

## Prevention Tips

### 1. Use HTML Entities

Replace problematic characters with HTML entities:
- `<` → `&lt;`
- `>` → `&gt;`
- `&` → `&amp;`

### 2. Use Code Blocks

Wrap any code-like content in backticks:
```markdown
The command is `docker run -p 8080:80 nginx`
Use `<Component />` syntax
```

### 3. Alternative Phrasing

Instead of using symbols, use words:
- `&lt;100ms` → "less than 100ms"
- `>50%` → "greater than 50%"
- `>=10` → "10 or more"
- `<=5` → "5 or less"

## Automated Checking

### Run MDX Check Before Building

```bash
# Check for MDX issues
./scripts/fix-mdx-issues.sh ./docs true true

# Fix issues automatically
./scripts/fix-mdx-issues.sh ./docs false false
```

### Add to Package Scripts

```json
{
  "scripts": {
    "mdx:check": "./scripts/fix-mdx-issues.sh ./docs true false",
    "mdx:fix": "./scripts/fix-mdx-issues.sh ./docs false false",
    "prebuild": "npm run mdx:check"
  }
}
```

## Quick Reference

| Pattern | Issue | Fix |
|---------|-------|-----|
| `&lt;100` | Parsed as JSX tag | `&lt;100` or "less than 100" |
| `>50` | Potential issue | `&gt;50` or "greater than 50" |
| `<=` | Parsed as JSX | `&lt;=` or "less than or equal to" |
| `>=` | Parsed as JSX | `&gt;=` or "greater than or equal to" |
| `<div>` | HTML tag | `` `<div>` `` (in backticks) |

## Testing Your Documentation

Always test your documentation after making changes:

```bash
# Start development server
pnpm start

# Build for production
pnpm build
```

## VS Code Extensions

Consider using these extensions for better MDX support:
- MDX Language Support
- Prettier with MDX support
- markdownlint

## Escape Sequences

If you need to display special characters literally:

| Character | Escape Sequence |
|-----------|----------------|
| `<` | `&lt;` |
| `>` | `&gt;` |
| `&` | `&amp;` |
| `"` | `&quot;` |
| `'` | `&apos;` |

Remember: When in doubt, wrap it in backticks or use HTML entities!