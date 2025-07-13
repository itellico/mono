import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';
import Link from '@docusaurus/Link';
import clsx from 'clsx';

import styles from './claude-instructions.module.css';

interface ClaudeMdData {
  content: string;
  lastModified: string;
  fileSize: number;
  buildTime: string;
  error?: string;
}

export default function ClaudeInstructions() {
  const [data, setData] = useState<ClaudeMdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(true);

  useEffect(() => {
    // Fetch the static JSON file
    fetch('/data/claude-md.json')
      .then(res => res.json())
      .then((jsonData: ClaudeMdData) => {
        setData(jsonData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load CLAUDE.md data:', err);
        setLoading(false);
      });
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleRefresh = () => {
    setShowContent(false);
    setTimeout(() => {
      setShowContent(true);
    }, 500);
  };

  if (loading) {
    return (
      <Layout
        title="AI Instructions (CLAUDE.md)"
        description="Instructions for Claude AI when working with the itellico Mono codebase">
        <main className="container margin-vert--lg">
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading CLAUDE.md content...</p>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout
      title="AI Instructions (CLAUDE.md)"
      description="Instructions for Claude AI when working with the itellico Mono codebase">
      <main className="container margin-vert--lg">
        <div className={styles.header}>
          <Heading as="h1">🤖 AI Instructions (CLAUDE.md)</Heading>
          <p className="hero__subtitle">
            These instructions guide Claude AI when working with the itellico Mono codebase
          </p>
        </div>

        {data && (
          <>
            <div className={styles.metadata}>
              <div className={styles.metaItem}>
                <strong>File Location:</strong> 
                <code>/Users/mm2/dev_mm/mono/CLAUDE.md</code>
              </div>
              <div className={styles.metaItem}>
                <strong>Last Modified:</strong> {formatDate(data.lastModified)}
              </div>
              <div className={styles.metaItem}>
                <strong>File Size:</strong> {formatFileSize(data.fileSize)}
              </div>
              <div className={styles.metaItem}>
                <strong>Build Time:</strong> {formatDate(data.buildTime)}
              </div>
              <div className={styles.metaItem}>
                <button
                  className="button button--sm button--secondary"
                  onClick={handleRefresh}>
                  🔄 Refresh View
                </button>
              </div>
            </div>

            {data.error && (
              <div className={clsx('alert alert--warning', styles.alert)}>
                <strong>Warning:</strong> {data.error}
              </div>
            )}

            <div className={styles.contentWrapper}>
              {showContent && data.content ? (
                <div className={styles.markdownContent}>
                  <CodeBlock language="markdown" showLineNumbers>
                    {data.content}
                  </CodeBlock>
                </div>
              ) : !showContent ? (
                <div className={styles.loading}>
                  <div className={styles.spinner}></div>
                  <p>Refreshing view...</p>
                </div>
              ) : (
                <div className={clsx('alert alert--danger', styles.alert)}>
                  <strong>Error:</strong> Unable to display CLAUDE.md content.
                </div>
              )}
            </div>
          </>
        )}

        <div className={styles.infoSection}>
          <Heading as="h2">📋 About CLAUDE.md</Heading>
          <p>
            The CLAUDE.md file is a critical part of the itellico Mono project. It contains:
          </p>
          <ul>
            <li><strong>Project Overview:</strong> Architecture and current status</li>
            <li><strong>Development Workflow:</strong> Mandatory rules and best practices</li>
            <li><strong>API Architecture:</strong> 5-tier structure and naming conventions</li>
            <li><strong>Performance Guidelines:</strong> Caching and optimization strategies</li>
            <li><strong>Storage Rules:</strong> Security and data management requirements</li>
            <li><strong>Quick Commands:</strong> Development setup and troubleshooting</li>
          </ul>
          <p>
            <strong>Important:</strong> This file must remain at its original location 
            (<code>/Users/mm2/dev_mm/mono/CLAUDE.md</code>) as it's automatically loaded 
            by Claude AI when working with the codebase.
          </p>
        </div>

        <div className={styles.changeDetection}>
          <Heading as="h2">🔍 Change Detection</Heading>
          <div className={clsx('alert alert--info')}>
            <strong>Note:</strong> This page shows the CLAUDE.md content as it was when 
            the documentation site was last built.
          </div>
          <p>
            To update this page with the latest CLAUDE.md content:
          </p>
          <CodeBlock language="bash">
            {`# 1. Copy the latest CLAUDE.md to static files
pnpm run update:claude-md

# 2. Rebuild and restart the documentation site
pnpm run build
pnpm run serve

# Or in development mode
pnpm run start`}
          </CodeBlock>
        </div>

        <div className={styles.additionalInfo}>
          <Heading as="h2">🔗 Related Resources</Heading>
          <ul>
            <li>
              <Link to="/development/getting-started/developer-guide">
                Developer Getting Started Guide
              </Link>
            </li>
            <li>
              <Link to="/architecture/">
                System Architecture Documentation
              </Link>
            </li>
            <li>
              <Link to="/dev-environment">
                Development Environment Setup
              </Link>
            </li>
          </ul>
        </div>
      </main>
    </Layout>
  );
}