(function () {
  'use strict';

  const container = document.getElementById('cardsContainer');
  const searchInput = document.getElementById('searchInput');

  /** @type {Array<{name:string, url:string, category:string, description:string, tags:string[], icon:string}>} */
  let allLinks = [];

  // ========== Data Loading ==========
  async function loadLinks() {
    try {
      const res = await fetch('data/links.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      allLinks = await res.json();
      render(allLinks);
    } catch (err) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="emoji">📁</span>
          加载数据失败，请确认 <code>data/links.json</code> 存在
        </div>`;
      console.error('加载 links.json 失败:', err);
    }
  }

  // ========== Rendering ==========
  function render(links) {
    if (links.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="emoji">🔍</span>
          没有匹配的结果，试试别的关键词
        </div>`;
      return;
    }

    // Group by category, preserving order of first appearance
    const groups = new Map();
    for (const link of links) {
      if (!groups.has(link.category)) {
        groups.set(link.category, []);
      }
      groups.get(link.category).push(link);
    }

    let html = '';
    for (const [category, groupLinks] of groups) {
      html += '<section class="category-section">';
      html += `<h2 class="category-title">${escapeHtml(category)}</h2>`;
      html += '<div class="card-grid">';

      for (const link of groupLinks) {
        const icon = link.icon
          ? `<img class="card-icon-img" src="${escapeHtml(link.icon)}" alt="" width="24" height="24">`
          : '<span class="card-icon">🔗</span>';

        const tagsHtml = link.tags && link.tags.length
          ? '<div class="card-tags">' +
            link.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('') +
            '</div>'
          : '';

        html += `
          <a href="${escapeHtml(link.url)}" class="card" target="_blank" rel="noopener noreferrer" title="${escapeHtml(link.name)}">
            <span class="card-name">${icon} ${escapeHtml(link.name)}</span>
            <span class="card-desc">${escapeHtml(link.description)}</span>
            ${tagsHtml}
          </a>`;
      }

      html += '</div></section>';
    }

    container.innerHTML = html;
  }

  // ========== Search ==========
  function filterLinks(query) {
    const q = query.trim().toLowerCase();
    if (!q) return allLinks;

    return allLinks.filter(link => {
      // Match name, description, and tags
      if (link.name.toLowerCase().includes(q)) return true;
      if (link.description.toLowerCase().includes(q)) return true;
      if (link.tags && link.tags.some(t => t.toLowerCase().includes(q))) return true;
      return false;
    });
  }

  function onSearchInput() {
    const query = searchInput.value;
    render(filterLinks(query));
  }

  // Debounce for smoother typing
  let debounceTimer;
  function debouncedSearch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(onSearchInput, 120);
  }

  // ========== Keyboard Shortcuts ==========
  function onKeyDown(e) {
    // ⌘K / Ctrl+K → focus search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
    // Escape → blur search and clear
    if (e.key === 'Escape' && document.activeElement === searchInput) {
      searchInput.blur();
      searchInput.value = '';
      render(allLinks);
    }
  }

  // ========== Helpers ==========
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ========== Init ==========
  searchInput.addEventListener('input', debouncedSearch);
  document.addEventListener('keydown', onKeyDown);
  loadLinks();
})();
