// ============================================
// NimbusIQ — API Documentation Component
// ============================================

import { getCacheStats, clearCache } from '../services/cacheService.js';
import { $, render } from '../utils/dom.js';
import { staggerCards } from '../utils/animations.js';

export async function renderApiDocs(container) {
  const cacheStats = getCacheStats();

  const html = `
    <div class="page-view">
      <h2 class="page-title">API Documentation & System Info</h2>
      <p class="page-subtitle">Data sources, API endpoints, and system performance metrics</p>

      <div class="grid grid--2">
        <!-- Data Sources -->
        <div class="card col-span-2" data-stagger>
          <div class="card__header">
            <span class="card__title">Data Sources & Attribution</span>
            <span style="font-size:1.2rem">📚</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-md)">
            <div style="padding:var(--space-md);background:var(--bg-card);border-radius:var(--radius-md);border:1px solid var(--border-subtle)">
              <div style="font-size:var(--text-sm);font-weight:600;margin-bottom:var(--space-xs)">🌍 Open-Meteo</div>
              <p style="font-size:var(--text-xs);color:var(--text-tertiary);margin-bottom:var(--space-xs)">
                Free, open-source weather API providing high-resolution forecasts and 80+ years of historical data.
                No API key required for non-commercial use.
              </p>
              <a href="https://open-meteo.com" target="_blank" style="font-size:var(--text-xs)">open-meteo.com ↗</a>
            </div>
            <div style="padding:var(--space-md);background:var(--bg-card);border-radius:var(--radius-md);border:1px solid var(--border-subtle)">
              <div style="font-size:var(--text-sm);font-weight:600;margin-bottom:var(--space-xs)">🛰️ ERA5 Reanalysis</div>
              <p style="font-size:var(--text-xs);color:var(--text-tertiary);margin-bottom:var(--space-xs)">
                ECMWF's fifth-generation atmospheric reanalysis, providing hourly data from 1940 to present at 0.25° resolution.
              </p>
              <a href="https://cds.climate.copernicus.eu" target="_blank" style="font-size:var(--text-xs)">Copernicus CDS ↗</a>
            </div>
            <div style="padding:var(--space-md);background:var(--bg-card);border-radius:var(--radius-md);border:1px solid var(--border-subtle)">
              <div style="font-size:var(--text-sm);font-weight:600;margin-bottom:var(--space-xs)">🌫️ ECMWF IFS</div>
              <p style="font-size:var(--text-xs);color:var(--text-tertiary);margin-bottom:var(--space-xs)">
                Integrated Forecasting System — the world's leading global NWP model. Provides 9km resolution data.
              </p>
              <a href="https://www.ecmwf.int" target="_blank" style="font-size:var(--text-xs)">ecmwf.int ↗</a>
            </div>
            <div style="padding:var(--space-md);background:var(--bg-card);border-radius:var(--radius-md);border:1px solid var(--border-subtle)">
              <div style="font-size:var(--text-sm);font-weight:600;margin-bottom:var(--space-xs)">📊 Chart.js</div>
              <p style="font-size:var(--text-xs);color:var(--text-tertiary);margin-bottom:var(--space-xs)">
                Open-source JavaScript charting library for canvas-based visualizations. Used for all interactive charts.
              </p>
              <a href="https://www.chartjs.org" target="_blank" style="font-size:var(--text-xs)">chartjs.org ↗</a>
            </div>
          </div>
        </div>

        <!-- API Endpoints -->
        <div class="card col-span-2" data-stagger>
          <div class="card__header">
            <span class="card__title">API Endpoints Used</span>
            <span class="badge badge--cyan">REST</span>
          </div>
          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Purpose</th>
                  <th>Cache TTL</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="color:var(--accent-cyan)">api.open-meteo.com/v1/forecast</td>
                  <td>Current weather & forecasts (up to 16 days)</td>
                  <td>15–60 min</td>
                  <td><span class="badge badge--emerald">GET</span></td>
                </tr>
                <tr>
                  <td style="color:var(--accent-cyan)">archive-api.open-meteo.com/v1/archive</td>
                  <td>Historical weather data (1940–present)</td>
                  <td>24 hours</td>
                  <td><span class="badge badge--emerald">GET</span></td>
                </tr>
                <tr>
                  <td style="color:var(--accent-cyan)">air-quality-api.open-meteo.com/v1/air-quality</td>
                  <td>Air quality index & pollutant levels</td>
                  <td>30 min</td>
                  <td><span class="badge badge--emerald">GET</span></td>
                </tr>
                <tr>
                  <td style="color:var(--accent-cyan)">geocoding-api.open-meteo.com/v1/search</td>
                  <td>City name → geographic coordinates</td>
                  <td>—</td>
                  <td><span class="badge badge--emerald">GET</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Example Request/Response -->
        <div class="card" data-stagger>
          <div class="card__header">
            <span class="card__title">Example Request</span>
          </div>
          <pre><code>GET /v1/forecast
  ?latitude=28.6139
  &longitude=77.209
  &current=temperature_2m,
    relative_humidity_2m,
    weather_code,
    wind_speed_10m
  &daily=temperature_2m_max,
    temperature_2m_min,
    sunrise,sunset
  &timezone=auto
  &forecast_days=7</code></pre>
        </div>

        <div class="card" data-stagger>
          <div class="card__header">
            <span class="card__title">Example Response</span>
          </div>
          <pre><code>{
  "latitude": 28.6,
  "longitude": 77.2,
  "timezone": "Asia/Kolkata",
  "current": {
    "temperature_2m": 35.2,
    "weather_code": 1,
    "wind_speed_10m": 12.5
  },
  "daily": {
    "time": ["2026-04-02", ...],
    "temperature_2m_max": [38.1, ...],
    "temperature_2m_min": [24.3, ...]
  }
}</code></pre>
        </div>

        <!-- Cache Stats -->
        <div class="card" data-stagger>
          <div class="card__header">
            <span class="card__title">Cache Statistics</span>
            <button class="btn btn--ghost btn--sm" id="clearCacheBtn">🗑️ Clear</button>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md)">
            <div>
              <div class="stat-label">Cached Entries</div>
              <div class="stat-value" style="font-size:var(--text-2xl)" id="cacheEntries">${cacheStats.entries}</div>
            </div>
            <div>
              <div class="stat-label">Cache Size</div>
              <div class="stat-value" style="font-size:var(--text-2xl)" id="cacheSize">${cacheStats.sizeFormatted}</div>
            </div>
            <div>
              <div class="stat-label">Expired</div>
              <div class="stat-value" style="font-size:var(--text-2xl)" id="cacheExpired">${cacheStats.expired}</div>
            </div>
            <div>
              <div class="stat-label">Storage</div>
              <div class="stat-value" style="font-size:var(--text-2xl)">LocalStorage</div>
            </div>
          </div>
        </div>

        <!-- System Architecture -->
        <div class="card" data-stagger>
          <div class="card__header">
            <span class="card__title">System Architecture</span>
          </div>
          <div style="font-size:var(--text-xs);color:var(--text-secondary);line-height:1.8">
            <div style="margin-bottom:var(--space-sm)">
              <strong style="color:var(--text-primary)">Frontend:</strong> Vanilla JS (ES Modules), CSS3<br>
              <strong style="color:var(--text-primary)">Charts:</strong> Chart.js 4.x (CDN)<br>
              <strong style="color:var(--text-primary)">APIs:</strong> Open-Meteo (REST, JSON)<br>
              <strong style="color:var(--text-primary)">Cache:</strong> LocalStorage with TTL<br>
              <strong style="color:var(--text-primary)">Routing:</strong> Hash-based SPA router<br>
            </div>
            <div style="padding:var(--space-sm);background:var(--bg-card);border-radius:var(--radius-sm);border:1px solid var(--border-subtle)">
              <div style="color:var(--text-tertiary);margin-bottom:4px">Data Flow:</div>
              <span class="badge badge--cyan">User Input</span>
              → <span class="badge badge--violet">Geocoding API</span>
              → <span class="badge badge--emerald">Weather API</span>
              → <span class="badge badge--amber">Cache Layer</span>
              → <span class="badge badge--rose">Analytics Engine</span>
              → <span class="badge badge--cyan">Chart.js Render</span>
            </div>
          </div>
        </div>

        <!-- Citation -->
        <div class="card col-span-2" data-stagger>
          <div class="card__header">
            <span class="card__title">Citation & Acknowledgement</span>
          </div>
          <div style="font-size:var(--text-xs);color:var(--text-secondary);line-height:1.8">
            <p>Zippenfenig, P. (2023). Open-Meteo.com Weather API [Computer software]. Zenodo.
            <a href="https://doi.org/10.5281/ZENODO.7970649" target="_blank">https://doi.org/10.5281/ZENODO.7970649</a></p>
            <p style="margin-top:var(--space-xs)">Hersbach, H., et al. (2023). ERA5 hourly data on single levels from 1940 to present [Data set]. ECMWF.
            <a href="https://doi.org/10.24381/cds.adbb2d47" target="_blank">https://doi.org/10.24381/cds.adbb2d47</a></p>
            <p style="margin-top:var(--space-xs);color:var(--text-tertiary)">Generated using Copernicus Climate Change Service information 2022.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  render(container, html);
  staggerCards($(container));

  // Clear cache button
  const clearBtn = document.getElementById('clearCacheBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearCache();
      const stats = getCacheStats();
      document.getElementById('cacheEntries').textContent = stats.entries;
      document.getElementById('cacheSize').textContent = stats.sizeFormatted;
      document.getElementById('cacheExpired').textContent = stats.expired;
    });
  }
}
