/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-overlay variant.
 * Base block: hero
 * Source URL: https://wknd-trendsetters.site/ (last section), https://wknd-trendsetters.site/case-studies
 * Generated: 2026-05-22
 *
 * Block library structure (hero-overlay):
 *   Row 1: block name (`hero-overlay`)
 *   Row 2: background image (full-bleed)
 *   Row 3: heading + subheading + CTA button(s) (overlaid text content)
 *
 * Source DOM (from migration-work/block-context/hero-overlay/source.html):
 *   .grid-layout.desktop-1-column
 *     > .utility-position-relative.utility-radius-card.utility-overflow-clip
 *         > img.cover-image.utility-overlay   (background image)
 *         > .overlay.utility-z-index-1        (visual dark overlay - skip)
 *         > .card-body.utility-text-on-overlay
 *             > h2.h1-heading                 (heading)
 *             > p.subheading                  (subheading)
 *             > .button-group > a.button      (CTA links)
 */
export default function parse(element, { document }) {
  // Background image: the full-bleed cover image sits inside the relative-positioned wrapper.
  // Use class-based selectors with broader fallbacks for variation.
  const bgImage = element.querySelector(
    'img.cover-image, img.utility-overlay, img[class*="cover"], img[class*="background"]'
  );

  // Content container — overlaid text body. Fall back to any descendant if class names differ.
  const contentContainer =
    element.querySelector('.card-body, .utility-text-on-overlay, [class*="text-on-overlay"]') || element;

  // Heading: h1/h2 inside the content body. Class fallbacks accommodate different heading levels.
  const heading = contentContainer.querySelector(
    'h1, h2, h3, .h1-heading, [class*="heading"]'
  );

  // Subheading / supporting paragraph. Prefer the explicit subheading class, then any <p>.
  const subheading = contentContainer.querySelector(
    'p.subheading, [class*="subheading"], p'
  );

  // CTA links: collect all anchors from the button group. Mutually-exclusive scope:
  // restrict to descendants of `.button-group`/content body so we don't grab unrelated links.
  const ctaScope = contentContainer.querySelector('.button-group, [class*="button-group"]') || contentContainer;
  const ctaLinks = Array.from(ctaScope.querySelectorAll('a.button, a[class*="button"], a'));

  // Build cells matching the hero-overlay block library structure.
  // Each entry of `cells` is a row. A row containing a single array maps to one cell that holds
  // multiple nodes (so heading + subheading + CTAs render as a single overlay cell, not 3 columns).
  const cells = [];

  // Row: background image (only if present in the source)
  if (bgImage) {
    cells.push([bgImage]);
  }

  // Row: overlay text content — collect into an array wrapped as a single cell.
  const contentNodes = [];
  if (heading) contentNodes.push(heading);
  if (subheading && subheading !== heading) contentNodes.push(subheading);
  contentNodes.push(...ctaLinks);
  if (contentNodes.length > 0) {
    cells.push([contentNodes]);
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'hero-overlay',
    cells,
  });
  element.replaceWith(block);
}
