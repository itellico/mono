---
title: Sequential Thinking MCP Server
sidebar_label: Sequential Thinking
description: Complex problem-solving through structured thinking
---

# Sequential Thinking MCP Server

Enables dynamic and reflective problem-solving through a flexible thinking process that can adapt and evolve as understanding deepens.

## Overview

The Sequential Thinking server provides:
- Step-by-step problem decomposition
- Dynamic thought adjustment
- Hypothesis generation and verification
- Branch exploration for alternatives
- Iterative refinement

## Function

### Sequential Thinking

```javascript
mcp__sequential-thinking__sequentialthinking({
  thought: "First, I need to understand the authentication flow...",
  nextThoughtNeeded: true,
  thoughtNumber: 1,
  totalThoughts: 5,
  isRevision: false,
  needsMoreThoughts: false
});
```

**Parameters:**
- `thought` - Current thinking step
- `nextThoughtNeeded` - Continue thinking?
- `thoughtNumber` - Current step number
- `totalThoughts` - Estimated total (adjustable)
- `isRevision` - Revising previous thought?
- `revisesThought` - Which thought to revise
- `branchFromThought` - Branching point
- `branchId` - Branch identifier
- `needsMoreThoughts` - Extend beyond estimate

## When to Use

### Ideal For:
- Complex architectural decisions
- Multi-step problem solving
- Design planning with unknowns
- Debugging intricate issues
- Performance optimization
- Security analysis

### Not Ideal For:
- Simple CRUD operations
- Straightforward bug fixes
- Well-documented procedures
- Single-step tasks

## Thinking Patterns

### Linear Progression
```javascript
Thought 1: Analyze the problem
Thought 2: Identify constraints
Thought 3: Design solution
Thought 4: Consider edge cases
Thought 5: Finalize approach
```

### Revision Pattern
```javascript
Thought 1: Initial approach
Thought 2: Implementation detail
Thought 3: Wait, revising thought 1...
Thought 4: New approach based on insights
Thought 5: Continue with revised plan
```

### Branching Pattern
```javascript
Thought 1: Core problem
Thought 2: Two possible approaches
  Branch A: Microservices
    Thought 3a: Service design
    Thought 4a: Communication
  Branch B: Monolithic
    Thought 3b: Module design
    Thought 4b: Scaling strategy
```

## Examples

### Architecture Design

```javascript
// Thought 1
"I need to design a caching strategy for the platform. Let me start by understanding the data access patterns..."

// Thought 2
"Based on analysis, we have three types of data: user sessions (high frequency), content (medium frequency), and configuration (low frequency)..."

// Thought 3
"I should use a multi-layer approach: Redis for sessions, CDN for content... wait, let me reconsider the session handling..."

// Thought 4 (revision)
"Actually, sessions should use HTTP-only cookies for security, with Redis as a session store for server-side data only..."
```

### Debugging Complex Issue

```javascript
// Thought 1
"User reports intermittent authentication failures. Let me trace the auth flow..."

// Thought 2
"The JWT validation passes, but database lookup fails. Could be a race condition..."

// Thought 3
"Found it - the token refresh and API call happen simultaneously, causing database connection pool exhaustion..."
```

## Best Practices

### 1. Problem Framing
- Start with clear problem statement
- Identify known constraints
- List assumptions explicitly
- Define success criteria

### 2. Thought Structure
```javascript
// Good thought structure
"Looking at the performance issue, I notice three bottlenecks:
1. Database queries lack indexes
2. No caching for repeated computations
3. Synchronous operations that could be async
Let me address each..."

// Poor thought structure
"Performance is bad. Need to fix it."
```

### 3. Revision Guidelines
- Revise when new information emerges
- Question assumptions explicitly
- Document why revision is needed
- Keep revision chains short

### 4. Branch Management
- Branch for significantly different approaches
- Limit to 2-3 branches
- Merge insights from branches
- Document branch decisions

## Integration Examples

### With Documentation Search

```javascript
// Thought 1
"I need to implement rate limiting. Let me search existing patterns..."

// Use docs server
const patterns = await mcp__docs-mcp__search_documentation({
  query: "rate limiting implementation"
});

// Thought 2
"Based on documentation, we have Redis-based rate limiting. Let me design the specific implementation..."
```

### With Kanboard Planning

```javascript
// After sequential thinking completes
const plan = "Implement three-layer caching strategy...";

// Create implementation tasks
await mcp__kanboard-mcp__create_task({
  title: "Implement caching strategy",
  description: plan,
  tags: ["architecture", "performance"]
});
```

## Common Patterns

### Investigation Pattern
1. Understand the problem
2. Gather relevant information
3. Analyze potential causes
4. Test hypotheses
5. Verify solution

### Design Pattern
1. Define requirements
2. Explore approaches
3. Evaluate trade-offs
4. Select approach
5. Plan implementation

### Optimization Pattern
1. Measure current state
2. Identify bottlenecks
3. Propose improvements
4. Estimate impact
5. Prioritize changes

## Troubleshooting

### Infinite Thinking
- Set reasonable totalThoughts
- Use completion criteria
- Avoid circular reasoning

### Shallow Analysis
- Ask "why" and "how"
- Challenge assumptions
- Consider edge cases
- Think about scale

### Over-Revision
- Limit revision chains
- Document revision reasons
- Merge related thoughts
- Progress forward

## Related Documentation

- [MCP Servers Overview](./)
- [Problem Solving Patterns](../../architecture/)
- [Development Workflows](../workflows/)