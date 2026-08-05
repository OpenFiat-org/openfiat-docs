import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

const SAMPLE_REQUEST = `curl -X POST https://openfiat.allenhark.com/rpc \\
  -H 'content-type: application/json' \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getExchangeRate",
    "params": { "base": "USDC", "quote": "KES" }
  }'`;

const SAMPLE_RESPONSE = `{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "status": "current",
    "rate": 129.46493368330698,
    "expiresAt": 1785451477566
  }
}`;

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx(styles.heroBanner, 'of-dot-grid')}>
      <div className="container">
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <Heading as="h1" className={styles.heroTitle}>
              {siteConfig.title}
            </Heading>
            <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
            <div className={styles.buttons}>
              <Link className="button button--primary button--lg" to="/docs/architecture">
                <Translate id="home.cta.getStarted">Get started</Translate>
              </Link>
              <Link
                className="button button--secondary button--lg"
                to="/docs/api">
                <Translate id="home.cta.apiReference">API reference</Translate>
              </Link>
            </div>
          </div>
          <div className={styles.heroPanel}>
            <CodeBlock language="bash" title="Request">
              {SAMPLE_REQUEST}
            </CodeBlock>
            <CodeBlock language="json" title="Response">
              {SAMPLE_RESPONSE}
            </CodeBlock>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description={translate({
        id: 'home.meta.description',
        message: 'Developer documentation for the OpenFiat protocol.',
      })}>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
