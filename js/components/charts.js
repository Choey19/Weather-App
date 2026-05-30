// ============================================
// NimbusIQ — Analytics Charts Component
// ============================================

import { getHistoricalWeather, getDailyForecast } from '../services/weatherService.js';
import { getDaysAgo, getMonthsAgo, getShortDayName } from '../utils/dateUtils.js';
import {
  calculateTrend, calculateMovingAverage, detectAnomalies,
  calculateStats, generateForecastSummary, compareHistoricalToForecast
} from '../services/analyticsService.js';
import { $, render, showSkeleton } from '../utils/dom.js';
import { staggerCards } from '../utils/animations.js';

let charts = [];

export async function renderCharts(container, city) {
  showSkeleton(container, 4);

  try {
    const [historical, forecast] = await Promise.all([
      getHistoricalWeather(city.latitude, city.longitude, getMonthsAgo(3), getDaysAgo(1)),
      getDailyForecast(city.latitude, city.longitude, 7),
    ]);

    const tempMeans = historical.map((d) => d.tempMean).filter((v) => v != null);
    const precips = historical.map((d) => d.precipSum || 0);
    const windMaxes = historical.map((d) => d.windMax || 0);
    const stats = calculateStats(tempMeans);
    const trend = calculateTrend(tempMeans);
    const movingAvg = calculateMovingAverage(tempMeans, 7);
    const anomalies = detectAnomalies(tempMeans);
    const comparison = compareHistoricalToForecast(historical, forecast);
    const summary = generateForecastSummary(forecast);

    const html = `
      <div class="page-view">
        <h2 class="page-title">Weather Analytics</h2>
        <p class="page-subtitle">${city.name} — Data-driven insights from the last 3 months</p>

        <!-- Summary Cards -->
        <div class="grid grid--4" style="margin-bottom:var(--space-lg)">
          <div class="card stat-card card--accent-cyan" data-stagger>
            <div class="stat-card__header">
              <span class="stat-card__label">Avg Temperature</span>
              <span>🌡️</span>
            </div>
            <div class="stat-card__value stat-value stat-value--gradient">${stats.mean}°</div>
            <div class="stat-card__sub">σ = ${stats.stdDev}°C</div>
          </div>
          <div class="card stat-card" data-stagger>
            <div class="stat-card__header">
              <span class="stat-card__label">Trend</span>
              <span>${trend.slope > 0 ? '📈' : '📉'}</span>
            </div>
            <div class="stat-card__value stat-value">${(trend.slope * 30).toFixed(1)}°</div>
            <div class="stat-card__sub">per month</div>
          </div>
          <div class="card stat-card" data-stagger>
            <div class="stat-card__header">
              <span class="stat-card__label">Anomalies</span>
              <span>⚡</span>
            </div>
            <div class="stat-card__value stat-value">${anomalies.length}</div>
            <div class="stat-card__sub">unusual days detected</div>
          </div>
          <div class="card stat-card" data-stagger>
            <div class="stat-card__header">
              <span class="stat-card__label">vs Forecast</span>
              <span>${comparison.isWarmer ? '🔥' : '❄️'}</span>
            </div>
            <div class="stat-card__value stat-value">${comparison.tempDifference > 0 ? '+' : ''}${comparison.tempDifference}°</div>
            <div class="stat-card__sub">${comparison.isWarmer ? 'warmer' : 'cooler'} than avg</div>
          </div>
        </div>

        <div class="card" style="margin-bottom:var(--space-lg);padding:var(--space-md) var(--space-lg)">
          <p style="font-size:var(--text-sm);color:var(--text-secondary)">
            📊 <strong>Summary:</strong> ${summary}
            ${comparison.summary}
          </p>
        </div>

        <!-- Charts Grid -->
        <div class="grid grid--2">
          <!-- Temperature + Moving Average -->
          <div class="card col-span-2 chart-card" data-stagger>
            <div class="chart-card__toolbar">
              <span class="chart-card__title">Temperature Trend with Moving Average</span>
              <div class="chart-card__controls">
                <label class="control-group__label" style="margin-right:8px">Window:</label>
                <input type="range" class="range-slider" id="maWindow" min="3" max="30" value="7" style="width:120px">
                <span id="maWindowLabel" style="font-size:var(--text-xs);color:var(--text-tertiary);min-width:30px">7d</span>
              </div>
            </div>
            <div class="chart-container chart-container--lg">
              <canvas id="trendChart"></canvas>
            </div>
          </div>

          <!-- Precipitation -->
          <div class="card chart-card" data-stagger>
            <div class="chart-card__toolbar">
              <span class="chart-card__title">Precipitation</span>
            </div>
            <div class="chart-container chart-container--md">
              <canvas id="precipChart"></canvas>
            </div>
          </div>

          <!-- Wind Distribution -->
          <div class="card chart-card" data-stagger>
            <div class="chart-card__toolbar">
              <span class="chart-card__title">Wind Speed Distribution</span>
            </div>
            <div class="chart-container chart-container--md">
              <canvas id="windChart"></canvas>
            </div>
          </div>

          <!-- Anomaly Scatter -->
          <div class="card col-span-2 chart-card" data-stagger>
            <div class="chart-card__toolbar">
              <span class="chart-card__title">Temperature Anomaly Detection</span>
              <span class="badge badge--rose">${anomalies.length} anomalies</span>
            </div>
            <div class="chart-container chart-container--md">
              <canvas id="anomalyChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;

    render(container, html);
    staggerCards($(container));

    // Render all charts
    renderTrendChart(historical, tempMeans, movingAvg, trend);
    renderPrecipChart(historical, precips);
    renderWindChart(windMaxes);
    renderAnomalyChart(historical, tempMeans, anomalies, stats);

    // Moving average slider
    const slider = document.getElementById('maWindow');
    const label = document.getElementById('maWindowLabel');
    if (slider) {
      slider.addEventListener('input', () => {
        const w = parseInt(slider.value);
        label.textContent = w + 'd';
        const newMA = calculateMovingAverage(tempMeans, w);
        updateTrendChart(historical, tempMeans, newMA, trend);
      });
    }

  } catch (err) {
    render(container, `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <div class="empty-state__title">Failed to load analytics</div>
        <div class="empty-state__text">${err.message}</div>
      </div>
    `);
  }
}

function destroyCharts() {
  charts.forEach((c) => c.destroy());
  charts = [];
}

function renderTrendChart(data, temps, ma, trend) {
  const ctx = document.getElementById('trendChart');
  if (!ctx) return;

  const labels = data.map((d, i) => {
    if (data.length > 60 && i % Math.ceil(data.length / 30) !== 0) return '';
    const date = new Date(d.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Daily Mean',
          data: temps,
          borderColor: 'rgba(0, 229, 255, 0.5)',
          backgroundColor: 'rgba(0, 229, 255, 0.05)',
          fill: true,
          tension: 0.2,
          pointRadius: 0,
          borderWidth: 1,
        },
        {
          label: 'Moving Avg (7d)',
          data: ma,
          borderColor: '#fbbf24',
          borderWidth: 2.5,
          pointRadius: 0,
          fill: false,
          tension: 0.3,
        },
        {
          label: 'Trend Line',
          data: trend.trendLine,
          borderColor: '#fb7185',
          borderDash: [8, 4],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        },
      ],
    },
    options: chartOptions(),
  });
  charts.push(chart);
}

function updateTrendChart(data, temps, ma, trend) {
  const chart = charts[0];
  if (!chart) return;
  chart.data.datasets[1].data = ma;
  chart.update('none');
}

function renderPrecipChart(data, precips) {
  const ctx = document.getElementById('precipChart');
  if (!ctx) return;

  const labels = data.map((d) => {
    const date = new Date(d.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Precipitation (mm)',
        data: precips,
        backgroundColor: precips.map((p) =>
          p > 20 ? 'rgba(139, 92, 246, 0.7)' :
          p > 5 ? 'rgba(0, 229, 255, 0.5)' :
          'rgba(0, 229, 255, 0.2)'
        ),
        borderRadius: 2,
      }],
    },
    options: {
      ...chartOptions(),
      scales: {
        ...chartOptions().scales,
        y: {
          ...chartOptions().scales.y,
          ticks: { ...chartOptions().scales.y.ticks, callback: (v) => v + 'mm' },
        },
      },
    },
  });
  charts.push(chart);
}

function renderWindChart(windMaxes) {
  const ctx = document.getElementById('windChart');
  if (!ctx) return;

  // Create histogram bins
  const binSize = 5;
  const maxWind = Math.ceil(Math.max(...windMaxes) / binSize) * binSize;
  const bins = [];
  const binLabels = [];
  for (let i = 0; i <= maxWind; i += binSize) {
    binLabels.push(`${i}-${i + binSize}`);
    bins.push(windMaxes.filter((w) => w >= i && w < i + binSize).length);
  }

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: binLabels,
      datasets: [{
        label: 'Days',
        data: bins,
        backgroundColor: bins.map((_, i) =>
          `rgba(0, 229, 255, ${0.2 + (i / bins.length) * 0.6})`
        ),
        borderRadius: 4,
      }],
    },
    options: {
      ...chartOptions(),
      scales: {
        x: { ...chartOptions().scales.x, title: { display: true, text: 'Wind Speed (km/h)', color: 'rgba(240,244,255,0.4)', font: { size: 11 } } },
        y: { ...chartOptions().scales.y, title: { display: true, text: 'Frequency (days)', color: 'rgba(240,244,255,0.4)', font: { size: 11 } } },
      },
    },
  });
  charts.push(chart);
}

function renderAnomalyChart(data, temps, anomalies, stats) {
  const ctx = document.getElementById('anomalyChart');
  if (!ctx) return;

  const labels = data.map((d) => {
    const date = new Date(d.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  const anomalyPoints = new Array(temps.length).fill(null);
  anomalies.forEach((a) => { anomalyPoints[a.index] = a.value; });

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Temperature',
          data: temps,
          borderColor: 'rgba(0, 229, 255, 0.4)',
          pointRadius: 0,
          borderWidth: 1,
          fill: false,
          tension: 0.2,
        },
        {
          label: 'Mean',
          data: new Array(temps.length).fill(stats.mean),
          borderColor: 'rgba(255,255,255,0.2)',
          borderDash: [4, 4],
          pointRadius: 0,
          borderWidth: 1,
          fill: false,
        },
        {
          label: '+2σ',
          data: new Array(temps.length).fill(stats.mean + 2 * stats.stdDev),
          borderColor: 'rgba(251, 113, 133, 0.3)',
          borderDash: [3, 3],
          pointRadius: 0,
          borderWidth: 1,
          fill: false,
        },
        {
          label: '-2σ',
          data: new Array(temps.length).fill(stats.mean - 2 * stats.stdDev),
          borderColor: 'rgba(139, 92, 246, 0.3)',
          borderDash: [3, 3],
          pointRadius: 0,
          borderWidth: 1,
          fill: '-1',
          backgroundColor: 'rgba(139,92,246,0.03)',
        },
        {
          label: 'Anomalies',
          data: anomalyPoints,
          borderColor: 'transparent',
          pointBackgroundColor: '#fb7185',
          pointBorderColor: '#fb7185',
          pointRadius: 6,
          pointHoverRadius: 8,
          showLine: false,
          fill: false,
        },
      ],
    },
    options: chartOptions(),
  });
  charts.push(chart);
}

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: true, position: 'top', labels: { color: 'rgba(240,244,255,0.65)', font: { size: 10 }, boxWidth: 10, padding: 15 } },
    },
    scales: {
      x: { ticks: { color: 'rgba(240,244,255,0.35)', font: { size: 9 }, maxTicksLimit: 15, maxRotation: 45 }, grid: { color: 'rgba(255,255,255,0.03)' } },
      y: { ticks: { color: 'rgba(240,244,255,0.35)', font: { size: 10 }, callback: (v) => v + '°' }, grid: { color: 'rgba(255,255,255,0.04)' } },
    },
  };
}
