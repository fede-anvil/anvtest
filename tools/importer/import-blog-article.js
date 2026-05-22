/* eslint-disable */
/* global WebImporter */

import columnsFeatureParser from './parsers/columns-feature.js';
import tableSpecParser from './parsers/table-spec.js';

import cleanupTransformer from './transformers/wknd-trendsetters-cleanup.js';
import sectionsTransformer from './transformers/wknd-trendsetters-sections.js';

const parsers = {
  'columns-feature': columnsFeatureParser,
  'table-spec': tableSpecParser,
};

const PAGE_TEMPLATE = {
  name: 'blog-article',
  description: 'Blog article detail page with hero header columns and long-form body content',
  urls: [
    'https://wknd-trendsetters.site/blog/ace-pro-court-polo',
    'https://wknd-trendsetters.site/blog/fashion-blog-post',
    'https://wknd-trendsetters.site/blog/fashion-trends-young-culture',
    'https://wknd-trendsetters.site/blog/fashion-trends-young-style',
    'https://wknd-trendsetters.site/blog/flip-flop-summer-style',
    'https://wknd-trendsetters.site/blog/latest-trends-young-casual-fashion',
    'https://wknd-trendsetters.site/blog/street-style-trends',
  ],
  blocks: [
    {
      name: 'columns-feature',
      instances: [
        'main > section.section .container > .grid-layout.tablet-1-column.grid-gap-lg',
      ],
    },
    {
      name: 'table-spec',
      instances: ['.blog-content table'],
    },
  ],
  sections: [
    { id: 'section-1', name: 'Article hero header', selector: 'main > section.section:nth-of-type(1)', style: null, blocks: ['columns-feature'], defaultContent: [] },
    { id: 'section-2', name: 'Article body', selector: 'main > section.section:nth-of-type(2)', style: null, blocks: ['table-spec'], defaultContent: [] },
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
      path: path || '/blog/article',
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
