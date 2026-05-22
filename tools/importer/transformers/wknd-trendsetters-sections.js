/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: wknd-trendsetters section breaks + Section Metadata.
 *
 * Drives off `payload.template.sections` from page-templates.json. All
 * section selectors used here come from that file and have been verified
 * against captured DOM in:
 *   - migration-work/cleaned.html                          (marketing-page)
 *   - migration-work/per-template/homepage/cleaned.html
 *   - migration-work/per-template/blog-index/cleaned.html
 *   - migration-work/per-template/blog-article/cleaned.html
 *
 * Section style mapping (matches page-templates.json):
 *   - header.section.secondary-section / section.section.secondary-section
 *       -> Section Metadata { Style: secondary }
 *   - section.section.accent-section
 *       -> Section Metadata { Style: accent }
 *   - section.section.inverse-section
 *       -> no Section Metadata (block owns its dark visual)
 *   - section.section (no extra class)
 *       -> no Section Metadata
 *
 * Resolution strategy:
 *   The page-templates.json selectors use `:nth-of-type` which counts
 *   siblings of the same element type and can produce unexpected
 *   matches when a `<header>` precedes the `<section>` siblings (Astro
 *   shells on this site emit `<main> <header.section> <section.section>+
 *   </main>`). To stay aligned with the template's section ordering, we
 *   walk `<main>`'s direct children in document order and consume one
 *   child per template section, validating each against a simplified
 *   class signature derived from the template selector. This is more
 *   robust than the raw selectors while still being template-driven.
 *
 *   For each section (processed in REVERSE so insertions don't shift
 *   earlier indices), if section.style is set, append a Section Metadata
 *   block; for every non-first section, insert a <hr> before the section
 *   element to mark the section break.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

// Pull the list of class tokens out of the section's selector that are
// applied to the section element itself (e.g. ".secondary-section",
// ".accent-section", ".inverse-section", ".section"). We only care about
// the classes that appear on the section element segment of the
// selector — typically the last "main > ..." segment.
function classTokensFromSectionSelector(selector) {
  if (!selector || typeof selector !== 'string') return [];
  // Take the last combinator segment (after the final '>' if present).
  const lastSegment = selector.split('>').pop().trim();
  // Strip pseudo-classes (e.g. :nth-of-type(2)) for the class scan.
  const cleaned = lastSegment.replace(/:[a-zA-Z-]+\([^)]*\)/g, '').replace(/:[a-zA-Z-]+/g, '');
  // Extract class tokens.
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

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  // Guard: this transformer is template-driven. Without sections, do nothing.
  const template = payload && payload.template;
  if (!template || !Array.isArray(template.sections) || template.sections.length === 0) {
    return;
  }

  const document = element.ownerDocument;
  const sections = template.sections;

  // Identify the <main> root we're operating on. helix-importer passes the
  // <main> as `element`. In some pipelines a wrapper may be passed instead;
  // try `<main>` first, fall back to element itself.
  const main = element.tagName && element.tagName.toLowerCase() === 'main'
    ? element
    : (element.querySelector('main') || element);

  // Collect direct children of main in document order. These are the
  // potential section elements (the cleanup transformer is expected to
  // have already removed navbar/footer/skip-link, so children should be
  // section-like elements only).
  const mainChildren = Array.from(main.children || []);

  // Walk template sections sequentially and consume one main child per
  // template section. For each template section, scan forward from the
  // current cursor to find the next main child matching its class
  // signature; this tolerates extra noise but stays in document order.
  const resolved = []; // parallel to `sections`, holds matched element or null
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
      // Last-resort fallback: try the literal selector against main.
      let fallback = null;
      try {
        fallback = main.querySelector(section.selector);
      } catch (e) {
        fallback = null;
      }
      // If fallback is a direct child of main and at-or-after cursor, use it.
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

  // Process in reverse so that inserting nodes before a section element
  // does not shift the position of earlier ones we still need to address.
  for (let i = sections.length - 1; i >= 0; i -= 1) {
    const section = sections[i];
    const el = resolved[i];
    if (!el) continue;

    // 1) Section Metadata block for sections that declare a style.
    if (section.style) {
      const metaBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: {
          Style: section.style,
        },
      });
      // Append the metadata block at the end of the section so it sits
      // with the section's content before the following <hr>.
      el.appendChild(metaBlock);
    }

    // 2) Section break (<hr>) before every non-first section.
    if (i > 0) {
      const hr = document.createElement('hr');
      el.parentNode.insertBefore(hr, el);
    }
  }
}
