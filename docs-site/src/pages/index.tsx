import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

// 5-Tier Architecture Cards
const TierCards = [
  {
    title: '🌐 Platform Tier',
    description: 'System-wide administration and tenant management. Super admin level functionality for managing the entire platform.',
    link: '/platform/',
    features: ['Industry Templates', 'Global Resources', 'Access Control', 'Features & Limits', 'Subscription Management'],
    color: 'primary'
  },
  {
    title: '🏢 Tenant Tier',
    description: 'Individual marketplace administration. Manage specific marketplaces and their unique configurations.',
    link: '/tenant/',
    features: ['Core Management', 'Content Management', 'Administration', 'Analytics', 'Moderation'],
    color: 'secondary'
  },
  {
    title: '👥 Account Tier',
    description: 'Feature-based account management supporting various business models from solo professionals to agencies.',
    link: '/account/',
    features: ['Feature System', 'Business Templates', 'Real-world Scenarios', 'Flexible Configurations'],
    color: 'success'
  },
  {
    title: '👤 User Tier',
    description: 'Individual user operations. Personal workspace and user-specific functionality.',
    link: '/user/',
    features: ['Core Functions', 'Content & Media', 'Account Management', 'Personal Settings'],
    color: 'info'
  },
  {
    title: '🌍 Public Tier',
    description: 'Public marketplace browsing and discovery. No authentication required.',
    link: '/public/',
    features: ['Discovery', 'Public Marketplaces', 'Information Pages', 'Registration'],
    color: 'warning'
  }
];

// Documentation Sections
const DocSections = [
  {
    title: '📦 Installation',
    description: 'Complete JSON-based installation system with platform and tenant configuration.',
    link: '/installation/',
    icon: '📦',
    subsections: ['Platform Setup', 'Tenant Config', 'Account Hierarchy', 'Quick Reference', 'Troubleshooting']
  },
  {
    title: '🏗️ Architecture',
    description: 'System architecture, design patterns, and technical specifications.',
    link: '/architecture/',
    icon: '🏗️',
    subsections: ['System Design', 'API Design', 'Data Models', 'Security', 'Performance']
  },
  {
    title: '⚙️ Development',
    description: 'Developer guides, workflows, testing, and deployment documentation.',
    link: '/development/',
    icon: '⚙️',
    subsections: ['Getting Started', 'Workflows', 'Testing', 'Deployment', 'Tools']
  },
  {
    title: '📖 Reference',
    description: 'Quick reference materials, troubleshooting, and glossary.',
    link: '/reference/',
    icon: '📖',
    subsections: ['Quick Start', 'Troubleshooting', 'Glossary', 'Common Issues']
  }
];

// Installation Quick Links
const InstallationLinks = [
  {
    title: 'Complete Guide',
    description: 'Full installation documentation',
    link: '/installation/',
    icon: '📦'
  },
  {
    title: 'Quick Reference',
    description: 'Essential commands & tips',
    link: '/installation/quick-reference',
    icon: '⚡'
  },
  {
    title: 'Platform Setup',
    description: 'Core platform configuration',
    link: '/installation/platform-configuration',
    icon: '🌐'
  },
  {
    title: 'Tenant Setup',
    description: 'Industry-specific configuration',
    link: '/installation/tenant-configuration',
    icon: '🏢'
  }
];

// Quick Links
const QuickLinks = [
  {
    title: 'Quick Start',
    description: 'Get up and running in 5 minutes',
    link: '/development/getting-started/developer-guide',
    icon: '🚀'
  },
  {
    title: 'API Reference',
    description: '5-tier API documentation',
    link: 'http://localhost:3001/docs',
    icon: '📋',
    external: true
  },
  {
    title: 'Architecture Guide',
    description: 'System design and patterns',
    link: '/architecture/',
    icon: '🏛️'
  },
  {
    title: 'Live Services',
    description: 'Access running services',
    link: 'http://localhost:3000',
    icon: '🖥️',
    external: true
  }
];

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/installation/">
            Installation Guide 📦
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            to="/development/getting-started/developer-guide">
            Get Started 🚀
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            href="http://localhost:3001/docs"
            target="_blank"
            rel="noopener noreferrer">
            API Reference 📋
          </Link>
        </div>
      </div>
    </header>
  );
}

function TierCard({title, description, link, features, color}) {
  return (
    <div className={clsx('col col--4', styles.tierCard)}>
      <div className={clsx('card', styles.card, styles[`card--${color}`])}>
        <div className="card__header">
          <h3>{title}</h3>
        </div>
        <div className="card__body">
          <p>{description}</p>
          <ul className={styles.featureList}>
            {features.map((feature, idx) => (
              <li key={idx}>{feature}</li>
            ))}
          </ul>
        </div>
        <div className="card__footer">
          <Link
            className={clsx('button button--primary button--block')}
            to={link}>
            Explore {title.split(' ')[1]} →
          </Link>
        </div>
      </div>
    </div>
  );
}

