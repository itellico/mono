---
title: MDX Best Practices
description: Guidelines for writing MDX-compatible markdown documentation
---

# MDX Best Practices

This guide helps prevent common MDX compilation errors when writing documentation.

## Understanding MDX

MDX is a format that combines Markdown with JSX (React components). Because of this, certain patterns in your markdown can be misinterpreted as JSX syntax, causing compilation errors.

## Common MDX Issues and Solutions

### 1. Less Than Symbol with Numbers

**Problem**: Writing `<10ms` or `<100` is interpreted as an opening JSX tag.

**Solution**: Use HTML entities:
- Replace `<` with `&lt;`
- Replace `>` with `&gt;`

**Examples**:
```markdown
❌ Wrong: Target latency <10ms
✅ Correct: Target latency &lt;10ms

❌ Wrong: Performance >90% required
✅ Correct: Performance &gt;90% required
```

### 2. Comparison Operators

**Problem**: Mathematical comparisons like `x < 10` can cause issues.

**Solution**: Use HTML entities or wrap in inline code:
```markdown
❌ Wrong: If count < 10 then...
✅ Correct: If count &lt; 10 then...
✅ Also correct: If `count < 10` then...
```

### 3. Generic Type Parameters

**Problem**: TypeScript generics like `Array<string>` are misinterpreted.

**Solution**: Always wrap code in backticks:
```markdown
❌ Wrong: Use Array<string> for string arrays
✅ Correct: Use `Array<string>` for string arrays
```

### 4. HTML Comments

**Problem**: HTML comments can sometimes interfere with MDX parsing.

**Solution**: Use MDX comments instead:
```markdown
❌ Wrong: <!-- This is a comment -->
✅ Correct: {/* This is an MDX comment */}
```

## Prevention Tips

### 1. Use the MDX Fixer Script

We have a script that automatically fixes common MDX issues:

```bash
# Check for issues (dry run)
node scripts/fix-mdx-issues.js --dry-run docs

# Fix issues automatically
node scripts/fix-mdx-issues.js docs
```

### 2. Test Your Changes

Always build the documentation locally before committing:
```bash
pnpm build
```

### 3. Common Patterns to Watch For

Be extra careful when writing:
- Performance metrics (e.g., `<10ms`, `>90%`)
- Mathematical expressions
- Code snippets outside of code blocks
- Comparison operators in text

### 4. Safe Alternatives

When in doubt, use these safe alternatives:
- Wrap code in backticks: `` `<10ms` ``
- Use HTML entities: `&lt;`, `&gt;`, `&amp;`
- Use code blocks for longer snippets
- Use words instead of symbols: "less than 10ms"

## Quick Reference

| Pattern | Problem | Solution |
|---------|---------|----------|
| `<10` | Interpreted as JSX | `&lt;10` or `` `<10` `` |
| `>90` | Interpreted as JSX | `&gt;90` or `` `>90` `` |
| `Array<T>` | Generic syntax | `` `Array<T>` `` |
| `<!-- comment -->` | HTML comment | `{/* comment */}` |
| `a < b` | Comparison | `a &lt; b` or `` `a < b` `` |

## Automated Fixing

If you encounter MDX compilation errors, run:

```bash
# For specific files
node scripts/fix-mdx-issues-simple.js

# For all documentation
node scripts/fix-mdx-issues.js docs --verbose
```

## VS Code Extension

Consider installing the [MDX VS Code extension](https://marketplace.visualstudio.com/items?itemName=unifiedjs.vscode-mdx) for syntax highlighting and error detection while writing.

## Additional Resources

- [MDX Documentation](https://mdxjs.com/)
- [Docusaurus MDX Guide](https://docusaurus.io/docs/markdown-features)
- [HTML Entity Reference](https://developer.mozilla.org/en-US/docs/Glossary/Entity)