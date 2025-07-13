// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'itellico Mono Documentation',
  tagline: 'Multi-tenant SaaS Platform Documentation',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'http://localhost:3005',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'itellico', // Usually your GitHub org/user name.
  projectName: 'mono', // Usually your repo name.

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/', // Docs at the root
          sidebarPath: './sidebars.js',
          // Read from our documentation directory
          path: '../../docs',
          // Include markdown and mdx files
          include: ['**/*.md', '**/*.mdx'],
          // Edit this page link
          editUrl: 'https://github.com/itellico/mono/tree/main/',
        },
        blog: false, // Disable blog
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/social-card.jpg',
      navbar: {
        title: 'itellico Mono',
        logo: {
          alt: 'itellico Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Documentation',
          },
          {
            href: 'http://localhost:3000',
            label: 'Main App',
            position: 'right',
          },
          {
            href: 'https://github.com/itellico/mono',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'Getting Started',
                to: '/',
              },
              {
                label: 'Architecture',
                to: '/architecture/',
              },
              {
                label: 'Features',
                to: '/features/',
              },
            ],
          },
          {
            title: 'Services',
            items: [
              {
                label: 'API Docs',
                href: 'http://localhost:3001/docs',
              },
              {
                label: 'Monitoring',
                href: 'http://localhost:5005',
              },
              {
                label: 'Mailpit',
                href: 'http://localhost:8025',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/itellico/mono',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} itellico Mono. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['typescript', 'json', 'bash', 'yaml'],
      },
      // Search configuration (optional - can use Algolia later)
      algolia: {
        // The application ID provided by Algolia
        appId: 'YOUR_APP_ID',
        // Public API key: it is safe to commit it
        apiKey: 'YOUR_SEARCH_API_KEY',
        indexName: 'itellico_mono_docs',
        // Optional: see doc section below
        contextualSearch: true,
        // Optional: Algolia search parameters
        searchParameters: {},
        // Optional: path for search page that enabled by default (`false` to disable it)
        searchPagePath: 'search',
      },
    }),
  
  // Plugins to handle YAML files
  plugins: [
    [
      require.resolve('./plugins/yaml-docs-plugin.js'),
      {
        // Plugin options
      },
    ],
  ],
};

export default config;