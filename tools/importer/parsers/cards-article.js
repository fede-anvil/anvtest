/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the `cards-article` variant of the cards block.
 *
 * Base block: cards
 * Source pages: wknd-trendsetters.site (homepage "Latest articles" section,
 *               blog index "Article cards grid", marketing pages with
 *               article-card grids).
 *
 * Source DOM shape (validated against
 * migration-work/block-context/cards-article/source.html):
 *   <div class="grid-layout desktop-4-column ... grid-gap-md"> <!-- element -->
 *     <a href="/blog/..." class="article-card card-link">
 *       <div class="article-card-image">
 *         <img src="..." alt="..." class="cover-image">
 *       </div>
 *       <div class="article-card-body">
 *         <div class="article-card-meta">
 *           <span class="tag">Casual Cool</span>
 *           <span class="paragraph-sm utility-text-secondary">May 12</span>
 *         </div>
 *         <h3 class="h4-heading">Tennis style, redefined</h3>
 *       </div>
 *     </a>
 *     ... (repeated, one per card) ...
 *   </div>
 *
 * Output table shape (per block library example /block-collection/cards):
 *   Row 1: [['cards-article']] – block name (added automatically by
 *           WebImporter.Blocks.createBlock).
 *   Row N: two cells per card – [image | text content].
 *           The text-content cell contains the tag, date, heading, and the
 *           card link (which acts as the CTA wrapping the whole card on
 *           the source page).
 *
 * Notes on variation handling:
 *   - Direct children are <a class="article-card card-link"> elements; we
 *     also accept any direct child as a fallback to tolerate markup drift.
 *   - Image lookup falls back to the first <img> inside the card so a
 *     missing `cover-image` class doesn't break extraction.
 *   - Tag, date and heading are each looked up independently with
 *     fallbacks, and only added to the cell when present.
 *   - The card's <a> href is preserved as the CTA for the article. We
 *     create a fresh anchor (using the heading text) so the original
 *     wrapping <a> structure is not duplicated when placed in cells.
 *   - Cards missing both an image and any text are skipped defensively.
 */
export default function parse(element, { document }) {
  // Direct children of the grid are individual cards. Prefer the explicit
  // article-card anchor; fall back to any direct child element for safety.
  const cardEls = Array.from(
    element.querySelectorAll(':scope > a.article-card, :scope > a.card-link, :scope > *'),
  );

  // De-duplicate while preserving order (the OR-selector above can match
  // the same node multiple times for elements that satisfy several rules).
  const seen = new Set();
  const uniqueCards = cardEls.filter((node) => {
    if (seen.has(node)) return false;
    seen.add(node);
    return true;
  });

  const cardRows = uniqueCards
    .map((card) => {
      // Image cell – prefer the cover-image class, fall back to any <img>.
      const img = card.querySelector('img.cover-image, .article-card-image img, img');

      // Text cell pieces.
      const tag = card.querySelector('.article-card-meta .tag, .tag');
      const date = card.querySelector(
        '.article-card-meta .paragraph-sm, .article-card-meta .utility-text-secondary, .article-card-meta span:not(.tag)',
      );
      const heading = card.querySelector(
        'h1, h2, h3, h4, h5, h6, .h4-heading, [class*="heading"]',
      );

      // Build a CTA link from the card's own href so the article URL is
      // preserved. We synthesize a new anchor (rather than reusing the
      // wrapping <a>, which contains the entire card) so the cell stays
      // a clean text-content cell.
      let cta = null;
      const href = card.getAttribute('href');
      if (href) {
        cta = document.createElement('a');
        cta.setAttribute('href', href);
        cta.textContent = (heading && heading.textContent.trim())
          || (tag && tag.textContent.trim())
          || 'Read more';
      }

      // Skip empty cards defensively.
      if (!img && !tag && !date && !heading && !cta) return null;

      const textCell = [];
      if (tag) textCell.push(tag);
      if (date) textCell.push(date);
      if (heading) textCell.push(heading);
      if (cta) textCell.push(cta);

      return [img || '', textCell];
    })
    .filter((row) => row !== null);

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'cards-article',
    cells: cardRows,
  });

  element.replaceWith(block);
}
