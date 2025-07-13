---
title: Claude Code MCP Configuration
sidebar_label: Claude Code Setup
description: Complete guide to configuring MCP servers in Claude Code for the itellico mono project
---

# Claude Code MCP Configuration Guide

This guide explains how to configure Model Context Protocol (MCP) servers in Claude Code to enable intelligent auto-coding workflows for the itellico mono project.

## Overview

MCP servers extend Claude Code's capabilities by providing direct access to:
- 📚 Project documentation
- 📋 Kanban task management
- 🎨 UI prototypes and click-dummies
- 🤖 AI-powered context management
- 🛠️ Component generation tools
- 🧪 Browser automation

## Configuration File Location

Claude Code stores MCP server configurations in:

```bash
# macOS
~/Library/Application Support/Claude/claude_desktop_config.json

# Windows
%APPDATA%\Claude\claude_desktop_config.json

# Linux
~/.config/Claude/claude_desktop_config.json
```

## Complete Configuration

Here's the complete MCP server configuration for the itellico mono project:

```json
{
  "mcpServers": {
    "docs-mcp": {
      "command": "node",
      "args": ["/Users/mm2/dev_mm/mcp-servers/docs-mcp/build/index.js"],
      "env": {
        "DOCS_PATH": "/Users/mm2/dev_mm/mono/docs",
        "SEARCH_ENABLED": "true",
        "INDEX_ON_START": "true"
      }
    },
    "kanboard-mcp": {
      "command": "node",
      "args": ["/Users/mm2/dev_mm/mcp-servers/kanboard-mcp/build/index.js"],
      "env": {
        "KANBOARD_URL": "http://192.168.178.94:4041",
        "KANBOARD_API_KEY": "your-kanboard-api-key-here",
        "DEFAULT_PROJECT_ID": "1"
      }
    },
    "click-dummy-mcp": {
      "command": "node",
      "args": ["/Users/mm2/dev_mm/mcp-servers/click-dummy-mcp/build/index.js"],
      "env": {
        "CLICK_DUMMY_PATH": "/Users/mm2/dev_mm/mono/click-dummy",
        "BASE_URL": "http://192.168.178.94:4040",
        "SCAN_SUBDIRS": "true"
      }
    },
    "context7-mcp": {
      "command": "node",
      "args": ["/Users/mm2/dev_mm/mcp-servers/context7-mcp/build/index.js"],
      "env": {
        "CONTEXT_STORAGE": "/Users/mm2/.context7",
        "MAX_CONTEXT_SIZE": "100000",
        "AUTO_SUMMARIZE": "true"
      }
    },
    "puppeteer": {
      "command": "node",
      "args": ["/Users/mm2/dev_mm/mcp-servers/puppeteer-mcp/build/index.js"],
      "env": {
        "HEADLESS": "true",
        "SCREENSHOT_PATH": "/Users/mm2/dev_mm/mono/screenshots",
        "DEFAULT_VIEWPORT_WIDTH": "1920",
        "DEFAULT_VIEWPORT_HEIGHT": "1080"
      }
    },
    "sequential-thinking": {
      "command": "node",
      "args": ["/Users/mm2/dev_mm/mcp-servers/sequential-thinking/build/index.js"],
      "env": {
        "MAX_THOUGHTS": "50",
        "ENABLE_BRANCHING": "true",
        "THOUGHT_PERSISTENCE": "session"
      }
    },
    "magic-mcp": {
      "command": "node",
      "args": ["/Users/mm2/dev_mm/mcp-servers/magic-mcp/build/index.js"],
      "env": {
        "API_KEY": "your-21st-dev-api-key",
        "COMPONENT_STYLE": "tailwind",
        "TYPESCRIPT": "true",
        "DEFAULT_FRAMEWORK": "react"
      }
    }
  }
}
```

## Server Details

### 1. Documentation Server (docs-mcp)
Provides semantic search through project documentation.

**Key Features:**
- Full-text search across all documentation
- Category filtering (architecture, features, guides, etc.)
- Pattern and workflow retrieval
- Real-time indexing

**Environment Variables:**
- `DOCS_PATH`: Path to documentation directory
- `SEARCH_ENABLED`: Enable search functionality
- `INDEX_ON_START`: Build search index on startup

### 2. Kanboard Server (kanboard-mcp)
Integrates with Kanboard for project management.

**Key Features:**
- Task creation and updates
- Board visualization
- Comment management
- Subtask handling
- Advanced search queries

**Environment Variables:**
- `KANBOARD_URL`: Kanboard instance URL
- `KANBOARD_API_KEY`: API authentication key
- `DEFAULT_PROJECT_ID`: Default project for operations

### 3. Click-dummy Server (click-dummy-mcp)
Explores PHP UI prototypes for implementation guidance.

**Key Features:**
- Prototype search by feature
- Component extraction
- Implementation mapping
- UI pattern library

