// ============================================
// NimbusIQ — Historical Data Explorer Component
// ============================================

import { getHistoricalWeather } from '../services/weatherService.js';
import { getDaysAgo, getMonthsAgo, formatDate, toISODate } from '../utils/dateUtils.js';
import { calculateStats, calculateTrend, calculateMovingAverage } from '../services/analyticsService.js';
import { $, render, showSkeleton } from '../utils/dom.js';
import { staggerCards } from '../utils/animations.js';

let chartInstance = null;

export async function renderHistorical(container, city) {
  const defaultEnd = getDaysAgo(1);
  const defaultStart = getMonthsAgo(1);

  const html = `
    <div class="page-view">
      <h2 class="page-title">Historical Weather Explorer</h2>
      <p class="page-subtitle">${city.name} — Access weather data from 1940 to present (ERA5 reanalysis)</p>

      <div class="controls-row">
        <div class="control-group">
          <label class="control-group__label">Start Date</label>
          <input type="date" class="input input--date" id="histStart" value="${defaultStart}" max="${defaultEnd}">
        </div>
        <div class="control-group">
          <label class="control-group__label">End Date</label>
          <input type="date" class="input input--date" id="histEnd" value="${defaultEnd}" max="${defaultEnd}">
        </div>
        <div class="control-group">
          <label class="control-group__label">Quick Range</label>
          <div class="select-wrap">
            <select class="select" id="histPreset">
              <option value="">Custom</option>
              <option value="7" selected>Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="180">Last 6 months</option>
              <option value="365">Last 1 year</option>
            </select>
          </div>
        </div>
        <button class="btn btn--primary" id="histFetch">
          📊 Load Data
        </button>
        <button class="btn btn--secondary" id="histExport">
          📥 Export CSV
        </button>
      </div>

      <div id="histResults"></div>
    </div>
  `;

  render(container, html);

  // Set initial range to 7 days
  const startInput = document.getElementById('histStart');
  const endInput = document.getElementById('histEnd');
  startInput.value = getDaysAgo(7);
  endInput.value = defaultEnd;

  // Preset selector
  document.getElementById('histPreset').addEventListener('change', (e) => {
    if (e.target.value) {
      startInput.value = getDaysAgo(parseInt(e.target.value));
      endInput.value = defaultEnd;
    }
  });

  // Fetch button
  document.getElementById('histFetch').addEventListener('click', () => fetchHistoricalData(city));

  // Export CSV
  document.getElementById('histExport').addEventListener('click', () => exportCSV());

  // Auto-load
  fetchHistoricalData(city);
}

let lastData = [];

