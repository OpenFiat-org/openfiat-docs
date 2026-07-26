import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'OpenFiat Docs',
  tagline: 'Developer documentation for the OpenFiat protocol',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  url: 'https://docs.openfiat.org',
  baseUrl: '/',

  // GitHub pages deployment config.
  organizationName: 'OpenFiat-org',
  projectName: 'openfiat-docs',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/OpenFiat-org/openfiat-docs/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'OpenFiat Docs',
      logo: {
        alt: 'OpenFiat Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://openfiat.org',
          label: 'Website',
          position: 'right',
        },
        {
          href: 'https://github.com/OpenFiat-org',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'Architecture', to: '/docs/architecture'},
            {label: 'Protocol Specs', to: '/docs/protocol-specs'},
            {label: 'SDKs', to: '/docs/sdks'},
            {label: 'FAQ', to: '/docs/faq'},
          ],
        },
        {
          title: 'Ecosystem',
          items: [
            {label: 'openfiat-specs', href: 'https://github.com/OpenFiat-org/openfiat-specs'},
            {label: 'openfiat-core', href: 'https://github.com/OpenFiat-org/openfiat-core'},
            {label: 'openfiat-sdks', href: 'https://github.com/OpenFiat-org/openfiat-sdks'},
            {label: 'openfiat-apps', href: 'https://github.com/OpenFiat-org/openfiat-apps'},
          ],
        },
        {
          title: 'More',
          items: [
            {label: 'Website', href: 'https://openfiat.org'},
            {label: 'GitHub', href: 'https://github.com/OpenFiat-org'},
            {label: 'Discussions', href: 'https://github.com/orgs/OpenFiat-org/discussions'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} AllenHark. OpenFiat is released under the Apache License 2.0.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
