import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {translate} from '@docusaurus/Translate';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

/**
 * The `id`/`message` pairs are what `write-translations` extracts and what each
 * locale's `code.json` overrides. English is the source `message`; a locale
 * that has not translated a key falls back to it. `translate()` (not
 * `<Translate>`) because these are array values assembled outside JSX.
 */
type LinkItem = {
  id: string;
  label: string;
  to: string;
};

type ColumnItem = {
  id: string;
  title: string;
  descId: string;
  description: string;
  links: LinkItem[];
};

const Columns: ColumnItem[] = [
  {
    id: 'home.col.protocol.title',
    title: 'Protocol',
    descId: 'home.col.protocol.desc',
    description: 'How nodes discover each other, gossip events, and stay in sync.',
    links: [
      {id: 'home.link.architecture', label: 'Architecture overview', to: '/docs/architecture'},
      {id: 'home.link.protocolSpecs', label: 'Protocol specifications', to: '/docs/protocol-specs'},
    ],
  },
  {
    id: 'home.col.api.title',
    title: 'API',
    descId: 'home.col.api.desc',
    description: 'The JSON-RPC surface every node exposes to callers.',
    links: [
      {id: 'home.link.jsonRpc', label: 'JSON-RPC reference', to: '/docs/api'},
      {id: 'home.link.subscriptions', label: 'Subscriptions', to: '/docs/api#subscriptions'},
      {id: 'home.link.interactive', label: 'Interactive reference', to: '/docs/api#interactive-reference'},
    ],
  },
  {
    id: 'home.col.build.title',
    title: 'Build',
    descId: 'home.col.build.desc',
    description: 'SDKs, running your own node, and integrating as a merchant.',
    links: [
      {id: 'home.link.sdks', label: 'SDKs', to: '/docs/sdks'},
      {id: 'home.link.runNode', label: 'Run a node', to: '/docs/node-operators'},
      {id: 'home.link.merchant', label: 'Merchant integration', to: '/docs/merchants'},
    ],
  },
];

function Column({id, title, descId, description, links}: ColumnItem) {
  return (
    <div className={styles.column}>
      <Heading as="h3" className={styles.columnTitle}>
        {translate({id, message: title})}
      </Heading>
      <p className={styles.columnDescription}>{translate({id: descId, message: description})}</p>
      <ul className={styles.linkList}>
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to}>{translate({id: link.id, message: link.label})}</Link>
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
            <Column key={column.id} {...column} />
          ))}
        </div>
      </div>
    </section>
  );
}
