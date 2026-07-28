import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type LinkItem = {
  label: string;
  to: string;
};

type ColumnItem = {
  title: string;
  description: string;
  links: LinkItem[];
};

const Columns: ColumnItem[] = [
  {
    title: 'Protocol',
    description: 'How nodes discover each other, gossip events, and stay in sync.',
    links: [
      {label: 'Architecture overview', to: '/docs/architecture'},
      {label: 'Protocol specifications', to: '/docs/protocol-specs'},
    ],
  },
  {
    title: 'API',
    description: 'The JSON-RPC surface every node exposes to callers.',
    links: [
      {label: 'JSON-RPC reference', to: '/docs/api'},
      {label: 'Subscriptions', to: '/docs/api#subscriptions'},
      {label: 'Interactive reference', to: '/docs/api#interactive-reference'},
    ],
  },
  {
    title: 'Build',
    description: 'SDKs, running your own node, and integrating as a merchant.',
    links: [
      {label: 'SDKs', to: '/docs/sdks'},
      {label: 'Run a node', to: '/docs/node-operators'},
      {label: 'Merchant integration', to: '/docs/merchants'},
    ],
  },
];

function Column({title, description, links}: ColumnItem) {
  return (
    <div className={styles.column}>
      <Heading as="h3" className={styles.columnTitle}>
        {title}
      </Heading>
      <p className={styles.columnDescription}>{description}</p>
      <ul className={styles.linkList}>
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.grid}>
          {Columns.map((column) => (
            <Column key={column.title} {...column} />
          ))}
        </div>
      </div>
    </section>
  );
}
