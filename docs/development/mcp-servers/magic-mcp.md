---
title: Magic MCP Server
sidebar_label: Magic MCP
description: UI component generation and refinement
---

# Magic MCP Server

Generates and refines React UI components using AI-powered component libraries and design patterns.

## Overview

The Magic MCP server provides:
- AI-powered component generation
- UI refinement and redesign
- Component inspiration from libraries
- Logo search and integration
- Automatic code formatting

## Available Functions

### Component Builder

```javascript
mcp__magic-mcp__21st_magic_component_builder({
  message: "Create a user profile card with avatar and stats",
  searchQuery: "profile card",
  absolutePathToCurrentFile: "/Users/mm2/dev_mm/mono/apps/web/components/",
  absolutePathToProjectDirectory: "/Users/mm2/dev_mm/mono",
  standaloneRequestQuery: "User profile card with avatar, name, role, and statistics"
});
```

Triggered by:
- `/ui` command
- `/21` or `/21st` command
- Direct component requests

### Component Inspiration

```javascript
mcp__magic-mcp__21st_magic_component_inspiration({
  message: "Show me dashboard examples",
  searchQuery: "dashboard layout"
});
```

Returns:
- Component examples
- Design patterns
- Implementation ideas
- Library references

### Component Refiner

```javascript
mcp__magic-mcp__21st_magic_component_refiner({
  userMessage: "Make this form more modern with better UX",
  absolutePathToRefiningFile: "/path/to/component.tsx",
  context: "Improve form validation, add smooth transitions, modernize styling"
});
```

Refines existing components:
- Improves UI/UX
- Modernizes design
- Enhances accessibility
- Optimizes performance

### Logo Search

```javascript
mcp__magic-mcp__logo_search({
  queries: ["github", "discord", "slack"],
  format: "TSX" // TSX, JSX, or SVG
});
```

Returns:
- Company logos
- Icon components
- Import instructions
- Multiple formats

## Usage Examples

### Creating New Components

```javascript
// User: /ui Create a data table with sorting and filtering

// Magic MCP automatically:
// 1. Searches for table patterns
// 2. Generates component code
// 3. Includes sorting/filtering logic
// 4. Adds proper TypeScript types
```

### Refining Existing UI

```javascript
// User: /ui refine Make the dashboard cards more engaging

// Magic MCP:
// 1. Analyzes current component
// 2. Suggests improvements
// 3. Generates refined version
// 4. Maintains functionality
```

### Adding Logos

```javascript
// User: /logo GitHub Discord

// Returns:
// - GitHubIcon component
// - DiscordIcon component
// - Ready to import and use
```

## Component Patterns

### Generated Components Include:
- TypeScript types
- Tailwind CSS styling
- Accessibility features
- Responsive design
- Event handlers
- State management

### Example Output:
```typescript
interface UserCardProps {
  user: {
    name: string;
    avatar: string;
    role: string;
    stats: {
      posts: number;
      followers: number;
      following: number;
    };
  };
}

export function UserCard({ user }: UserCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Component implementation */}
    </div>
  );
}
```

## Best Practices

### 1. Clear Requests
- Be specific about requirements
- Mention styling preferences
- Include functionality needs
- Specify any constraints

### 2. Integration
```javascript
// After generation:
// 1. Review generated code
// 2. Adjust imports
// 3. Connect to data
// 4. Add to component library
```

### 3. Refinement Process
- Start with basic version
- Iterate with refinements
- Test accessibility
- Optimize performance

## Supported Libraries

The server draws inspiration from:
- Shadcn/ui
- Headless UI
- Radix UI
- Material-UI
- Ant Design
- Chakra UI
- Custom patterns

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Component too complex | Break into smaller parts |
| Styling conflicts | Check Tailwind config |
| Type errors | Review TypeScript types |
| Missing dependencies | Install required packages |

### Tips
1. Start simple, refine iteratively
2. Check generated imports
3. Verify accessibility
4. Test responsiveness

## Integration with Other Servers

### With Documentation
```javascript
// 1. Search for patterns
const patterns = await mcp__docs-mcp__get_code_patterns({
  pattern_type: "component",
  technology: "react"
});

// 2. Generate component
await mcp__magic-mcp__21st_magic_component_builder({
  message: "Create based on pattern",
  // Include pattern context
});
```

### With Click-dummy
```javascript
// 1. Find UI prototype
const prototype = await mcp__click-dummy-mcp__search_click_dummy({
  query: "user dashboard"
});

// 2. Generate matching component
await mcp__magic-mcp__21st_magic_component_builder({
  message: `Create component like ${prototype.url}`
});
```

## Commands Reference

### Slash Commands
- `/ui` - Create new component
- `/21` or `/21st` - Component generation
- `/logo` - Search for logos

### Command Examples
```
/ui Create a notification toast component with animations
/21 Show me card layout examples
/logo GitHub Twitter LinkedIn
/ui refine Make this table more modern
```

## Related Documentation

- [MCP Servers Overview](./)
- [React Development Guide](../../development/)
- [Component Patterns](../../architecture/)