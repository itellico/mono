# Algolia DocSearch Application Guide

## Step 1: Prepare Your Application

Before applying, ensure your documentation site meets these requirements:

### ✅ Eligibility Checklist
- [ ] Documentation site is publicly accessible
- [ ] Site has quality technical documentation
- [ ] Open source project OR technical/developer documentation
- [ ] Site is production-ready (not under construction)

## Step 2: Apply for DocSearch

### 1. Go to Application Page
Visit: https://docsearch.algolia.com/apply/

### 2. Fill Out the Form

**Required Information:**
```
Documentation URL: https://[your-domain]/
OR for development: http://localhost:3005

Email: [your-email]

Repository URL: https://github.com/itellico/mono

```

### 3. Application Tips
- Mention it's developer/technical documentation
- Highlight that it's a multi-tenant SaaS platform documentation
- Note the 5-tier architecture documentation structure
- Mention the comprehensive API documentation

### Example Application Text:
```
Project Description:
"itellico Mono is a comprehensive multi-tenant SaaS platform with extensive technical documentation covering our 5-tier architecture (Platform → Tenant → Account → User → Public), API design, deployment guides, and development workflows. The documentation serves developers building on our platform and includes architecture guides, API references, component libraries, and troubleshooting resources."

Why DocSearch:
"We need powerful search capabilities to help developers quickly find relevant information across our extensive documentation covering platform architecture, API endpoints, development guides, and deployment procedures."
```

## Step 3: After Approval (1-2 days)

You'll receive an email with:
- Your `appId`
- Your `apiKey` (public search key)
- Your `indexName`
- Crawler configuration

## Step 4: Update Configuration

Once approved, update `/docs-site/docusaurus.config.ts`:

```typescript
algolia: {
  appId: 'YOUR_APP_ID',           // e.g., 'BH4D9OD16A'
  apiKey: 'YOUR_SEARCH_API_KEY',   // e.g., '3d2f0f7b8c9e...'
  indexName: 'YOUR_INDEX_NAME',    // e.g., 'itellico_mono'
  contextualSearch: true,
  // Optional: show search page
  searchPagePath: 'search',
},
```

## Step 5: Test Your Search

1. Restart Docusaurus: `pnpm run start`
2. Try searching for terms like:
   - "authentication"
   - "API"
   - "deployment"
   - "tenant"

## Alternative: While Waiting

If you need search immediately while waiting for approval:

### Option A: Use Algolia Free Tier
1. Sign up at https://www.algolia.com/users/sign_up
2. Create an application
3. Create an index
4. Use InstantSearch to implement search

### Option B: Local Search Fallback
```bash
# Install alternative local search
pnpm add @cmfcmf/docusaurus-search-local

# Configure in docusaurus.config.ts
```

## Troubleshooting

### Common Issues:

1. **"No results found"**
   - Wait 24h after approval for initial crawl
   - Check crawler status in Algolia dashboard

2. **"Search not working"**
   - Verify API key is the public SEARCH key, not admin
   - Check browser console for errors

3. **"Missing pages in search"**
   - Check robots.txt isn't blocking crawler
   - Ensure all pages are linked and discoverable

## Crawler Configuration

Once approved, you can customize the crawler at:
https://crawler.algolia.com/

Common customizations:
- Adjust crawl frequency
- Set page priorities
- Exclude certain paths
- Customize content extraction

## Support

- DocSearch Support: docsearch@algolia.com
- Documentation: https://docsearch.algolia.com/docs/what-is-docsearch
- Discord: https://discord.gg/algolia

---

## Quick Reference

After approval, you'll need:

```typescript
// docusaurus.config.ts
algolia: {
  appId: 'XXXXXXXXXX',        // 10 characters
  apiKey: 'xxxxxxxx...',      // 32+ characters (public key)
  indexName: 'itellico_mono', // Your index name
  contextualSearch: true,
  searchPagePath: 'search',
}
```

That's it! Your search will be fully functional.