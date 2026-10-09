/* Shared vector icons. No icon fonts, Unicode presentation selectors, or emoji rendering.
 * Static markup is converted before publishing. Dynamic dialogs/controls are hydrated
 * synchronously in the mutation microtask, before the next browser paint. */
(function () {
  'use strict';
  const icons = {
    '↗': ['arrow-up-right', '<path d="M5 19 19 5M5 5h14v14"/>'],
    '↘': ['arrow-down-right', '<path d="m5 5 14 14M5 19h14V5"/>'],
    '↙': ['arrow-down-left', '<path d="M19 5 5 19M5 5v14h14"/>'],
    '↖': ['arrow-up-left', '<path d="M19 19 5 5M5 19V5h14"/>'],
    '→': ['arrow-right', '<path d="M4 12h16m-7-7 7 7-7 7"/>'],
    '←': ['arrow-left', '<path d="M20 12H4m7-7-7 7 7 7"/>'],
    '↑': ['arrow-up', '<path d="M12 20V4m-7 7 7-7 7 7"/>'],
    '↓': ['arrow-down', '<path d="M12 4v16m-7-7 7 7 7-7"/>'],
    '↻': ['reset', '<path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5"/>'],
    '✳': ['asterisk', '<path d="M12 2v20M2 12h20M5 5l14 14M5 19 19 5"/>'],
    '⌘': ['command', '<path d="M8 8V5.5A2.5 2.5 0 1 0 5.5 8H18.5A2.5 2.5 0 1 0 16 5.5v13A2.5 2.5 0 1 0 18.5 16h-13A2.5 2.5 0 1 0 8 18.5V8Z"/>'],
    '▶': ['play', '<path d="m7 4 13 8-13 8Z" fill="currentColor" stroke="none"/>'],
    '＋': ['plus', '<path d="M12 4v16M4 12h16"/>'],
    '◎': ['target', '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>'],
    '×': ['close', '<path d="m6 6 12 12M6 18 18 6"/>'],
    '≡': ['menu', '<path d="M4 6h16M4 12h16M4 18h16"/>'],
    '◆': ['diamond', '<path d="m12 5 7 7-7 7-7-7Z" fill="currentColor" stroke="none"/>']
  };
  function svgIcon(character) {
    const icon = icons[character];
    if (!icon) return character;
    return `<svg class="ui-icon icon-${icon[0]}" data-ui-icon="${icon[0]}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${icon[1]}</g></svg>`;
  }
  const pattern = () => new RegExp('([' + Object.keys(icons).join('') + '])[\\uFE0E\\uFE0F]?', 'gu');
  const iconizeText = text => text.replace(pattern(), (_, character) => svgIcon(character));
  // The same registry is used by the one-time source migration, avoiding two icon sets.
  if (typeof module !== 'undefined' && module.exports) module.exports = {icons, svgIcon, iconizeText};
  if (typeof document === 'undefined') return;
  const skipped = 'script,style,svg,textarea,pre,code,[data-no-ui-icons]';
  function eligible(node) {
    return node.parentElement && !node.parentElement.closest(skipped) && pattern().test(node.nodeValue || '');
  }
  function replaceNode(node) {
    if (!node.isConnected || !eligible(node)) return;
    const text = node.nodeValue;
    const fragment = document.createDocumentFragment();
    let end = 0;
    for (const match of text.matchAll(pattern())) {
      if (match.index > end) fragment.append(document.createTextNode(text.slice(end, match.index)));
      const template = document.createElement('template');
      template.innerHTML = svgIcon(match[1]);
      fragment.append(template.content);
      end = match.index + match[0].length;
    }
    if (end < text.length) fragment.append(document.createTextNode(text.slice(end)));
    node.replaceWith(fragment);
  }
  function hydrate(root) {
    if (root.nodeType === Node.TEXT_NODE) { replaceNode(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE || root.matches(skipped)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) if (eligible(node)) nodes.push(node);
    nodes.forEach(replaceNode);
  }
  hydrate(document.body);
  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'characterData') replaceNode(record.target);
      else record.addedNodes.forEach(hydrate);
    }
  });
  observer.observe(document.body, {subtree: true, childList: true, characterData: true});
  document.documentElement.dataset.uiPolish = 'vector-icons-v1';
})();
