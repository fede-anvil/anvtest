/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: wknd-trendsetters site-wide cleanup.
 *
 * All selectors below were verified against the captured DOM in
 * `migration-work/cleaned.html` (and per-template cleaned.html files for
 * homepage, blog-index, blog-article, marketing-page). Every page on the
 * site is rendered by the same Astro shell, so these selectors apply
 * consistently across all templates.
 *
 * Removes (non-authorable site chrome):
 *   - <a class="skip-link"> ............ accessibility skip link injected by template
 *   - <div class="navbar"> ............. global top navigation
 *   - <footer class="footer"> .......... global footer
 *   - leftover <link>, <noscript>, <iframe>, <source> .. non-authorable
 *
 * Strips:
 *   - All `data-astro-cid-*` attributes (Astro framework adds these to
 *     virtually every element, e.g. data-astro-cid-37fxchfa).
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Nothing in the captured DOM blocks block parsing (no cookie banners,
    // overlays, or chat widgets observed across all 4 template samples).
    // Keep this hook empty to avoid removing anything we cannot justify
    // from captured DOM.
  }

  if (hookName === TransformHook.afterTransform) {
    // Remove non-authorable site chrome. Selectors verified in
    // migration-work/cleaned.html (skip-link line 1, navbar line 1,
    // footer line 93) and present on every per-template sample.
    WebImporter.DOMUtils.remove(element, [
      'a.skip-link',
      'div.navbar',
      'footer.footer',
      'link',
      'noscript',
      'iframe',
      'source',
    ]);

    // Strip Astro framework attributes (data-astro-cid-*). The captured
    // DOM shows data-astro-cid-37fxchfa across body, headings, sections,
    // etc. — these are framework-internal scoping ids, not authorable.
    element.querySelectorAll('*').forEach((el) => {
      // getAttributeNames is fastest path; fall back to scanning attributes.
      const names = el.getAttributeNames ? el.getAttributeNames() : Array.from(el.attributes).map((a) => a.name);
      names.forEach((name) => {
        if (name.indexOf('data-astro-cid-') === 0 || name === 'data-astro-cid' || name.indexOf('astro-') === 0) {
          el.removeAttribute(name);
        }
      });
    });
  }
}
