// ============================================
// NimbusIQ — App Router & Initialization
// ============================================

import { getDefaultCity, saveDefaultCity, searchCity, formatCityName } from './services/geocodingService.js';
import { renderDashboard } from './components/dashboard.js';
import { renderForecast } from './components/forecast.js';
import { renderHistorical } from './components/historical.js';
import { renderCharts } from './components/charts.js';
import { renderAirQuality } from './components/airQuality.js';
import { renderApiDocs } from './components/apiDocs.js';
import { $, $$, on, debounce } from './utils/dom.js';
import { pageTransition } from './utils/animations.js';

// ── State ──
let currentCity = getDefaultCity();
let currentView = 'dashboard';

// ── Routes ──
const routes = {
  dashboard: { render: renderDashboard, needsCity: true },
  forecast: { render: renderForecast, needsCity: true },
  historical: { render: renderHistorical, needsCity: true },
  charts: { render: renderCharts, needsCity: true },
  airquality: { render: renderAirQuality, needsCity: true },
  apidocs: { render: renderApiDocs, needsCity: false },
};

// ── Initialize App ──
document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  initSearch();
  initSidebar();
  updateCityDisplay();

  // Read hash or default to dashboard
  const hash = window.location.hash.slice(1) || 'dashboard';
  navigateTo(hash);
});

// ── Router ──
function initRouter() {
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1) || 'dashboard';
    navigateTo(hash);
  });
}

function navigateTo(view) {
  const route = routes[view];
  if (!route) {
    navigateTo('dashboard');
    return;
  }

  currentView = view;
  window.location.hash = view;

  // Update active nav
  $$('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.view === view);
  });

  // Render view
  const content = $('#pageContent');
  if (!content) return;

  pageTransition(content, () => {
    if (route.needsCity) {
      route.render(content, currentCity);
    } else {
      route.render(content);
    }
  });
}

// ── Search ──
function initSearch() {
  const input = $('#searchInput');
  const results = $('#searchResults');
  if (!input || !results) return;

  const doSearch = debounce(async (query) => {
    if (query.length < 2) {
      results.classList.remove('visible');
      return;
    }

    const cities = await searchCity(query);
    if (cities.length === 0) {
      results.innerHTML = '<div class="search-result-item" style="color:var(--text-tertiary)">No cities found</div>';
      results.classList.add('visible');
      return;
    }

    results.innerHTML = cities.map((city) => `
      <div class="search-result-item" data-lat="${city.latitude}" data-lon="${city.longitude}"
           data-name="${city.name}" data-country="${city.country}" data-admin="${city.admin1}">
        <span>📍</span>
        <span>${city.name}${city.admin1 ? ', ' + city.admin1 : ''}</span>
        <span class="search-result-item__country">${city.country}</span>
      </div>
    `).join('');
    results.classList.add('visible');
  }, 300);

  on(input, 'input', (e) => doSearch(e.target.value.trim()));

  on(input, 'focus', () => {
    if (input.value.trim().length >= 2) {
      doSearch(input.value.trim());
    }
  });

  // Click on result
  on(results, 'click', (e) => {
    const item = e.target.closest('.search-result-item');
    if (!item || !item.dataset.lat) return;

    currentCity = {
      name: item.dataset.name,
      latitude: parseFloat(item.dataset.lat),
      longitude: parseFloat(item.dataset.lon),
      country: item.dataset.country,
      admin1: item.dataset.admin,
    };

    saveDefaultCity(currentCity);
    updateCityDisplay();
    input.value = '';
    results.classList.remove('visible');

    // Re-render current view
    navigateTo(currentView);
  });

  // Close results when clicking outside
  on(document, 'click', (e) => {
    if (!e.target.closest('.header__search')) {
      results.classList.remove('visible');
    }
  });

  // Keyboard support
  on(input, 'keydown', (e) => {
    if (e.key === 'Escape') {
      results.classList.remove('visible');
      input.blur();
    }
  });
}

// ── Sidebar ──
function initSidebar() {
  // Restore collapsed state
  const isCollapsed = localStorage.getItem('nimbus_sidebar_collapsed') === 'true';
  if (isCollapsed) {
    $('.sidebar')?.classList.add('collapsed');
  }

  // Collapse toggle
  on('#sidebarCollapseBtn', 'click', () => {
    const sidebar = $('.sidebar');
    if (!sidebar) return;

    sidebar.classList.toggle('collapsed');
    localStorage.setItem('nimbus_sidebar_collapsed', sidebar.classList.contains('collapsed'));
  });

  // Nav item clicks
  $$('.nav-item').forEach((item) => {
    on(item, 'click', () => {
      const view = item.dataset.view;
      if (view) navigateTo(view);
      // Close mobile sidebar
      $('.sidebar')?.classList.remove('open');
      $('.sidebar-overlay')?.classList.remove('visible');
    });
  });

  // Mobile menu toggle
  on('#menuToggle', 'click', () => {
    $('.sidebar')?.classList.toggle('open');
    $('.sidebar-overlay')?.classList.toggle('visible');
  });

  on('.sidebar-overlay', 'click', () => {
    $('.sidebar')?.classList.remove('open');
    $('.sidebar-overlay')?.classList.remove('visible');
  });

  // Unit toggle
  on('#unitToggle', 'click', () => {
    const toggle = $('#unitToggle');
    if (toggle) {
      toggle.classList.toggle('active');
    }
  });
}

// ── Helper ──
function updateCityDisplay() {
  const el = $('#currentCityName');
  if (el) el.textContent = `${currentCity.name}, ${currentCity.country || ''}`;
}