function DocSection({title, description, link, icon, subsections}) {
  return (
    <div className={clsx('col col--6', styles.docSection)}>
      <div className={clsx('card', styles.card)}>
        <div className="card__header">
          <h3>
            <span className={styles.icon}>{icon}</span>
            {title}
          </h3>
        </div>
        <div className="card__body">
          <p>{description}</p>
          <div className={styles.subsections}>
            {subsections.map((section, idx) => (
              <span key={idx} className={styles.subsectionTag}>
                {section}
              </span>
            ))}
          </div>
        </div>
        <div className="card__footer">
          <Link
            className="button button--outline button--primary button--block"
            to={link}>
            View Documentation →
          </Link>
        </div>
      </div>
    </div>
  );
}

function QuickLink({title, description, link, icon, external}) {
  return (
    <div className={clsx('col col--3', styles.quickLink)}>
      <Link
        className={clsx('card', styles.card, styles.quickLinkCard)}
        to={link}
        {...(external ? {target: '_blank', rel: 'noopener noreferrer'} : {})}>
        <div className="card__body text--center">
          <div className={styles.quickLinkIcon}>{icon}</div>
          <h4>{title}</h4>
          <p>{description}</p>
        </div>
      </Link>
    </div>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Documentation Hub"
      description="Comprehensive documentation for itellico Mono - a modern multi-tenant SaaS marketplace platform">
      <HomepageHeader />
      <main>
        {/* Installation Section */}
        <section className={clsx(styles.section, styles.sectionHighlight)}>
          <div className="container">
            <div className="text--center">
              <Heading as="h2" className={styles.sectionTitle}>
                📦 Installation & Setup
              </Heading>
              <p className={styles.sectionDescription}>
                Complete JSON-based installation system for the itellico Mono platform. 
                Deploy platform + tenants with account hierarchies in minutes.
              </p>
              <div className={styles.installCommand}>
                <code>pnpm tsx installation/install.ts --tenant=go-models.com</code>
              </div>
            </div>
            <div className="row">
              {InstallationLinks.map((props, idx) => (
                <QuickLink key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>

        {/* 5-Tier Architecture Section */}
        <section className={styles.section}>
          <div className="container">
            <div className="text--center">
              <Heading as="h2" className={styles.sectionTitle}>
                🏗️ 5-Tier Architecture
              </Heading>
              <p className={styles.sectionDescription}>
                Our documentation is organized around the actual 5-tier architecture of the application, 
                from platform-wide administration to public access.
              </p>
            </div>
            <div className="row">
              {TierCards.map((props, idx) => (
                <TierCard key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>

        {/* Documentation Sections */}
        <section className={clsx(styles.section, styles.sectionAlt)}>
          <div className="container">
            <div className="text--center">
              <Heading as="h2" className={styles.sectionTitle}>
                📚 Documentation Sections
              </Heading>
              <p className={styles.sectionDescription}>
                Comprehensive guides covering architecture, development, API reference, and more.
              </p>
            </div>
            <div className="row">
              {DocSections.map((props, idx) => (
                <DocSection key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className={styles.section}>
          <div className="container">
            <div className="text--center">
              <Heading as="h2" className={styles.sectionTitle}>
                🔗 Quick Access
              </Heading>
              <p className={styles.sectionDescription}>
                Jump straight to the most commonly used resources.
              </p>
            </div>
            <div className="row">
              {QuickLinks.map((props, idx) => (
                <QuickLink key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack & Features */}
        <section className={clsx(styles.section, styles.sectionAlt)}>
          <div className="container">
            <div className="row">
              <div className="col col--6">
                <Heading as="h3">🛠️ Tech Stack</Heading>
                <ul className={styles.techList}>
                  <li><strong>Frontend:</strong> Next.js 15, React 19, TypeScript</li>
                  <li><strong>Backend:</strong> Fastify, Node.js, Prisma ORM</li>
                  <li><strong>Database:</strong> PostgreSQL with multi-tenant isolation</li>
                  <li><strong>Caching:</strong> Redis + TanStack Query (3-layer strategy)</li>
                  <li><strong>Authentication:</strong> Custom JWT with HTTP-only cookies</li>
                  <li><strong>Monitoring:</strong> Prometheus + Grafana</li>
                  <li><strong>Workflows:</strong> N8N + Temporal</li>
                </ul>
              </div>
              <div className="col col--6">
                <Heading as="h3">✨ Key Features</Heading>
                <ul className={styles.featuresList}>
                  <li>🏗️ <strong>5-Tier Architecture:</strong> Hierarchical API and permissions</li>
                  <li>🏢 <strong>Multi-Tenant SaaS:</strong> Complete tenant isolation</li>
                  <li>🎯 <strong>Feature-Based Accounts:</strong> Flexible business models</li>
                  <li>🔐 <strong>Advanced RBAC:</strong> Pattern-based permissions</li>
                  <li>⚡ <strong>High Performance:</strong> 3x faster with optimized caching</li>
                  <li>🌍 <strong>International:</strong> Full i18n and localization</li>
                  <li>📊 <strong>Real-time Analytics:</strong> Comprehensive monitoring</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}