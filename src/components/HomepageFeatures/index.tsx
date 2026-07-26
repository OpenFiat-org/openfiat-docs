import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Decentralized by design',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        OpenFiat coordinates peer-to-peer trade discovery, reputation, and
        governance without centralized servers, while Solana handles
        settlement through audited smart contracts.
      </>
    ),
  },
  {
    title: 'Open protocol, open source',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Every specification, SDK, and reference implementation is published
        under the Apache License 2.0 across{' '}
        <a href="https://github.com/OpenFiat-org">OpenFiat-org</a>.
      </>
    ),
  },
  {
    title: 'Built for developers',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Official SDKs in Rust, TypeScript, and Python share a consistent
        client interface, backed by a documented RPC surface and protocol
        conformance vectors.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
