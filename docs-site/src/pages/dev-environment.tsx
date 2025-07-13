import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import clsx from 'clsx';

import styles from './dev-environment.module.css';

interface ServiceInfo {
  name: string;
  description: string;
  port: string;
  url?: string;
  credentials?: string;
  category: 'core' | 'database' | 'monitoring' | 'workflow' | 'email' | 'cache';
  environment: 'development' | 'test';
}

const services: ServiceInfo[] = [
  // Development Environment - Core Services
  {
    name: 'Next.js Frontend',
    description: 'Main web application',
    port: '3000',
    url: 'http://localhost:3000',
    category: 'core',
    environment: 'development',
  },
  {
    name: 'Fastify API Server',
    description: 'Backend API with 5-tier architecture',
    port: '3001',
    url: 'http://localhost:3001/docs',
    category: 'core',
    environment: 'development',
  },
  {
    name: 'API Documentation',
    description: 'OpenAPI/Swagger docs',
    port: '3001',
    url: 'http://localhost:3001/docs',
    category: 'core',
    environment: 'development',
  },
  {
    name: 'Documentation Site',
    description: 'Docusaurus documentation',
    port: '3005',
    url: 'http://localhost:3005',
    category: 'core',
    environment: 'development',
  },
  {
    name: 'PHP Click Dummy',
    description: 'Feature prototype site (Nginx + PHP-FPM)',
    port: '4040',
    url: 'http://localhost:4040',
    category: 'core',
    environment: 'development',
  },
  {
    name: 'Kanboard',
    description: 'Project management with Mattermost integration',
    port: '4040',
    url: 'http://localhost:4040/kanboard',
    credentials: 'admin / admin',
    category: 'workflow',
    environment: 'development',
  },

  // Development Environment - Database & Cache
  {
    name: 'PostgreSQL',
    description: 'Primary database',
    port: '5432',
    category: 'database',
    environment: 'development',
  },
  {
    name: 'Redis',
    description: 'Cache and sessions',
    port: '6379',
    category: 'cache',
    environment: 'development',
  },

  // Development Environment - Email
  {
    name: 'Mailpit UI',
    description: 'Email testing interface',
    port: '4025',
    url: 'http://localhost:4025',
    category: 'email',
    environment: 'development',
  },
  {
    name: 'Mailpit SMTP',
    description: 'SMTP server',
    port: '1025',
    category: 'email',
    environment: 'development',
  },

  // Development Environment - Workflows
  {
    name: 'N8N Workflows',
    description: 'Workflow automation',
    port: '5678',
    url: 'http://localhost:5678',
    credentials: 'admin / admin123',
    category: 'workflow',
    environment: 'development',
  },
  {
    name: 'Temporal UI',
    description: 'Workflow orchestration',
    port: '4080',
    url: 'http://localhost:4080',
    category: 'workflow',
    environment: 'development',
  },
  {
    name: 'Temporal Server',
    description: 'Workflow server',
    port: '7233',
    category: 'workflow',
    environment: 'development',
  },

  // Development Environment - Monitoring
  {
    name: 'Grafana',
    description: 'Metrics visualization',
    port: '5005',
    url: 'http://localhost:5005',
    credentials: 'admin / admin123',
    category: 'monitoring',
    environment: 'development',
  },
  {
    name: 'Prometheus',
    description: 'Metrics collection',
    port: '9090',
    url: 'http://localhost:9090',
    category: 'monitoring',
    environment: 'development',
  },
  {
    name: 'API Metrics',
    description: 'Raw metrics endpoint',
    port: '3001',
    url: 'http://localhost:3001/metrics',
    category: 'monitoring',
    environment: 'development',
  },
  {
    name: 'Node Exporter',
    description: 'System metrics',
    port: '9100',
    url: 'http://localhost:9100',
    category: 'monitoring',
    environment: 'development',
  },
  {
    name: 'cAdvisor',
    description: 'Container metrics',
    port: '4081',
    url: 'http://localhost:4081',
    category: 'monitoring',
    environment: 'development',
  },

  // Test Environment (mono-test)
  {
    name: 'Next.js Frontend',
    description: 'Test web application',
    port: '3100',
    url: 'http://localhost:3100',
    category: 'core',
    environment: 'test',
  },
  {
    name: 'Fastify API Server',
    description: 'Test API server',
    port: '3101',
    url: 'http://localhost:3101/docs',
    category: 'core',
    environment: 'test',
  },
  {
    name: 'API Documentation',
    description: 'Test API docs',
    port: '3101',
    url: 'http://localhost:3101/docs',
    category: 'core',
    environment: 'test',
  },
  {
    name: 'PostgreSQL',
    description: 'Test database',
    port: '5433',
    category: 'database',
    environment: 'test',
  },
  {
    name: 'Redis',
    description: 'Test cache',
    port: '6380',
    category: 'cache',
    environment: 'test',
  },
  {
    name: 'Mailpit UI',
    description: 'Test email interface',
    port: '4026',
    url: 'http://localhost:4026',
    category: 'email',
    environment: 'test',
  },
  {
    name: 'Mailpit SMTP',
    description: 'Test SMTP',
    port: '1026',
    category: 'email',
    environment: 'test',
  },
];

