(function () {
  const INVITE = 'https://discord.gg/2xuchf2VnN';
  const UI_LANGS = ['en','de','fr','ru','es','uk','it','pl'];
  const RESOURCE_TYPES = ['pdf', 'website', 'youtube'];
  const flagByUi = { en:'🇬🇧', de:'🇩🇪', fr:'🇫🇷', ru:'🇷🇺', es:'🇪🇸', uk:'🇺🇦', it:'🇮🇹', pl:'🇵🇱' };
  const pageBase = document.body.dataset.resourceLanguage ? '../' : '';
  let currentLang = localStorage.getItem('ll-ui-lang') || 'en';
  if (!UI_LANGS.includes(currentLang)) currentLang = 'en';
  const root = document.documentElement;
  const storedTheme = localStorage.getItem('ll-theme');
  const initialTheme = storedTheme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  root.setAttribute('data-theme', initialTheme);

  const t = (key, vars = {}) => {
    const pack = (window.LL_I18N && window.LL_I18N[currentLang]) || window.LL_I18N.en;
    let value = pack[key] ?? window.LL_I18N.en[key] ?? key;
    if (typeof value === 'string') {
      Object.keys(vars).forEach(k => value = value.replaceAll(`{${k}}`, vars[k]));
    }
    return value;
  };
  window.LL_t = t;
  window.LL_getLang = () => currentLang;

  function getResourceLanguageName(slug) {
    const meta = window.LL_RESOURCE_DATA?.languages?.[slug];
    return meta?.[currentLang] || meta?.en || slug;
  }
  window.LL_getResourceLanguageName = getResourceLanguageName;

  function getTypeLabel(type) {
    if (type === 'pdf') return t('common.pdf');
    if (type === 'website') return t('common.websites');
    if (type === 'youtube') return t('common.youtube');
    return t('common.all');
  }

  function getTypeIcon(type) {
    return type === 'pdf' ? '📄' : type === 'website' ? '🔗' : type === 'youtube' ? '▶️' : '✨';
  }

  function getLanguageCounts(slug) {
    const data = window.LL_RESOURCE_DATA?.resources?.[slug] || {};
    const counts = {
      pdf: Array.isArray(data.pdf) ? data.pdf.length : 0,
      website: Array.isArray(data.website) ? data.website.length : 0,
      youtube: Array.isArray(data.youtube) ? data.youtube.length : 0
    };
    counts.all = counts.pdf + counts.website + counts.youtube;
    return counts;
  }

  function getTotalCounts() {
    const totals = { pdf: 0, website: 0, youtube: 0, all: 0 };
    Object.keys(window.LL_RESOURCE_DATA?.languages || {}).forEach(slug => {
      const counts = getLanguageCounts(slug);
      RESOURCE_TYPES.forEach(type => { totals[type] += counts[type]; });
      totals.all += counts.all;
    });
    return totals;
  }

  function localizedField(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return value[currentLang] || value.en || Object.values(value)[0] || '';
    return String(value);
  }

  function normalizeExternalItem(item, type, langSlug) {
    const normalized = { ...item };
    if (type === 'pdf' && item.file && !item.url) normalized.url = `${pageBase}pdfs/${langSlug}/${item.file}`;
    if (type === 'website' && !normalized.tagKey) normalized.tagKey = 'res.tag.website';
    if (type === 'youtube' && !normalized.tagKey) normalized.tagKey = 'res.tag.youtube';
    if (type === 'pdf' && !normalized.tagKey) normalized.tagKey = 'res.tag.reference';
    return normalized;
  }

  async function loadJson(path) {
    try {
      const response = await fetch(path, { cache: 'no-store' });
      if (!response.ok) return null;
      const json = await response.json();
      return Array.isArray(json) ? json : null;
    } catch (_) {
      return null;
    }
  }

  async function loadExternalResources() {
    if (!window.LL_RESOURCE_DATA?.resources || !window.fetch) return;
    const languages = Object.keys(window.LL_RESOURCE_DATA.languages || {});
    await Promise.all(languages.map(async (slug) => {
      const [pdfs, websites, youtube] = await Promise.all([
        loadJson(`${pageBase}pdfs/${slug}/files.json`),
        loadJson(`${pageBase}website-links/${slug}/links.json`),
        loadJson(`${pageBase}youtube-links/${slug}/links.json`)
      ]);
      const target = window.LL_RESOURCE_DATA.resources[slug] || (window.LL_RESOURCE_DATA.resources[slug] = {});
      if (pdfs) target.pdf = pdfs.map(item => normalizeExternalItem(item, 'pdf', slug));
      if (websites) target.website = websites.map(item => normalizeExternalItem(item, 'website', slug));
      if (youtube) target.youtube = youtube.map(item => normalizeExternalItem(item, 'youtube', slug));
    }));
  }

  function applyTranslations() {
    document.documentElement.lang = currentLang;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    document.querySelectorAll('[data-language-name]').forEach(el => { el.textContent = getResourceLanguageName(el.dataset.languageName); });
    document.querySelectorAll('[data-resource-title]').forEach(el => {
      const langName = getResourceLanguageName(el.dataset.resourceTitle);
      el.textContent = t('resourcePage.title', { language: langName });
    });
    document.querySelectorAll('[data-resource-lead]').forEach(el => {
      const langName = getResourceLanguageName(el.dataset.resourceLead);
      el.textContent = t('resourcePage.lead', { language: langName });
    });
    const languageSwitcher = document.getElementById('languageSwitcher');
    if (languageSwitcher) languageSwitcher.value = currentLang;
    const themeButton = document.getElementById('themeToggle');
    if (themeButton) {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      themeButton.setAttribute('aria-label', t(next === 'light' ? 'theme.light' : 'theme.dark'));
      themeButton.title = themeButton.getAttribute('aria-label');
    }
    renderRules();
    renderHomeLanguages();
    renderResourceHub();
    renderResourceTypeTotals();
    renderLanguageResources();
    window.dispatchEvent(new CustomEvent('ll-language-applied', { detail: { lang: currentLang }}));
  }
  window.LL_applyTranslations = applyTranslations;

  function initLanguageSwitcher() {
    const select = document.getElementById('languageSwitcher');
    if (!select) return;
    select.innerHTML = UI_LANGS.map(code => `<option value="${code}">${flagByUi[code]} ${window.LL_I18N[code].langName}</option>`).join('');
    select.value = currentLang;
    select.addEventListener('change', () => {
      currentLang = select.value;
      localStorage.setItem('ll-ui-lang', currentLang);
      applyTranslations();
    });
  }

  function initTheme() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('ll-theme', next);
      applyTranslations();
    });
  }

  function initMenu() {
    const btn = document.getElementById('menuButton');
    const header = document.querySelector('.site-header');
    if (!btn || !header) return;
    btn.addEventListener('click', () => header.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!header.contains(e.target)) header.classList.remove('open');
    });
  }

  function renderRules() {
    const target = document.getElementById('rulesList');
    if (!target) return;
    const items = t('rules.items');
    target.innerHTML = (Array.isArray(items) ? items : []).map(item => `<div class="rule-card reveal"><p>${escapeHtml(item)}</p></div>`).join('');
  }

  function renderHomeLanguages() {
    const target = document.getElementById('homeLanguageGrid');
    if (!target || !window.LL_RESOURCE_DATA) return;
    target.innerHTML = Object.entries(window.LL_RESOURCE_DATA.languages).map(([slug, meta]) => `
      <a class="lang-card reveal" href="resources/${slug}.html">
        <span class="flag">${meta.flag}</span>
        <span class="name">${escapeHtml(getResourceLanguageName(slug))}</span>
        <span class="pills">
          <span class="pill">${t('common.pdf')}</span>
          <span class="pill">${t('common.websites')}</span>
          <span class="pill">${t('common.youtube')}</span>
        </span>
      </a>
    `).join('');
  }

  function renderResourceHub() {
    const target = document.getElementById('resourceLanguageGrid');
    if (!target || !window.LL_RESOURCE_DATA) return;
    target.innerHTML = Object.entries(window.LL_RESOURCE_DATA.languages).map(([slug, meta]) => {
      const counts = getLanguageCounts(slug);
      return `
        <a class="lang-card resource-lang-card reveal" href="resources/${slug}.html">
          <span class="flag">${meta.flag}</span>
          <span class="name">${escapeHtml(getResourceLanguageName(slug))}</span>
          <span class="resource-count-list" aria-label="${escapeAttr(t('resources.countsLabel'))}">
            ${RESOURCE_TYPES.map(type => `
              <span class="resource-count-row">
                <span>${getTypeIcon(type)} ${escapeHtml(getTypeLabel(type))}</span>
                <strong>${counts[type]}</strong>
              </span>
            `).join('')}
          </span>
          <span class="btn secondary">${t('common.viewResources')}</span>
        </a>
      `;
    }).join('');
  }

  function renderResourceTypeTotals() {
    const totals = getTotalCounts();
    document.querySelectorAll('[data-resource-type-count]').forEach(el => {
      const type = el.dataset.resourceTypeCount;
      el.textContent = Number.isFinite(totals[type]) ? totals[type] : 0;
    });
  }

  function resourceText(entry, key, langSlug) {
    if (entry[key]) return localizedField(entry[key]);
    const langName = getResourceLanguageName(langSlug);
    if (entry[`${key}Key`]) return t(entry[`${key}Key`], { language: langName, slug: langSlug });
    return '';
  }

  let activeType = 'all';

  function updateResourceFilterTabs(langSlug) {
    const counts = getLanguageCounts(langSlug);
    document.querySelectorAll('[data-resource-filter]').forEach(btn => {
      const type = btn.dataset.resourceFilter;
      const label = type === 'all' ? t('common.all') : getTypeLabel(type);
      const count = counts[type] ?? 0;
      btn.innerHTML = `<span>${escapeHtml(label)}</span><strong class="tab-count">${count}</strong>`;
      btn.setAttribute('aria-label', `${label}: ${count}`);
    });
  }

  function renderLanguageResources() {
    const target = document.getElementById('resourceList');
    if (!target || !window.LL_RESOURCE_DATA) return;
    const langSlug = document.body.dataset.resourceLanguage;
    const data = window.LL_RESOURCE_DATA.resources[langSlug];
    if (!data) return;
    updateResourceFilterTabs(langSlug);
    const search = (document.getElementById('resourceSearch')?.value || '').trim().toLowerCase();
    const entries = [];
    RESOURCE_TYPES.forEach(type => {
      if (activeType !== 'all' && activeType !== type) return;
      (data[type] || []).forEach(item => entries.push({ type, item }));
    });
    const filtered = entries.filter(({ type, item }) => {
      const title = resourceText(item, 'title', langSlug).toLowerCase();
      const desc = resourceText(item, 'description', langSlug).toLowerCase();
      const typeText = getTypeLabel(type).toLowerCase();
      return !search || title.includes(search) || desc.includes(search) || typeText.includes(search);
    });
    target.innerHTML = filtered.length ? filtered.map(({ type, item }) => {
      const title = resourceText(item, 'title', langSlug);
      const desc = resourceText(item, 'description', langSlug);
      const tag = item.tagKey ? t(item.tagKey, { language: getResourceLanguageName(langSlug), slug: langSlug }) : getTypeLabel(type);
      const typeLabel = getTypeLabel(type);
      const icon = getTypeIcon(type);
      return `
        <article class="resource-card reveal">
          <div class="top"><span class="type">${icon} ${escapeHtml(typeLabel)}</span><span class="pill">${escapeHtml(tag)}</span></div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(desc)}</p>
          <a class="btn secondary open" href="${escapeAttr(item.url)}" target="_blank" rel="noopener">${t('common.open')}</a>
        </article>
      `;
    }).join('') : `<div class="notice">${t('resourcePage.empty')}</div>`;
  }

  function initResourceFilters() {
    document.querySelectorAll('[data-resource-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeType = btn.dataset.resourceFilter;
        document.querySelectorAll('[data-resource-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderLanguageResources();
      });
    });
    const search = document.getElementById('resourceSearch');
    if (search) search.addEventListener('input', renderLanguageResources);
  }

  function initCopyInvite() {
    document.querySelectorAll('[data-copy-invite]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(INVITE); } catch (_) {}
        const old = btn.textContent;
        btn.textContent = t('common.copied');
        setTimeout(() => { btn.textContent = old || t('common.copy'); }, 1200);
      });
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function escapeAttr(str) { return escapeHtml(str); }

  document.addEventListener('DOMContentLoaded', async () => {
    initLanguageSwitcher();
    initTheme();
    initMenu();
    initResourceFilters();
    initCopyInvite();
    await loadExternalResources();
    applyTranslations();
  });
})();