**Environment Variables:**
- `CLICK_DUMMY_PATH`: Path to click-dummy directory
- `BASE_URL`: Web server URL for prototypes
- `SCAN_SUBDIRS`: Recursive directory scanning

### 4. Context7 MCP
AI-powered context management for maintaining conversation history.

**Key Features:**
- Intelligent context retrieval
- Conversation persistence
- Auto-summarization
- Memory optimization

**Environment Variables:**
- `CONTEXT_STORAGE`: Storage directory
- `MAX_CONTEXT_SIZE`: Maximum context size
- `AUTO_SUMMARIZE`: Enable automatic summarization

### 5. Puppeteer Server
Browser automation and testing capabilities.

**Key Features:**
- Screenshot capture
- End-to-end testing
- Web scraping
- Form automation

**Environment Variables:**
- `HEADLESS`: Run in headless mode
- `SCREENSHOT_PATH`: Screenshot storage directory
- `DEFAULT_VIEWPORT_*`: Default browser dimensions

### 6. Sequential Thinking
Complex problem-solving through step-by-step reasoning.

**Key Features:**
- Multi-step analysis
- Decision tree exploration
- Hypothesis generation
- Solution verification

**Environment Variables:**
- `MAX_THOUGHTS`: Maximum thinking steps
- `ENABLE_BRANCHING`: Allow thought branching
- `THOUGHT_PERSISTENCE`: Persist thoughts across sessions

### 7. Magic MCP
UI component generation using 21st.dev.

**Key Features:**
- React component generation
- TypeScript support
- Tailwind CSS styling
- Component refinement

**Environment Variables:**
- `API_KEY`: 21st.dev API key
- `COMPONENT_STYLE`: CSS framework
- `TYPESCRIPT`: Enable TypeScript
- `DEFAULT_FRAMEWORK`: Target framework

## Setup Instructions

### Step 1: Install MCP Servers
```bash
# Clone MCP servers repository
git clone https://github.com/your-org/mcp-servers ~/dev_mm/mcp-servers

# Install dependencies for each server
cd ~/dev_mm/mcp-servers
for server in */; do
  cd "$server"
  npm install
  npm run build
  cd ..
done
```

### Step 2: Configure API Keys

1. **Kanboard API Key:**
   - Log into Kanboard at http://192.168.178.94:4041
   - Go to Settings → API
   - Generate and copy API key

2. **21st.dev API Key:**
   - Visit https://21st.dev
   - Create account and get API key
   - Add to Magic MCP configuration

### Step 3: Update Configuration

1. Open Claude Code configuration:
   ```bash
   # macOS
   open ~/Library/Application\ Support/Claude/
   ```

2. Edit `claude_desktop_config.json` with the configuration above

3. Update paths and API keys for your environment

### Step 4: Restart Claude Code

Close and reopen Claude Code for changes to take effect.

## Verification

Test each MCP server is working:

```bash
# In Claude Code, test each server:

# Documentation
mcp__docs-mcp__search_documentation({ query: "architecture" })

# Kanboard
mcp__kanboard-mcp__list_projects({})

# Click-dummy
mcp__click-dummy-mcp__list_prototype_features({})

# Others...
```

## Troubleshooting

### Server Not Available
- Check file paths in configuration
- Verify server is built (`npm run build`)
- Check Claude Code logs

### Authentication Errors
- Verify API keys are correct
- Check service URLs are accessible
- Test API endpoints directly

### Performance Issues
- Reduce `MAX_CONTEXT_SIZE` for context7
- Enable headless mode for Puppeteer
- Check disk space for indexes

## Auto-Coding Workflows

With all servers configured, Claude Code can execute intelligent workflows:

### KB Task Workflow
```bash
# User: "kb 42"
# Claude automatically:
1. Gets task from Kanboard
2. Searches documentation
3. Finds UI prototypes
4. Implements solution
5. Updates task status
```

### KB Check Workflow
```bash
# User: "kb check user dashboard"
# Claude automatically:
1. Searches all documentation
2. Finds all prototypes
3. Creates comprehensive task
4. Adds all relevant links
```

### KB Feedback Workflow
```bash
# User: "kb feedback 42"
# Claude automatically:
1. Reads feedback from task
2. Updates task description
3. Applies corrections
4. Acknowledges changes
```

## Best Practices

1. **Keep Servers Updated**: Regularly update MCP servers for new features
2. **Monitor Performance**: Check server response times
3. **Backup Configuration**: Keep a backup of your configuration file
4. **Security**: Never commit API keys to version control
5. **Documentation**: Document any custom server modifications

## Related Documentation

- [MCP Server Overview](./index.md)
- [Documentation Server](./docs-server.md)
- [Kanboard Server](./kanboard-server.md)
- [Auto-Coding Workflows](../workflows/auto-coding.md)
- [Development Best Practices](../best-practices.md)