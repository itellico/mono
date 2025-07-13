import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'itellico Mono Documentation',
  tagline: 'Multi-tenant SaaS Platform Documentation',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'http://192.168.178.94:3005',
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
      {
        docs: {
          routeBasePath: '/', // Serve docs at root
          path: '../docs', // Point to our existing docs directory
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/itellico/mono/tree/main/',
        },
        blog: false, // Disable blog
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'itellico Mono',
      logo: {
        alt: 'itellico Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: '/installation/',
          label: 'Installation',
          position: 'left',
        },
        {
          to: '/dev-environment',
          label: 'Dev Environment',
          position: 'left',
        },
        {
          to: '/claude-instructions',
          label: 'AI Instructions',
          position: 'left',
        },
        {
          href: 'http://192.168.178.94:3001/docs',
          label: 'API Reference',
          position: 'left',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        {
          href: 'http://192.168.178.94:3000',
          label: 'Main App',
          position: 'left',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        {
          href: 'http://192.168.178.94:4040',
          label: 'Click Dummy',
          position: 'left',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        {
          href: 'http://192.168.178.94:4041/?controller=BoardViewController&action=show&project_id=1',
          label: 'Kanboard',
          position: 'left',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        {
          href: 'https://github.com/itellico/mono',
          label: 'GitHub',
          position: 'right',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Installation',
          items: [
            {
              label: 'Complete Guide',
              to: '/installation/',
            },
            {
              label: 'Quick Reference',
              to: '/installation/quick-reference',
            },
            {
              label: 'Platform Setup',
              to: '/installation/platform-configuration',
            },
            {
              label: 'Tenant Setup',
              to: '/installation/tenant-configuration',
            },
          ],
        },
        {
          title: '5-Tier Architecture',
          items: [
            {
              label: 'Platform Tier',
              to: '/platform/',
            },
            {
              label: 'Tenant Tier',
              to: '/tenant/',
            },
            {
              label: 'Account Tier',
              to: '/account/',
            },
            {
              label: 'User Tier',
              to: '/user/',
            },
            {
              label: 'Public Tier',
              to: '/public/',
            },
          ],
        },
        {
          title: 'Documentation',
          items: [
            {
              label: 'Installation Guide',
              to: '/installation/',
            },
            {
              label: 'Architecture',
              to: '/architecture/',
            },
            {
              label: 'Development',
              to: '/development/',
            },
            {
              label: 'API Reference',
              href: 'http://192.168.178.94:3001/docs',
              target: '_blank',
              rel: 'noopener noreferrer',
            },
            {
              label: 'Quick Reference',
              to: '/reference/',
            },
          ],
        },
        {
          title: 'Deployment',
          items: [
            {
              label: 'Docker Setup',
              to: '/development/deployment/docker/',
            },
            {
              label: 'Kubernetes Guide',
              to: '/development/deployment/kubernetes/',
            },
            {
              label: 'Cost Optimization',
              to: '/development/deployment/kubernetes/cost-optimization',
            },
            {
              label: 'Production Checklist',
              to: '/development/deployment/production-checklist/',
            },
            {
              label: 'Security Hardening',
              to: '/architecture/security/',
            },
            {
              label: 'Monitoring Setup',
              to: '/development/tools/monitoring/',
            },
          ],
        },
        {
          title: 'Services',
          items: [
            {
              label: 'Main App',
              href: 'http://192.168.178.94:3000',
              target: '_blank',
              rel: 'noopener noreferrer',
            },
            {
              label: 'Click Dummy',
              href: 'http://192.168.178.94:4040',
              target: '_blank',
              rel: 'noopener noreferrer',
            },
            {
              label: 'Kanboard',
              href: 'http://192.168.178.94:4041',
              target: '_blank',
              rel: 'noopener noreferrer',
            },
            {
              label: 'API Docs',
              href: 'http://192.168.178.94:3001/docs',
              target: '_blank',
              rel: 'noopener noreferrer',
            },
            {
              label: 'Monitoring',
              href: 'http://localhost:5005',
              target: '_blank',
              rel: 'noopener noreferrer',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/itellico/mono',
              target: '_blank',
              rel: 'noopener noreferrer',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} itellico Mono. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
