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

  url: 'https://docs.openfiat.network',
  baseUrl: '/',

  // GitHub pages deployment config.
  organizationName: 'OpenFiat-org',
  projectName: 'openfiat-docs',

  onBrokenLinks: 'throw',

  // Every language with more than ~50M native speakers, as standard written
  // languages (no dialects) — matching the openfiat-app locale set so the two
  // properties speak the same languages. Untranslated docs fall back to the
  // English content, so a locale can ship the moment it is added and be filled
  // in over time. `localeConfigs` supplies each locale's endonym (shown in the
  // navbar dropdown) and writing direction; Arabic, Urdu and Persian are RTL.
  i18n: {
    defaultLocale: 'en',
    locales: [
      'en', 'zh-Hans', 'es', 'hi', 'pt-BR', 'bn', 'ru', 'ja', 'vi', 'tr',
      'mr', 'te', 'ko', 'fr', 'ta', 'de', 'it', 'gu', 'pa', 'th', 'id',
      'pl', 'uk', 'kn', 'ar', 'ur', 'fa',
    ],
    localeConfigs: {
      en: {label: 'English'},
      'zh-Hans': {label: '简体中文'},
      es: {label: 'Español'},
      hi: {label: 'हिन्दी'},
      'pt-BR': {label: 'Português (Brasil)'},
      bn: {label: 'বাংলা'},
      ru: {label: 'Русский'},
      ja: {label: '日本語'},
      vi: {label: 'Tiếng Việt'},
      tr: {label: 'Türkçe'},
      mr: {label: 'मराठी'},
      te: {label: 'తెలుగు'},
      ko: {label: '한국어'},
      fr: {label: 'Français'},
      ta: {label: 'தமிழ்'},
      de: {label: 'Deutsch'},
      it: {label: 'Italiano'},
      gu: {label: 'ગુજરાતી'},
      pa: {label: 'ਪੰਜਾਬੀ'},
      th: {label: 'ไทย'},
      id: {label: 'Bahasa Indonesia'},
      pl: {label: 'Polski'},
      uk: {label: 'Українська'},
      kn: {label: 'ಕನ್ನಡ'},
      ar: {label: 'العربية', direction: 'rtl'},
      ur: {label: 'اردو', direction: 'rtl'},
      fa: {label: 'فارسی', direction: 'rtl'},
    },
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
          href: 'https://openfiat.network',
          label: 'Website',
          position: 'right',
        },
        {
          href: 'https://github.com/OpenFiat-org',
          label: 'GitHub',
          position: 'right',
        },
        // Language switcher. Lists every configured locale by its endonym and
        // switches while staying on the current doc.
        {
          type: 'localeDropdown',
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
            {label: 'Website', href: 'https://openfiat.network'},
            {label: 'GitHub', href: 'https://github.com/OpenFiat-org'},
            {label: 'Discussions', href: 'https://github.com/orgs/OpenFiat-org/discussions'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} AllenHark. OpenFiat is released under the Apache License 2.0.`,
    },
    // Code panels stay dark navy regardless of the site's light/dark
    // theme (same fixed-dark-panel convention docs.stripe.com uses) —
    // see custom.css's --of-panel-bg, which this is tuned to match.
    prism: {
      theme: prismThemes.dracula,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
