/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the `tabs-profile` variant of the tabs block.
 *
 * Base block: tabs
 * Source pages: wknd-trendsetters.site (homepage "Profile testimonial tabs"
 *               section, marketing pages such as /case-studies that reuse
 *               the same tabs-wrapper structure).
 *
 * Source DOM shape (validated against
 * migration-work/block-context/tabs-profile/source.html):
 *   <div class="tabs-wrapper"> <!-- element -->
 *     <div class="tabs-content">
 *       <div class="tab-pane is-active" id="tabpanel-0">
 *         <div class="grid-layout ...">
 *           <div><img class="cover-image" src="..." alt="Alex Rivera"></div>
 *           <div>
 *             <div>
 *               <div class="paragraph-xl ..."><strong>Alex Rivera</strong></div>
 *               <div>Streetwear Enthusiast</div>
 *             </div>
 *             <p class="paragraph-xl">"...quote..."</p>
 *           </div>
 *         </div>
 *       </div>
 *       ... (one .tab-pane per profile) ...
 *     </div>
 *     <div class="... tab-menu">
 *       <button class="tab-menu-link is-active" id="tab-0">
 *         <div class="flex-horizontal ...">
 *           <div class="avatar"><img class="cover-image" src="..." alt=""></div>
 *           <div>
 *             <div class="paragraph-sm ..."><strong>Alex Rivera</strong></div>
 *             <div class="paragraph-sm ...">Streetwear Enthusiast</div>
 *           </div>
 *         </div>
 *       </button>
 *       ... (one button per profile) ...
 *     </div>
 *   </div>
 *
 * Output table shape (per /block-collection/tabs library example):
 *   Row 1: [['tabs-profile']] – block name (added by
 *          WebImporter.Blocks.createBlock).
 *   Subsequent rows: 2 cells – [tab label | tab content], one per profile.
 *
 *   Tab label cell: avatar image + name + role (from the matching
 *                   `.tab-menu-link` button).
 *   Tab content cell: portrait image + name + role + quote
 *                     (from the matching `.tab-pane`).
 *
 * Notes on variation handling:
 *   - Tab panes are paired with tab buttons by index. If counts differ,
 *     we use the smaller count and fall back gracefully.
 *   - Image lookup falls back to any `<img>` if `.cover-image` is absent.
 *   - Name/role lookups use multiple fallbacks so missing utility classes
 *     don't break extraction.
 *   - Quote falls back to any `<p>` inside the pane body when
 *     `.paragraph-xl` is missing.
 *   - Empty profiles (no name and no image) are skipped defensively.
 */
export default function parse(element, { document }) {
  // Locate tab panes (content) and tab menu buttons (labels).
  const panes = Array.from(
    element.querySelectorAll(':scope > .tabs-content > .tab-pane, .tabs-content > .tab-pane'),
  );
  const buttons = Array.from(
    element.querySelectorAll(':scope > .tab-menu > .tab-menu-link, .tab-menu > .tab-menu-link, button.tab-menu-link'),
  );

  // De-duplicate while preserving order (the OR-selector above can match
  // the same node multiple times).
  const dedupe = (nodes) => {
    const seen = new Set();
    return nodes.filter((n) => {
      if (seen.has(n)) return false;
      seen.add(n);
      return true;
    });
  };
  const uniquePanes = dedupe(panes);
  const uniqueButtons = dedupe(buttons);

  // Pair panes and buttons by index; iterate over the longer list so the
  // parser still extracts content if one side is missing nodes.
  const count = Math.max(uniquePanes.length, uniqueButtons.length);

  const rows = [];
  for (let i = 0; i < count; i += 1) {
    const pane = uniquePanes[i];
    const button = uniqueButtons[i];

    // ---- Build the tab label cell (from the menu button) ----
    const labelCell = [];
    if (button) {
      // Avatar image — prefer the avatar wrapper, fall back to any <img>.
      const avatarImg = button.querySelector('.avatar img.cover-image, .avatar img, img.cover-image, img');
      if (avatarImg) labelCell.push(avatarImg);

      // Name (inside <strong>) and role text. The button has two
      // sibling `.paragraph-sm` divs: the first wraps a <strong> name,
      // the second is plain-text role.
      const nameStrong = button.querySelector('strong');
      const paragraphSmEls = Array.from(button.querySelectorAll('.paragraph-sm'));
      let roleText = null;
      // Find the first .paragraph-sm without a <strong> child (role text).
      for (const p of paragraphSmEls) {
        if (!p.querySelector('strong')) {
          roleText = p.textContent.trim();
          break;
        }
      }
      // Fallback: if structure differs, look for a sibling div of the
      // name's wrapper that has no <strong> tag.
      if (!roleText && nameStrong) {
        const nameWrapper = nameStrong.closest('div');
        if (nameWrapper && nameWrapper.nextElementSibling
            && !nameWrapper.nextElementSibling.querySelector('strong')) {
          roleText = nameWrapper.nextElementSibling.textContent.trim();
        }
      }

      if (nameStrong) {
        // Wrap the name in its own line so it stays bold and on top.
        const namePara = document.createElement('p');
        const strongClone = document.createElement('strong');
        strongClone.textContent = nameStrong.textContent.trim();
        namePara.appendChild(strongClone);
        labelCell.push(namePara);
      }
      if (roleText && (!nameStrong || roleText !== nameStrong.textContent.trim())) {
        const rolePara = document.createElement('p');
        rolePara.textContent = roleText;
        labelCell.push(rolePara);
      }
    }

    // ---- Build the tab content cell (from the pane) ----
    const contentCell = [];
    if (pane) {
      // Portrait image — prefer cover-image inside the pane.
      const portraitImg = pane.querySelector('img.cover-image, img');
      if (portraitImg) contentCell.push(portraitImg);

      // Name from the pane (paragraph-xl utility-margin-bottom-0 > strong).
      const paneNameStrong = pane.querySelector('.paragraph-xl strong, strong');
      if (paneNameStrong) {
        const namePara = document.createElement('p');
        const strongClone = document.createElement('strong');
        strongClone.textContent = paneNameStrong.textContent.trim();
        namePara.appendChild(strongClone);
        contentCell.push(namePara);
      }

      // Role — the second inner div alongside the name block.
      // Look for a div sibling of the name container that's plain text.
      let paneRoleText = null;
      if (paneNameStrong) {
        const nameWrapper = paneNameStrong.closest('.paragraph-xl');
        if (nameWrapper && nameWrapper.nextElementSibling) {
          paneRoleText = nameWrapper.nextElementSibling.textContent.trim();
        }
      }
      if (!paneRoleText) {
        // Fallback: any non-paragraph-xl, non-empty div text inside the pane.
        const candidate = pane.querySelector('div > div:not(.paragraph-xl)');
        if (candidate) paneRoleText = candidate.textContent.trim();
      }
      if (paneRoleText) {
        const rolePara = document.createElement('p');
        rolePara.textContent = paneRoleText;
        contentCell.push(rolePara);
      }

      // Quote — prefer paragraph-xl <p>, fall back to any <p>.
      const quote = pane.querySelector('p.paragraph-xl, p');
      if (quote) contentCell.push(quote);
    }

    // Skip rows that ended up entirely empty.
    if (labelCell.length === 0 && contentCell.length === 0) continue;

    rows.push([labelCell, contentCell]);
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'tabs-profile',
    cells: rows,
  });

  element.replaceWith(block);
}