const categoryColors = {
  core: '#2e8555',
  database: '#e13238',
  cache: '#d63031',
  email: '#0984e3',
  workflow: '#fdcb6e',
  monitoring: '#00b894',
};

function ServiceTable({ environment, title }: { environment: 'development' | 'test'; title: string }) {
  const envServices = services.filter(s => s.environment === environment);
  
  return (
    <div className={styles.tableSection}>
      <Heading as="h2" className={styles.envTitle}>{title}</Heading>
      <div className={styles.tableWrapper}>
        <table className={styles.servicesTable}>
          <thead>
            <tr>
              <th>Service</th>
              <th>Description</th>
              <th>Port</th>
              <th>Credentials</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {envServices.map((service, idx) => (
              <tr key={idx} className={styles.serviceRow}>
                <td>
                  <span 
                    className={styles.categoryDot} 
                    style={{ backgroundColor: categoryColors[service.category] }}
                  />
                  <strong>{service.name}</strong>
                </td>
                <td className={styles.description}>{service.description}</td>
                <td className={styles.port}>
                  <code>{service.port}</code>
                </td>
                <td className={styles.credentials}>
                  {service.credentials ? <code>{service.credentials}</code> : '-'}
                </td>
                <td className={styles.action}>
                  {service.url ? (
                    <Link
                      className="button button--sm button--primary"
                      href={service.url}
                      target="_blank"
                      rel="noopener noreferrer">
                      Open →
                    </Link>
                  ) : (
                    <span className={styles.noLink}>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DevEnvironment(): ReactNode {
  return (
    <Layout
      title="Development Environment"
      description="All development and test environment services">
      <main className="container margin-vert--lg">
        <div className="text--center margin-bottom--lg">
          <Heading as="h1">🛠️ Development & Test Environments</Heading>
          <p className="hero__subtitle">
            Quick access to all services and their ports
          </p>
        </div>

        <div className={styles.legend}>
          <span className={styles.legendTitle}>Categories:</span>
          {Object.entries(categoryColors).map(([cat, color]) => (
            <span key={cat} className={styles.legendItem}>
              <span 
                className={styles.categoryDot} 
                style={{ backgroundColor: color }}
              />
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </span>
          ))}
        </div>

        <ServiceTable 
          environment="development" 
          title="🚀 Development Environment (Local)" 
        />
        
        <ServiceTable 
          environment="test" 
          title="🧪 Test Environment (mono-test Docker)" 
        />

        <section className={styles.commandsSection}>
          <Heading as="h2">⚡ Quick Commands</Heading>
          <div className="row">
            <div className="col col--6">
              <div className={styles.commandCard}>
                <h3>Development Environment</h3>
                <pre><code>{`# Start all services
./scripts/setup-services.sh

# Start servers only
./start-dev.sh

# Start PHP Click Dummy & Kanboard
docker-compose up -d php nginx kanboard

# Install Kanboard plugins
./scripts/install-kanboard-plugins.sh

# Kill ports safely
source scripts/utils/safe-port-utils.sh
kill_node_ports 3000 3001`}</code></pre>
              </div>
            </div>
            <div className="col col--6">
              <div className={styles.commandCard}>
                <h3>Test Environment</h3>
                <pre><code>{`# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Stop test environment
docker-compose -f docker-compose.test.yml down

# View logs
docker-compose -f docker-compose.test.yml logs -f`}</code></pre>
              </div>
            </div>
          </div>
        </section>

        <div className="alert alert--warning margin-top--lg">
          <strong>⚠️ Important:</strong> Never kill Docker proxy processes! They're needed for container access. 
          Only kill Node.js processes when resolving port conflicts.
        </div>
      </main>
    </Layout>
  );
}