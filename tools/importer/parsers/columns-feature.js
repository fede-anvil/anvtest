/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the `columns-feature` variant of the columns block.
 *
 * Base block: columns
 * Source pages: wknd-trendsetters.site (homepage, blog-index, blog-article, marketing-page)
 *
 * Source DOM shape (validated against migration-work/block-context/columns-feature/source.html):
 *   <div class="grid-layout ..."> <!-- this is `element` -->
 *     <div>...heading + paragraph + button-group + (images)...</div>
 *     <div class="grid-layout ...">...one or more <img>...</div>
 *   </div>
 *
 * Output table shape (per block library example):
 *   Row 1: [['columns-feature']] – block name only
 *   Row 2: one cell per column (each cell holds the original column's content elements)
 *
 * The columns-feature variant is a 2-column (occasionally 3-column) side-by-side
 * layout where each direct child <div> of the grid is one column. The parser
 * preserves whatever the column contains – text + CTAs, media, or a nested
 * image grid – by referencing the existing child elements in the cells array.
 */
export default function parse(element, { document }) {
  // Direct children of the grid layout are the columns. Using :scope > * keeps
  // us from accidentally pulling nested grids' children up to the top level.
  const columns = Array.from(element.querySelectorAll(':scope > *'));

  // Build the content for each column. We pass the column element through as-is
  // so that all of its content (headings, paragraphs, button-group anchors,
  // images, nested grids of images, etc.) is preserved with original semantics.
  const columnCells = columns
    .map((col) => {
      // If the column is itself an empty wrapper, fall back to its children.
      const children = Array.from(col.children);
      if (children.length === 0) {
        // No element children – include text content if any, otherwise skip.
        const text = col.textContent.trim();
        return text ? text : null;
      }
      // Reference the column element directly. The importer will serialize its
      // inner content into the cell, preserving headings/links/images.
      return col;
    })
    .filter((c) => c !== null);

  // Defensive fallback: if no direct-child columns were found (unexpected DOM),
  // place the entire element's content into a single cell so nothing is lost.
  const contentRow = columnCells.length > 0 ? columnCells : [element];

  const cells = [
    contentRow,
  ];

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'columns-feature',
    cells,
  });

  element.replaceWith(block);
}
