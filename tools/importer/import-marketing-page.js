/* eslint-disable */
/* global WebImporter */

import columnsFeatureParser from './parsers/columns-feature.js';
import cardsImageGridParser from './parsers/cards-image-grid.js';
import cardsArticleParser from './parsers/cards-article.js';
import tabsProfileParser from './parsers/tabs-profile.js';
import accordionFaqParser from './parsers/accordion-faq.js';
import heroOverlayParser from './parsers/hero-overlay.js';

import cleanupTransformer from './transformers/wknd-trendsetters-cleanup.js';
import sectionsTransformer from './transformers/wknd-trendsetters-sections.js';

const parsers = {
  'columns-feature': columnsFeatureParser,
  'cards-image-grid': cardsImageGridParser,
  'cards-article': cardsArticleParser,
  'tabs-profile': tabsProfileParser,
  'accordion-faq': accordionFaqParser,
  'hero-overlay': heroOverlayParser,
};

const PAGE_TEMPLATE = {
  name: 'marketing-page',
  description: 'Top-level marketing/content pages with mixed sections (heroes, columns, cards grids, tabs, FAQ, hero overlays)',
  urls: [
    'https://wknd-trendsetters.site/case-studies',
    'https://wknd-trendsetters.site/faq',
    'https://wknd-trendsetters.site/fashion-insights',
    'https://wknd-trendsetters.site/fashion-trends-of-the-season',
    'https://wknd-trendsetters.site/fashion-trends-young-adults',
    'https://wknd-trendsetters.site/fashion-trends-young-adults-casual-sport',
  ],
  blocks: [
    {
      name: 'columns-feature',
      instances: [
        'main > section.section .container > .grid-layout.tablet-1-column.grid-gap-lg',
        'main > section.section .container > .grid-layout.desktop-3-column',
      ],
    },
    {
      name: 'cards-image-grid',
      instances: [
        '.grid-layout.desktop-4-column.grid-gap-sm',
        '.grid-layout.desktop-3-column.grid-gap-sm',
      ],
    },
    {
      name: 'cards-article',
      instances: ['.grid-layout.desktop-4-column.grid-gap-md'],
    },
    {
      name: 'tabs-profile',
      instances: ['.tabs-wrapper'],
    },
    {
      name: 'accordion-faq',
      instances: ['.faq-list'],
    },
    {
      name: 'hero-overlay',
      instances: ['main > section.section.inverse-section .grid-layout'],
    },
  ],
  sections: [
    { id: 'section-hero', name: 'Page hero', selector: 'main > header.section.secondary-section', style: 'secondary', blocks: [], defaultContent: [] },
    { id: 'section-secondary', name: 'Secondary background section', selector: 'main > section.section.secondary-section', style: 'secondary', blocks: ['columns-feature', 'cards-image-grid', 'cards-article', 'tabs-profile', 'accordion-faq'], defaultContent: [] },
    { id: 'section-default', name: 'Default background section', selector: 'main > section.section:not(.secondary-section):not(.accent-section):not(.inverse-section)', style: null, blocks: ['columns-feature', 'cards-image-grid', 'cards-article', 'tabs-profile', 'accordion-faq'], defaultContent: [] },
    { id: 'section-accent', name: 'Accent CTA section', selector: 'main > section.section.accent-section', style: 'accent', blocks: [], defaultContent: [] },
    { id: 'section-inverse', name: 'Dark/inverse hero section', selector: 'main > section.section.inverse-section', style: null, blocks: ['hero-overlay'], defaultContent: [] },
  ],
};

const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      let elements;
      try {
        elements = document.querySelectorAll(selector);
      } catch (e) {
        console.warn(`Invalid selector "${selector}" for block "${blockDef.name}":`, e.message);
        return;
      }
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    executeTransformers('afterTransform', main, payload);

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path: path || '/index',
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
