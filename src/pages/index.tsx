import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

const SAMPLE_REQUEST = `curl -X POST https://rpc.openfiat.network/rpc \\
  -H 'content-type: application/json' \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getAdvertisement",
    "params": { "id": "ad-1" }
  }'`;

const SAMPLE_RESPONSE = `{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "id": "ad-1",
    "merchant": "12D3KooW...",
    "asset": "USDT",
    "direction": "Sell",
    "status": "Active"
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
                Get started
              </Link>
              <Link
                className="button button--secondary button--lg"
                to="/docs/api">
                API reference
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
      description="Developer documentation for the OpenFiat protocol.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
