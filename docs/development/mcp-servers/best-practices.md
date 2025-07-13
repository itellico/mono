---
title: MCP Documentation Best Practices
sidebar_label: Best Practices
description: Guidelines for documenting and organizing MCP servers
---

# MCP Documentation Best Practices

Guidelines for maintaining clear, organized, and useful MCP server documentation.

## Documentation Structure

### Recommended Organization

```
/docs/development/mcp-servers/
├── index.md                    # Overview and server list
├── [server-name]-server.md     # Individual server docs
├── best-practices.md           # This file
└── troubleshooting.md          # Common issues
```

### Why This Structure?

1. **Centralized Location**: All MCP documentation in one place
2. **Consistent Naming**: `[name]-server.md` pattern
3. **Easy Discovery**: Clear hierarchy under development tools
4. **Scalable**: Easy to add new servers

## Individual Server Documentation

### Required Sections

Each MCP server documentation should include:

1. **Overview**
   - Purpose and capabilities
   - Key features
   - When to use

2. **Configuration**
   - Environment variables
   - Setup instructions
   - Claude Desktop config

3. **Available Functions**
   - Function signatures
   - Parameter descriptions
   - Return values
   - Examples

4. **Usage Examples**
   - Common scenarios
   - Code snippets
   - Integration patterns

5. **Best Practices**
   - Recommended patterns
   - Performance tips
   - Security considerations

6. **Troubleshooting**
   - Common issues
   - Debug strategies
   - Error messages

### Documentation Template

```markdown
---
title: [Name] MCP Server
sidebar_label: [Name] Server
description: [Brief description]
---

# [Name] MCP Server

[Brief introduction of what this server does]

## Overview

[Detailed explanation of capabilities]

## Configuration

### Environment Variables
```bash
VARIABLE_NAME=value
```

### Claude Desktop Setup
```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["path/to/server.js"]
    }
  }
}
```

## Available Functions

### function_name
```javascript
mcp__server-name__function_name({
  param1: "value",
  param2: 123
});
```

[Function description and examples]

## Usage Examples

[Real-world scenarios]

## Best Practices

[Recommendations]

## Troubleshooting

[Common issues and solutions]
```

## Naming Conventions

### File Names
- Use kebab-case: `kanboard-server.md`
- Include "-server" suffix
- Match server identifier

### Function Names
- Format: `mcp__[server]__[function]`
- Use underscores in prefix
- Keep function names clear

### Page Titles
- Format: "[Name] MCP Server"
- Use proper capitalization
- Be descriptive

## Content Guidelines

### Code Examples

✅ **Do:**
```javascript
// Clear, working example
await mcp__kanboard-mcp__create_task({
  title: "Implement user dashboard",
  project_id: 1,
  description: "Create responsive dashboard"
});
```

❌ **Don't:**
```javascript
// Vague, incomplete example
mcp_function({ data: "..." });
```

### Parameter Documentation

✅ **Do:**
```markdown
**Parameters:**
- `title` (required) - Task title, max 255 characters
- `project_id` (optional) - Project ID, defaults to 1
- `priority` - 0 (low) to 3 (urgent)
```

❌ **Don't:**
```markdown
Parameters: title, project_id, priority
```

### Integration Examples

Show how servers work together:

```javascript
// 1. Search documentation
const docs = await mcp__docs-mcp__search_documentation({
  query: "user authentication"
});

// 2. Find UI prototype
const prototype = await mcp__click-dummy-mcp__search_click_dummy({
  query: "login form"
});

// 3. Create implementation task
await mcp__kanboard-mcp__create_task({
  title: "Implement authentication",
  description: `Docs: ${docs.url}\nPrototype: ${prototype.url}`
});
```

## Maintenance

### Regular Updates

1. **Version Changes**: Update when server changes
2. **New Functions**: Document immediately
3. **Deprecations**: Mark clearly
4. **Examples**: Keep current

### Review Checklist

- [ ] All functions documented
- [ ] Examples are working
- [ ] Configuration is accurate
- [ ] Troubleshooting is helpful
- [ ] Links are valid
- [ ] Code formatting is consistent

## Cross-References

### Internal Links
```markdown
See [Kanboard Server](./kanboard-server.md) for task management
```

### External Links
```markdown
[MCP Protocol Spec](https://modelcontextprotocol.io)
```

### Related Documentation
Always include "Related Documentation" section:
```markdown
## Related Documentation

- [MCP Servers Overview](./)
- [Development Workflows](../workflows/)
- [API Documentation](../../api/)
```

## Common Pitfalls

### 1. Documentation in Root
❌ Don't place MCP docs in `/docs/` root
✅ Use `/docs/development/mcp-servers/`

### 2. Missing Examples
❌ Don't just list functions
✅ Provide real usage examples

### 3. Outdated Information
❌ Don't leave old configs
✅ Update with server changes

### 4. Poor Organization
❌ Don't scatter MCP docs
✅ Keep all in one section

## Migration Guide

If you have MCP documentation in the wrong location:

1. **Create Redirect**
   ```markdown
   ---
   title: [Old Title] (Moved)
   ---
   
   # Documentation Moved
   
   See: [New Location](./development/mcp-servers/[name]-server.md)
   ```

2. **Move Content**
   - Copy to new location
   - Update internal links
   - Improve organization

3. **Update References**
   - Search for old links
   - Update to new location
   - Test all links

## Benefits of Proper Organization

1. **Discoverability**: Easy to find all MCP servers
2. **Consistency**: Uniform documentation style
3. **Maintenance**: Simple to update
4. **Onboarding**: New developers understand quickly
5. **Integration**: Clear how servers work together

## Related Documentation

- [MCP Servers Overview](./)
- [Documentation Guidelines](../../mdx-best-practices.md)
- [Development Tools](../tools/)