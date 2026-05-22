/* eslint-disable */
/* global WebImporter */

import columnsFeatureParser from './parsers/columns-feature.js';
import cardsArticleParser from './parsers/cards-article.js';

import cleanupTransformer from './transformers/wknd-trendsetters-cleanup.js';
import sectionsTransformer from './transformers/wknd-trendsetters-sections.js';

const parsers = {
  'columns-feature': columnsFeatureParser,
  'cards-article': cardsArticleParser,
};

const PAGE_TEMPLATE = {
  name: 'blog-index',
  description: 'Blog landing page listing recent articles',
  urls: [
    'https://wknd-trendsetters.site/blog',
  ],
  blocks: [
    {
      name: 'columns-feature',
      instances: [
        'header.section.secondary-section .container > .grid-layout',
        'main > section.section:not(.secondary-section):not(.accent-section) .container > .grid-layout.tablet-1-column.grid-gap-lg',
      ],
    },
    {
      name: 'cards-article',
      instances: ['.grid-layout.desktop-4-column.grid-gap-md'],
    },
  ],
  sections: [
    { id: 'section-1', name: 'Blog page header', selector: 'main > header.section.secondary-section', style: 'secondary', blocks: ['columns-feature'], defaultContent: [] },
    { id: 'section-2', name: 'Featured article columns', selector: 'main > section.section:nth-of-type(2)', style: null, blocks: ['columns-feature'], defaultContent: [] },
    { id: 'section-3', name: 'Article cards grid', selector: 'main > section.section.secondary-section:nth-of-type(3)', style: 'secondary', blocks: ['cards-article'], defaultContent: [] },
    { id: 'section-4', name: 'Subscribe CTA', selector: 'main > section.section.accent-section', style: 'accent', blocks: [], defaultContent: [] },
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
      path: path || '/blog',
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
