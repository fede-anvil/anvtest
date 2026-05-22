/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the `cards-image-grid` variant of the cards block.
 *
 * Base block: cards
 * Source pages: wknd-trendsetters.site (homepage "Style snapshot gallery"
 *               section, marketing-page "case-studies" gallery sections).
 *
 * Source DOM shape (validated against
 * migration-work/block-context/cards-image-grid/source.html):
 *   <div class="grid-layout desktop-4-column ... grid-gap-sm"> <!-- element -->
 *     <div class="utility-aspect-1x1">
 *       <img src="..." alt="..." class="cover-image">
 *     </div>
 *     ... (repeated, one per card) ...
 *   </div>
 *
 * Output table shape (per block library example /block-collection/cards):
 *   Row 1: [['cards-image-grid']] – block name (added automatically by
 *           WebImporter.Blocks.createBlock).
 *   Row N: one cell per card containing only the <img> element. The
 *           `cards-image-grid` variant is image-only (no text/captions),
 *           so each card row is a single cell with one image.
 *
 * Notes on variation handling:
 *   - Each direct child div is treated as a card. Some authoring variants
 *     wrap the image in `.utility-aspect-1x1`, others may use other
 *     wrappers — we use `:scope > *` to capture any direct child.
 *   - We extract the first <img> within each card so that wrapper-only
 *     anchors or extra spans don't break extraction.
 *   - Cards that contain no image are skipped (defensive – source HTML
 *     for this variant always has exactly one image per card).
 */
export default function parse(element, { document }) {
  // Direct children of the grid are individual cards. Using :scope > *
  // ensures we don't accidentally pull nested elements up to the card level.
  const cardEls = Array.from(element.querySelectorAll(':scope > *'));

  // Build one row per card. For the image-grid variant each card is a
  // single cell containing just the <img>. We reference the existing
  // <img> element directly so src/alt/srcset are preserved.
  const cardRows = cardEls
    .map((card) => {
      // Prefer the explicit cover image class, fall back to any <img>
      // inside the card so we tolerate small markup variations.
      const img = card.querySelector('img.cover-image, img');
      return img ? [img] : null;
    })
    .filter((row) => row !== null);

  // Defensive fallback: if no card images were found via direct children
  // (unexpected DOM), grab every image inside the grid so nothing is lost.
  const rows = cardRows.length > 0
    ? cardRows
    : Array.from(element.querySelectorAll('img.cover-image, img')).map((img) => [img]);

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'cards-image-grid',
    cells: rows,
  });

  element.replaceWith(block);
}
