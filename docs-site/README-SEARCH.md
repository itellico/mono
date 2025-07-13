# Docusaurus Search Options

## Option 1: Algolia DocSearch (Recommended)

### Setup Steps:

1. **Apply for free DocSearch**:
   - Go to https://docsearch.algolia.com/
   - Click "Apply" and fill out the form
   - Wait for approval (usually 1-2 days)

2. **Once approved, update config**:
   ```typescript
   // docusaurus.config.ts
   algolia: {
     appId: 'YOUR_APP_ID',
     apiKey: 'YOUR_SEARCH_API_KEY', 
     indexName: 'YOUR_INDEX_NAME',
   }
   ```

## Option 2: Local Search Plugin

### Installation:

```bash
cd docs-site
pnpm add @easyops-cn/docusaurus-search-local
```

### Configuration:

```typescript
// docusaurus.config.ts
themes: [
  [
    require.resolve("@easyops-cn/docusaurus-search-local"),
    {
      hashed: true,
      language: ["en"],
      highlightSearchTermsOnTargetPage: true,
      explicitSearchResultPath: true,
    },
  ],
],
```

## Option 3: Typesense DocSearch

### Installation:

```bash
cd docs-site
pnpm add docusaurus-theme-search-typesense
```

### Configuration:

```typescript
// docusaurus.config.ts
themes: [
  [
    'docusaurus-theme-search-typesense',
    {
      typesenseCollectionName: 'itellico-mono-docs',
      typesenseServerConfig: {
        nodes: [
          {
            host: 'localhost',
            port: 8108,
            protocol: 'http',
          },
        ],
        apiKey: 'YOUR_SEARCH_ONLY_API_KEY',
      },
      // Optional
      typesenseSearchParameters: {},
      // Optional
      contextualSearch: true,
    },
  ],
],
```

## Quick Setup: Local Search (Immediate)

If you want search working right now without external services:

```bash
# Install local search plugin
cd docs-site
pnpm add @easyops-cn/docusaurus-search-local

# The configuration is already in this file, just uncomment it
```

Then update `docusaurus.config.ts`:

```typescript
// Add to the presets array after 'classic'
themes: [
  [
    require.resolve("@easyops-cn/docusaurus-search-local"),
    {
      hashed: true,
      indexDocs: true,
      indexBlog: false,
      indexPages: false,
      language: ["en"],
      removeDefaultStopWordFilter: false,
      highlightSearchTermsOnTargetPage: true,
      searchResultLimits: 8,
      searchResultContextMaxLength: 50,
    },
  ],
],
```

## Comparison:

| Feature | Algolia | Local Search | Typesense |
|---------|---------|--------------|-----------|
| Setup Time | 1-2 days | Immediate | 30 min |
| External Service | Yes | No | Self-hosted |
| Search Quality | Excellent | Good | Very Good |
| Cost | Free (OSS) | Free | Free |
| Maintenance | None | None | Server needed |

## Recommendation:

1. **For immediate needs**: Use Local Search Plugin
2. **For best search**: Apply for Algolia DocSearch
3. **For full control**: Use Typesense with Docker