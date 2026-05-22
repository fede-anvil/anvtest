/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-blog-index.js
  var import_blog_index_exports = {};
  __export(import_blog_index_exports, {
    default: () => import_blog_index_default
  });

  // tools/importer/parsers/columns-feature.js
  function parse(element, { document }) {
    const columns = Array.from(element.querySelectorAll(":scope > *"));
    const columnCells = columns.map((col) => {
      const children = Array.from(col.children);
      if (children.length === 0) {
        const text = col.textContent.trim();
        return text ? text : null;
      }
      return col;
    }).filter((c) => c !== null);
    const contentRow = columnCells.length > 0 ? columnCells : [element];
    const cells = [
      contentRow
    ];
    const block = WebImporter.Blocks.createBlock(document, {
      name: "columns-feature",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-article.js
  function parse2(element, { document }) {
    const cardEls = Array.from(
      element.querySelectorAll(":scope > a.article-card, :scope > a.card-link, :scope > *")
    );
    const seen = /* @__PURE__ */ new Set();
    const uniqueCards = cardEls.filter((node) => {
      if (seen.has(node)) return false;
      seen.add(node);
      return true;
    });
    const cardRows = uniqueCards.map((card) => {
      const img = card.querySelector("img.cover-image, .article-card-image img, img");
      const tag = card.querySelector(".article-card-meta .tag, .tag");
      const date = card.querySelector(
        ".article-card-meta .paragraph-sm, .article-card-meta .utility-text-secondary, .article-card-meta span:not(.tag)"
      );
      const heading = card.querySelector(
        'h1, h2, h3, h4, h5, h6, .h4-heading, [class*="heading"]'
      );
      let cta = null;
      const href = card.getAttribute("href");
      if (href) {
        cta = document.createElement("a");
        cta.setAttribute("href", href);
        cta.textContent = heading && heading.textContent.trim() || tag && tag.textContent.trim() || "Read more";
      }
      if (!img && !tag && !date && !heading && !cta) return null;
      const textCell = [];
      if (tag) textCell.push(tag);
      if (date) textCell.push(date);
      if (heading) textCell.push(heading);
      if (cta) textCell.push(cta);
      return [img || "", textCell];
    }).filter((row) => row !== null);
    const block = WebImporter.Blocks.createBlock(document, {
      name: "cards-article",
      cells: cardRows
    });
    element.replaceWith(block);
  }

  // tools/importer/transformers/wknd-trendsetters-cleanup.js
  var TransformHook = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "a.skip-link",
        "div.navbar",
        "footer.footer",
        "link",
        "noscript",
        "iframe",
        "source"
      ]);
      element.querySelectorAll("*").forEach((el) => {
        const names = el.getAttributeNames ? el.getAttributeNames() : Array.from(el.attributes).map((a) => a.name);
        names.forEach((name) => {
          if (name.indexOf("data-astro-cid-") === 0 || name === "data-astro-cid" || name.indexOf("astro-") === 0) {
            el.removeAttribute(name);
          }
        });
      });
    }
  }

  // tools/importer/transformers/wknd-trendsetters-sections.js
  var TransformHook2 = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function classTokensFromSectionSelector(selector) {
    if (!selector || typeof selector !== "string") return [];
    const lastSegment = selector.split(">").pop().trim();
    const cleaned = lastSegment.replace(/:[a-zA-Z-]+\([^)]*\)/g, "").replace(/:[a-zA-Z-]+/g, "");
    const tokens = [];
    cleaned.split(/[\s>]+/).forEach((part) => {
      const matches = part.match(/\.[A-Za-z0-9_-]+/g);
      if (matches) {
        matches.forEach((m) => tokens.push(m.slice(1)));
      }
    });
    return tokens;
  }
  function elementMatchesClassTokens(el, tokens) {
    if (!el || !tokens || tokens.length === 0) return true;
    return tokens.every((t) => el.classList && el.classList.contains(t));
  }
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
    const template = payload && payload.template;
    if (!template || !Array.isArray(template.sections) || template.sections.length === 0) {
      return;
    }
    const document = element.ownerDocument;
    const sections = template.sections;
    const main = element.tagName && element.tagName.toLowerCase() === "main" ? element : element.querySelector("main") || element;
    const mainChildren = Array.from(main.children || []);
    const resolved = [];
    let cursor = 0;
    sections.forEach((section) => {
      const tokens = classTokensFromSectionSelector(section.selector);
      let matchIndex = -1;
      for (let i = cursor; i < mainChildren.length; i += 1) {
        if (elementMatchesClassTokens(mainChildren[i], tokens)) {
          matchIndex = i;
          break;
        }
      }
      if (matchIndex === -1) {
        let fallback = null;
        try {
          fallback = main.querySelector(section.selector);
        } catch (e) {
          fallback = null;
        }
        if (fallback && fallback.parentNode === main) {
          const idx = mainChildren.indexOf(fallback);
          if (idx >= cursor) {
            matchIndex = idx;
          }
        }
      }
      if (matchIndex !== -1) {
        resolved.push(mainChildren[matchIndex]);
        cursor = matchIndex + 1;
      } else {
        resolved.push(null);
      }
    });
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const el = resolved[i];
      if (!el) continue;
      if (section.style) {
        const metaBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: {
            Style: section.style
          }
        });
        el.appendChild(metaBlock);
      }
      if (i > 0) {
        const hr = document.createElement("hr");
        el.parentNode.insertBefore(hr, el);
      }
    }
  }

  // tools/importer/import-blog-index.js
  var parsers = {
    "columns-feature": parse,
    "cards-article": parse2
  };
  var PAGE_TEMPLATE = {
    name: "blog-index",
    description: "Blog landing page listing recent articles",
    urls: [
      "https://wknd-trendsetters.site/blog"
    ],
    blocks: [
      {
        name: "columns-feature",
        instances: [
          "header.section.secondary-section .container > .grid-layout",
          "main > section.section:not(.secondary-section):not(.accent-section) .container > .grid-layout.tablet-1-column.grid-gap-lg"
        ]
      },
      {
        name: "cards-article",
        instances: [".grid-layout.desktop-4-column.grid-gap-md"]
      }
    ],
    sections: [
      { id: "section-1", name: "Blog page header", selector: "main > header.section.secondary-section", style: "secondary", blocks: ["columns-feature"], defaultContent: [] },
      { id: "section-2", name: "Featured article columns", selector: "main > section.section:nth-of-type(2)", style: null, blocks: ["columns-feature"], defaultContent: [] },
      { id: "section-3", name: "Article cards grid", selector: "main > section.section.secondary-section:nth-of-type(3)", style: "secondary", blocks: ["cards-article"], defaultContent: [] },
      { id: "section-4", name: "Subscribe CTA", selector: "main > section.section.accent-section", style: "accent", blocks: [], defaultContent: [] }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
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
    const seen = /* @__PURE__ */ new Set();
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
            section: blockDef.section || null
          });
        });
      });
    });
    return pageBlocks;
  }
  var import_blog_index_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path: path || "/blog",
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_blog_index_exports);
})();
