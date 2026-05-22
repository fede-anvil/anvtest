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

  // tools/importer/import-marketing-page.js
  var import_marketing_page_exports = {};
  __export(import_marketing_page_exports, {
    default: () => import_marketing_page_default
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

  // tools/importer/parsers/cards-image-grid.js
  function parse2(element, { document }) {
    const cardEls = Array.from(element.querySelectorAll(":scope > *"));
    const cardRows = cardEls.map((card) => {
      const img = card.querySelector("img.cover-image, img");
      return img ? [img] : null;
    }).filter((row) => row !== null);
    const rows = cardRows.length > 0 ? cardRows : Array.from(element.querySelectorAll("img.cover-image, img")).map((img) => [img]);
    const block = WebImporter.Blocks.createBlock(document, {
      name: "cards-image-grid",
      cells: rows
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-article.js
  function parse3(element, { document }) {
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

  // tools/importer/parsers/tabs-profile.js
  function parse4(element, { document }) {
    const panes = Array.from(
      element.querySelectorAll(":scope > .tabs-content > .tab-pane, .tabs-content > .tab-pane")
    );
    const buttons = Array.from(
      element.querySelectorAll(":scope > .tab-menu > .tab-menu-link, .tab-menu > .tab-menu-link, button.tab-menu-link")
    );
    const dedupe = (nodes) => {
      const seen = /* @__PURE__ */ new Set();
      return nodes.filter((n) => {
        if (seen.has(n)) return false;
        seen.add(n);
        return true;
      });
    };
    const uniquePanes = dedupe(panes);
    const uniqueButtons = dedupe(buttons);
    const count = Math.max(uniquePanes.length, uniqueButtons.length);
    const rows = [];
    for (let i = 0; i < count; i += 1) {
      const pane = uniquePanes[i];
      const button = uniqueButtons[i];
      const labelCell = [];
      if (button) {
        const avatarImg = button.querySelector(".avatar img.cover-image, .avatar img, img.cover-image, img");
        if (avatarImg) labelCell.push(avatarImg);
        const nameStrong = button.querySelector("strong");
        const paragraphSmEls = Array.from(button.querySelectorAll(".paragraph-sm"));
        let roleText = null;
        for (const p of paragraphSmEls) {
          if (!p.querySelector("strong")) {
            roleText = p.textContent.trim();
            break;
          }
        }
        if (!roleText && nameStrong) {
          const nameWrapper = nameStrong.closest("div");
          if (nameWrapper && nameWrapper.nextElementSibling && !nameWrapper.nextElementSibling.querySelector("strong")) {
            roleText = nameWrapper.nextElementSibling.textContent.trim();
          }
        }
        if (nameStrong) {
          const namePara = document.createElement("p");
          const strongClone = document.createElement("strong");
          strongClone.textContent = nameStrong.textContent.trim();
          namePara.appendChild(strongClone);
          labelCell.push(namePara);
        }
        if (roleText && (!nameStrong || roleText !== nameStrong.textContent.trim())) {
          const rolePara = document.createElement("p");
          rolePara.textContent = roleText;
          labelCell.push(rolePara);
        }
      }
      const contentCell = [];
      if (pane) {
        const portraitImg = pane.querySelector("img.cover-image, img");
        if (portraitImg) contentCell.push(portraitImg);
        const paneNameStrong = pane.querySelector(".paragraph-xl strong, strong");
        if (paneNameStrong) {
          const namePara = document.createElement("p");
          const strongClone = document.createElement("strong");
          strongClone.textContent = paneNameStrong.textContent.trim();
          namePara.appendChild(strongClone);
          contentCell.push(namePara);
        }
        let paneRoleText = null;
        if (paneNameStrong) {
          const nameWrapper = paneNameStrong.closest(".paragraph-xl");
          if (nameWrapper && nameWrapper.nextElementSibling) {
            paneRoleText = nameWrapper.nextElementSibling.textContent.trim();
          }
        }
        if (!paneRoleText) {
          const candidate = pane.querySelector("div > div:not(.paragraph-xl)");
          if (candidate) paneRoleText = candidate.textContent.trim();
        }
        if (paneRoleText) {
          const rolePara = document.createElement("p");
          rolePara.textContent = paneRoleText;
          contentCell.push(rolePara);
        }
        const quote = pane.querySelector("p.paragraph-xl, p");
        if (quote) contentCell.push(quote);
      }
      if (labelCell.length === 0 && contentCell.length === 0) continue;
      rows.push([labelCell, contentCell]);
    }
    const block = WebImporter.Blocks.createBlock(document, {
      name: "tabs-profile",
      cells: rows
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-faq.js
  function parse5(element, { document }) {
    const itemEls = Array.from(
      element.querySelectorAll(":scope > details.faq-item, :scope > details")
    );
    const seen = /* @__PURE__ */ new Set();
    const uniqueItems = itemEls.filter((node) => {
      if (seen.has(node)) return false;
      seen.add(node);
      return true;
    });
    const itemRows = uniqueItems.map((item) => {
      const summary = item.querySelector(":scope > summary.faq-question, :scope > summary");
      let titleCell = "";
      if (summary) {
        const span = summary.querySelector("span");
        if (span && span.textContent.trim()) {
          titleCell = span.textContent.trim();
        } else {
          const text = Array.from(summary.childNodes).filter((n) => !(n.nodeType === 1 && n.tagName === "IMG")).map((n) => (n.textContent || "").trim()).filter(Boolean).join(" ");
          titleCell = text;
        }
      }
      let contentCell = item.querySelector(":scope > div.faq-answer, :scope > .faq-answer");
      if (!contentCell) {
        const fallback = Array.from(item.children).filter((c) => c.tagName !== "SUMMARY");
        if (fallback.length === 1) {
          contentCell = fallback[0];
        } else if (fallback.length > 1) {
          contentCell = fallback;
        } else {
          contentCell = "";
        }
      }
      if (!titleCell && (!contentCell || Array.isArray(contentCell) && contentCell.length === 0)) {
        return null;
      }
      return [titleCell, contentCell];
    }).filter((row) => row !== null);
    const block = WebImporter.Blocks.createBlock(document, {
      name: "accordion-faq",
      cells: itemRows
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-overlay.js
  function parse6(element, { document }) {
    const bgImage = element.querySelector(
      'img.cover-image, img.utility-overlay, img[class*="cover"], img[class*="background"]'
    );
    const contentContainer = element.querySelector('.card-body, .utility-text-on-overlay, [class*="text-on-overlay"]') || element;
    const heading = contentContainer.querySelector(
      'h1, h2, h3, .h1-heading, [class*="heading"]'
    );
    const subheading = contentContainer.querySelector(
      'p.subheading, [class*="subheading"], p'
    );
    const ctaScope = contentContainer.querySelector('.button-group, [class*="button-group"]') || contentContainer;
    const ctaLinks = Array.from(ctaScope.querySelectorAll('a.button, a[class*="button"], a'));
    const cells = [];
    if (bgImage) {
      cells.push([bgImage]);
    }
    const contentNodes = [];
    if (heading) contentNodes.push(heading);
    if (subheading && subheading !== heading) contentNodes.push(subheading);
    contentNodes.push(...ctaLinks);
    if (contentNodes.length > 0) {
      cells.push([contentNodes]);
    }
    const block = WebImporter.Blocks.createBlock(document, {
      name: "hero-overlay",
      cells
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

  // tools/importer/import-marketing-page.js
  var parsers = {
    "columns-feature": parse,
    "cards-image-grid": parse2,
    "cards-article": parse3,
    "tabs-profile": parse4,
    "accordion-faq": parse5,
    "hero-overlay": parse6
  };
  var PAGE_TEMPLATE = {
    name: "marketing-page",
    description: "Top-level marketing/content pages with mixed sections (heroes, columns, cards grids, tabs, FAQ, hero overlays)",
    urls: [
      "https://wknd-trendsetters.site/case-studies",
      "https://wknd-trendsetters.site/faq",
      "https://wknd-trendsetters.site/fashion-insights",
      "https://wknd-trendsetters.site/fashion-trends-of-the-season",
      "https://wknd-trendsetters.site/fashion-trends-young-adults",
      "https://wknd-trendsetters.site/fashion-trends-young-adults-casual-sport"
    ],
    blocks: [
      {
        name: "columns-feature",
        instances: [
          "main > section.section .container > .grid-layout.tablet-1-column.grid-gap-lg",
          "main > section.section .container > .grid-layout.desktop-3-column"
        ]
      },
      {
        name: "cards-image-grid",
        instances: [
          ".grid-layout.desktop-4-column.grid-gap-sm",
          ".grid-layout.desktop-3-column.grid-gap-sm"
        ]
      },
      {
        name: "cards-article",
        instances: [".grid-layout.desktop-4-column.grid-gap-md"]
      },
      {
        name: "tabs-profile",
        instances: [".tabs-wrapper"]
      },
      {
        name: "accordion-faq",
        instances: [".faq-list"]
      },
      {
        name: "hero-overlay",
        instances: ["main > section.section.inverse-section .grid-layout"]
      }
    ],
    sections: [
      { id: "section-hero", name: "Page hero", selector: "main > header.section.secondary-section", style: "secondary", blocks: [], defaultContent: [] },
      { id: "section-secondary", name: "Secondary background section", selector: "main > section.section.secondary-section", style: "secondary", blocks: ["columns-feature", "cards-image-grid", "cards-article", "tabs-profile", "accordion-faq"], defaultContent: [] },
      { id: "section-default", name: "Default background section", selector: "main > section.section:not(.secondary-section):not(.accent-section):not(.inverse-section)", style: null, blocks: ["columns-feature", "cards-image-grid", "cards-article", "tabs-profile", "accordion-faq"], defaultContent: [] },
      { id: "section-accent", name: "Accent CTA section", selector: "main > section.section.accent-section", style: "accent", blocks: [], defaultContent: [] },
      { id: "section-inverse", name: "Dark/inverse hero section", selector: "main > section.section.inverse-section", style: null, blocks: ["hero-overlay"], defaultContent: [] }
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
  var import_marketing_page_default = {
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
        path: path || "/index",
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_marketing_page_exports);
})();
