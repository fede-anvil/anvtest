/* eslint-disable */
/* global WebImporter */

import columnsFeatureParser from './parsers/columns-feature.js';
import cardsImageGridParser from './parsers/cards-image-grid.js';
import tabsProfileParser from './parsers/tabs-profile.js';
import cardsArticleParser from './parsers/cards-article.js';
import accordionFaqParser from './parsers/accordion-faq.js';
import heroOverlayParser from './parsers/hero-overlay.js';

import cleanupTransformer from './transformers/wknd-trendsetters-cleanup.js';
import sectionsTransformer from './transformers/wknd-trendsetters-sections.js';

const parsers = {
  'columns-feature': columnsFeatureParser,
  'cards-image-grid': cardsImageGridParser,
  'tabs-profile': tabsProfileParser,
  'cards-article': cardsArticleParser,
  'accordion-faq': accordionFaqParser,
  'hero-overlay': heroOverlayParser,
};

const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Site homepage with hero, featured sections, and brand intro',
  urls: [
    'https://wknd-trendsetters.site/',
  ],
  blocks: [
    {
      name: 'columns-feature',
      instances: [
        'header.section.secondary-section .container > .grid-layout',
        'main > section.section .container > .grid-layout.tablet-1-column.grid-gap-lg',
      ],
    },
    {
      name: 'cards-image-grid',
      instances: ['.grid-layout.desktop-4-column.grid-gap-sm'],
    },
    {
      name: 'tabs-profile',
      instances: ['.tabs-wrapper'],
    },
    {
      name: 'cards-article',
      instances: ['.grid-layout.desktop-4-column.grid-gap-md'],
    },
    {
      name: 'accordion-faq',
      instances: ['.faq-list'],
    },
    {
      name: 'hero-overlay',
      instances: ['section.section.inverse-section .grid-layout'],
    },
  ],
  sections: [
    { id: 'section-1', name: 'Hero / brand intro', selector: 'main > header.section.secondary-section', style: 'secondary', blocks: ['columns-feature'], defaultContent: [] },
    { id: 'section-2', name: 'Article header columns', selector: 'main > section.section:nth-of-type(2)', style: null, blocks: ['columns-feature'], defaultContent: [] },
    { id: 'section-3', name: 'Style snapshot gallery', selector: 'main > section.section.secondary-section:nth-of-type(3)', style: 'secondary', blocks: ['cards-image-grid'], defaultContent: [] },
    { id: 'section-4', name: 'Profile testimonial tabs', selector: 'main > section.section:nth-of-type(4)', style: null, blocks: ['tabs-profile'], defaultContent: [] },
    { id: 'section-5', name: 'Latest articles', selector: 'main > section.section.secondary-section:nth-of-type(5)', style: 'secondary', blocks: ['cards-article'], defaultContent: [] },
    { id: 'section-6', name: 'FAQ', selector: 'main > section.section:nth-of-type(6)', style: null, blocks: ['accordion-faq'], defaultContent: [] },
    { id: 'section-7', name: 'Bottom CTA hero', selector: 'main > section.section.inverse-section', style: null, blocks: ['hero-overlay'], defaultContent: [] },
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
