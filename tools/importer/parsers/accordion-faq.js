/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the `accordion-faq` variant of the accordion block.
 *
 * Base block: accordion
 * Source pages: wknd-trendsetters.site (homepage FAQ section, marketing pages
 *               with FAQ accordions).
 *
 * Source DOM shape (validated against
 * migration-work/block-context/accordion-faq/source.html):
 *   <div class="faq-list"> <!-- element -->
 *     <details class="faq-item">
 *       <summary class="faq-question">
 *         <span>How do I spot the latest trends?</span>
 *         <img src="data:image/svg+xml;..."> <!-- toggle icon, ignored -->
 *       </summary>
 *       <div class="faq-answer">
 *         <p>We keep it fresh! ...</p>
 *       </div>
 *     </details>
 *     ... (4 items total) ...
 *   </div>
 *
 * Output table shape (per block library example /block-collection/accordion):
 *   Row 1: [['accordion-faq']] – block name (added automatically by
 *          WebImporter.Blocks.createBlock).
 *   Row N: two cells per FAQ item – [title | content].
 *          - Title cell: the question text (extracted from <summary>'s <span>,
 *            with the toggle <img> icon excluded).
 *          - Content cell: the answer body (the <div class="faq-answer">
 *            element preserves <p> and any inline markup).
 *
 * Notes on variation handling:
 *   - Items are looked up via `details.faq-item`, with a fallback to any
 *     direct `<details>` child to tolerate markup drift.
 *   - The question text is preferred from `summary.faq-question > span`;
 *     fallbacks read the summary's text content while excluding the icon
 *     <img> so we never put the SVG icon into the title cell.
 *   - The answer cell prefers `div.faq-answer`; if absent, every non-summary
 *     child of <details> is collected (covering markup that puts answer
 *     content directly in <details>).
 *   - Items missing both a question and an answer are skipped defensively.
 */
export default function parse(element, { document }) {
  // Each accordion item is a <details> element. Prefer the explicit
  // faq-item class; fall back to any direct <details> child for safety.
  const itemEls = Array.from(
    element.querySelectorAll(':scope > details.faq-item, :scope > details'),
  );

  // De-duplicate while preserving order (the OR-selector above can match
  // the same node multiple times for elements that satisfy several rules).
  const seen = new Set();
  const uniqueItems = itemEls.filter((node) => {
    if (seen.has(node)) return false;
    seen.add(node);
    return true;
  });

  const itemRows = uniqueItems
    .map((item) => {
      // Title cell – question text from <summary>'s <span>. Fall back to
      // the summary's text content (icon <img> excluded) if the span is
      // missing.
      const summary = item.querySelector(':scope > summary.faq-question, :scope > summary');
      let titleCell = '';
      if (summary) {
        const span = summary.querySelector('span');
        if (span && span.textContent.trim()) {
          titleCell = span.textContent.trim();
        } else {
          // Build text content while skipping the toggle icon <img>.
          const text = Array.from(summary.childNodes)
            .filter((n) => !(n.nodeType === 1 && n.tagName === 'IMG'))
            .map((n) => (n.textContent || '').trim())
            .filter(Boolean)
            .join(' ');
          titleCell = text;
        }
      }

      // Content cell – the answer wrapper preserves <p> and inline markup.
      // Fall back to all non-summary children if the wrapper is absent.
      let contentCell = item.querySelector(':scope > div.faq-answer, :scope > .faq-answer');
      if (!contentCell) {
        const fallback = Array.from(item.children).filter((c) => c.tagName !== 'SUMMARY');
        if (fallback.length === 1) {
          contentCell = fallback[0];
        } else if (fallback.length > 1) {
          contentCell = fallback;
        } else {
          contentCell = '';
        }
      }

      // Skip empty items defensively.
      if (!titleCell && (!contentCell || (Array.isArray(contentCell) && contentCell.length === 0))) {
        return null;
      }

      return [titleCell, contentCell];
    })
    .filter((row) => row !== null);

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'accordion-faq',
    cells: itemRows,
  });

  element.replaceWith(block);
}