async function fetchHistoricalData(city) {
  const results = document.getElementById('histResults');
  const start = document.getElementById('histStart').value;
  const end = document.getElementById('histEnd').value;

  if (!start || !end) return;
  if (new Date(start) > new Date(end)) {
    results.innerHTML = '<div class="empty-state"><div class="empty-state__icon">📅</div><div class="empty-state__title">Start date must be before end date</div></div>';
    return;
  }

  showSkeleton(results, 3);

  try {
    const data = await getHistoricalWeather(city.latitude, city.longitude, start, end);
    lastData = data;

    if (!data || data.length === 0) {
      results.innerHTML = '<div class="empty-state"><div class="empty-state__icon">📭</div><div class="empty-state__title">No data for this period</div></div>';
      return;
    }

    const temps = data.map((d) => d.tempMean).filter((v) => v != null);
    const stats = calculateStats(temps);
    const trend = calculateTrend(temps);
    const trendDir = trend.slope > 0.01 ? '📈 Warming' : trend.slope < -0.01 ? '📉 Cooling' : '➡️ Stable';

    results.innerHTML = `
      <div class="grid grid--4" style="margin-bottom:var(--space-lg)">
        <div class="card stat-card" data-stagger>
          <div class="stat-card__header">
            <span class="stat-card__label">Avg Temp</span>
            <span>🌡️</span>
          </div>
          <div class="stat-card__value stat-value">${stats.mean}°</div>
          <div class="stat-card__sub">Mean temperature</div>
        </div>
        <div class="card stat-card" data-stagger>
          <div class="stat-card__header">
            <span class="stat-card__label">Max Temp</span>
            <span>🔥</span>
          </div>
          <div class="stat-card__value stat-value">${stats.max}°</div>
          <div class="stat-card__sub">Highest recorded</div>
        </div>
        <div class="card stat-card" data-stagger>
          <div class="stat-card__header">
            <span class="stat-card__label">Min Temp</span>
            <span>❄️</span>
          </div>
          <div class="stat-card__value stat-value">${stats.min}°</div>
          <div class="stat-card__sub">Lowest recorded</div>
        </div>
        <div class="card stat-card" data-stagger>
          <div class="stat-card__header">
            <span class="stat-card__label">Trend</span>
            <span>${trendDir.split(' ')[0]}</span>
          </div>
          <div class="stat-card__value stat-value" style="font-size:var(--text-xl)">${trendDir.split(' ')[1]}</div>
          <div class="stat-card__sub">Slope: ${trend.slope.toFixed(3)}°/day</div>
        </div>
      </div>

      <div class="grid grid--2">
        <div class="card col-span-2 chart-card">
          <div class="chart-card__toolbar">
            <span class="chart-card__title">Temperature Over Time</span>
            <div class="chart-card__controls">
              <div class="toggle-group">
                <span class="toggle-label">Trend Line</span>
                <div class="toggle active" id="trendToggle"></div>
              </div>
            </div>
          </div>
          <div class="chart-container chart-container--lg">
            <canvas id="histChart"></canvas>
          </div>
        </div>

        <div class="card col-span-2">
          <div class="card__header">
            <span class="card__title">Data Table</span>
            <span class="badge badge--cyan">${data.length} days</span>
          </div>
          <div class="data-table-wrap" style="max-height:400px;overflow-y:auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Cond.</th>
                  <th>Max</th>
                  <th>Mean</th>
                  <th>Min</th>
                  <th>Precip</th>
                  <th>Wind</th>
                </tr>
              </thead>
              <tbody>
                ${data.map((d) => `
                  <tr>
                    <td>${formatDate(d.date)}</td>
                    <td>${d.icon || '—'} ${d.description || '—'}</td>
                    <td>${d.tempMax != null ? d.tempMax.toFixed(1) + '°' : '—'}</td>
                    <td>${d.tempMean != null ? d.tempMean.toFixed(1) + '°' : '—'}</td>
                    <td>${d.tempMin != null ? d.tempMin.toFixed(1) + '°' : '—'}</td>
                    <td>${d.precipSum != null ? d.precipSum.toFixed(1) + 'mm' : '—'}</td>
                    <td>${d.windMax != null ? d.windMax.toFixed(1) + ' km/h' : '—'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    staggerCards(results);
    renderHistChart(data, trend);

    // Trend toggle
    const toggle = document.getElementById('trendToggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        renderHistChart(data, trend);
      });
    }

  } catch (err) {
    results.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <div class="empty-state__title">Failed to fetch historical data</div>
        <div class="empty-state__text">${err.message}</div>
      </div>
    `;
  }
}

function renderHistChart(data, trend) {
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  const ctx = document.getElementById('histChart');
  if (!ctx || typeof Chart === 'undefined') return;

  const showTrend = document.getElementById('trendToggle')?.classList.contains('active') ?? true;

  const datasets = [
    {
      label: 'Max Temp',
      data: data.map((d) => d.tempMax),
      borderColor: '#fb7185',
      backgroundColor: 'rgba(251, 113, 133, 0.05)',
      fill: false,
      tension: 0.3,
      pointRadius: data.length > 60 ? 0 : 2,
      borderWidth: 1.5,
    },
    {
      label: 'Mean Temp',
      data: data.map((d) => d.tempMean),
      borderColor: '#00e5ff',
      backgroundColor: 'rgba(0, 229, 255, 0.08)',
      fill: true,
      tension: 0.3,
      pointRadius: data.length > 60 ? 0 : 2,
      borderWidth: 2,
    },
    {
      label: 'Min Temp',
      data: data.map((d) => d.tempMin),
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.05)',
      fill: false,
      tension: 0.3,
      pointRadius: data.length > 60 ? 0 : 2,
      borderWidth: 1.5,
    },
  ];

  if (showTrend && trend.trendLine) {
    datasets.push({
      label: 'Trend',
      data: trend.trendLine,
      borderColor: '#fbbf24',
      borderDash: [6, 4],
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
    });
  }

  // Reduce labels for large datasets
  const labels = data.map((d) => {
    const date = new Date(d.date);
    if (data.length > 180) return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`;
    if (data.length > 30) return `${date.getMonth() + 1}/${date.getDate()}`;
    return formatDate(d.date);
  });

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: true, position: 'top', labels: { color: 'rgba(240,244,255,0.65)', font: { size: 11 }, boxWidth: 12 } },
      },
      scales: {
        x: { ticks: { color: 'rgba(240,244,255,0.4)', font: { size: 10 }, maxTicksLimit: 15, maxRotation: 45 }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: 'rgba(240,244,255,0.4)', font: { size: 11 }, callback: (v) => v + '°' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      },
    },
  });
}

function exportCSV() {
  if (!lastData || lastData.length === 0) return;

  const headers = ['Date', 'Weather', 'Max°C', 'Mean°C', 'Min°C', 'Precip(mm)', 'Wind(km/h)'];
  const rows = lastData.map((d) => [
    d.date, d.description || '', d.tempMax, d.tempMean, d.tempMin, d.precipSum, d.windMax,
  ]);

  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `weather_historical_${lastData[0]?.date}_to_${lastData[lastData.length - 1]?.date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
