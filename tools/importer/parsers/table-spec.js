/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the `table-spec` variant of the table block.
 *
 * Base block: table
 * Source pages: wknd-trendsetters.site blog articles (long-form body),
 *               e.g. /blog/ace-pro-court-polo.
 *
 * Source DOM shape (validated against
 * migration-work/block-context/table-spec/source.html):
 *   <table>                     <!-- element passed to parser -->
 *     <thead>
 *       <tr>
 *         <th>Spec</th>
 *         <th>Detail</th>
 *       </tr>
 *     </thead>
 *     <tbody>
 *       <tr>
 *         <td><strong>Sun Protection</strong></td>
 *         <td>UPF 50+ — blocks 98% of UV rays</td>
 *       </tr>
 *       ... (more rows) ...
 *     </tbody>
 *   </table>
 *
 * The source HTML may also appear without a <thead> (the rows then live as
 * direct <tr> children, or all inside <tbody>); both shapes are handled.
 *
 * Output table shape (per block library /block-collection/table example
 * and the local table-spec block decorator):
 *   Row 1: [['table-spec']]              – block name (added by createBlock).
 *   Row 2: [headerCell1, headerCell2]    – column labels (e.g. "Spec" | "Detail").
 *                                          Becomes <thead> in the rendered block.
 *   Row 3..N: [labelCell, valueCell]     – one row per spec, preserving inline
 *                                          markup such as <strong> wrappers.
 *
 * Notes on variation handling:
 *   - Header cells are looked up first in <thead> > <tr>; if absent, falls
 *     back to the first <tr> of the table when its cells are <th>.
 *   - Body rows are taken from <tbody>, falling back to all remaining <tr>s
 *     under the table (excluding the header row) so tables without an
 *     explicit <tbody> still parse correctly.
 *   - Each data cell's child nodes are placed into the output cell as an
 *     array, which preserves <strong>, <em>, <a>, etc. Empty cells become an
 *     empty string so the row column count stays stable.
 *   - Rows whose cells are entirely empty are skipped defensively.
 */
export default function parse(element, { document }) {
  // Helper: convert a source <th>/<td> into the value placed in the cells
  // array. We reference the live child nodes (preserving <strong>, links,
  // etc.). When the cell has a single text node we return a trimmed string
  // for cleaner markdown output; otherwise we return the array of nodes.
  const cellContent = (cellEl) => {
    if (!cellEl) return '';
    const nodes = Array.from(cellEl.childNodes).filter((n) => {
      if (n.nodeType === 3) return n.textContent.trim().length > 0; // text
      return n.nodeType === 1; // element
    });
    if (nodes.length === 0) return '';
    if (nodes.length === 1 && nodes[0].nodeType === 3) {
      return nodes[0].textContent.trim();
    }
    return nodes;
  };

  // Resolve the header row. Prefer an explicit <thead> > <tr>; otherwise use
  // the first <tr> in the table when its cells are <th>.
  const allRows = Array.from(element.querySelectorAll(':scope > thead > tr, :scope > tbody > tr, :scope > tr'));
  let headerRow = element.querySelector(':scope > thead > tr');
  if (!headerRow && allRows.length) {
    const first = allRows[0];
    if (first.querySelector(':scope > th')) {
      headerRow = first;
    }
  }

  // Collect body rows: explicit <tbody> > <tr>, then any direct <tr> children
  // (covering tables that omit <tbody>). Exclude the header row if it ended
  // up here.
  const bodyRows = Array.from(
    element.querySelectorAll(':scope > tbody > tr, :scope > tr'),
  ).filter((tr) => tr !== headerRow);

  // Deduplicate while preserving order (the OR-selector above can match the
  // same node multiple times).
  const seen = new Set();
  const uniqueBodyRows = bodyRows.filter((tr) => {
    if (seen.has(tr)) return false;
    seen.add(tr);
    return true;
  });

  const cells = [];

  // Header row → column labels (becomes <thead> in the rendered block).
  if (headerRow) {
    const headerCells = Array.from(headerRow.querySelectorAll(':scope > th, :scope > td'));
    if (headerCells.length) {
      cells.push(headerCells.map(cellContent));
    }
  }

  // Body rows → spec/detail pairs (or however many columns the source has).
  uniqueBodyRows.forEach((tr) => {
    const tds = Array.from(tr.querySelectorAll(':scope > td, :scope > th'));
    if (!tds.length) return;
    const row = tds.map(cellContent);
    // Skip rows that are entirely empty.
    const hasContent = row.some((c) => {
      if (typeof c === 'string') return c.length > 0;
      return Array.isArray(c) ? c.length > 0 : !!c;
    });
    if (hasContent) cells.push(row);
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'table-spec',
    cells,
  });

  element.replaceWith(block);
}
