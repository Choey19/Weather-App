// ============================================
// NimbusIQ — Air Quality Component
// ============================================

import { getAirQuality, getAQILevel } from '../services/weatherService.js';
import { formatHour } from '../utils/dateUtils.js';
import { $, render, showSkeleton } from '../utils/dom.js';
import { staggerCards, animateCounter } from '../utils/animations.js';

let chartInstance = null;

export async function renderAirQuality(container, city) {
  showSkeleton(container, 3);

  try {
    const data = await getAirQuality(city.latitude, city.longitude);
    const aqi = data.current.usAqi;
    const level = getAQILevel(aqi);

    // Calculate gauge arc
    const maxAqi = 500;
    const circumference = 2 * Math.PI * 52;
    const dashOffset = circumference - (Math.min(aqi, maxAqi) / maxAqi) * circumference;

    const pollutants = [
      { name: 'PM2.5', value: data.current.pm25, unit: 'μg/m³', icon: '🟤', threshold: 35 },
      { name: 'PM10', value: data.current.pm10, unit: 'μg/m³', icon: '🟠', threshold: 150 },
      { name: 'NO₂', value: data.current.no2, unit: 'μg/m³', icon: '🔴', threshold: 100 },
      { name: 'O₃', value: data.current.o3, unit: 'μg/m³', icon: '🔵', threshold: 100 },
      { name: 'SO₂', value: data.current.so2, unit: 'μg/m³', icon: '🟡', threshold: 75 },
      { name: 'CO', value: data.current.co, unit: 'μg/m³', icon: '⚫', threshold: 10000 },
    ];

    const html = `
      <div class="page-view">
        <h2 class="page-title">Air Quality Index</h2>
        <p class="page-subtitle">${city.name} — Real-time air quality monitoring and pollutant levels</p>

        <div class="grid grid--dashboard">
          <!-- AQI Gauge Card -->
          <div class="card card--glass col-span-2" data-stagger style="text-align:center">
            <div class="aqi-gauge">
              <div class="aqi-gauge__ring">
                <svg viewBox="0 0 120 120">
                  <circle class="aqi-gauge__bg" cx="60" cy="60" r="52"></circle>
                  <circle class="aqi-gauge__fill" cx="60" cy="60" r="52"
                    style="
                      stroke: ${level.color};
                      stroke-dasharray: ${circumference};
                      stroke-dashoffset: ${dashOffset};
                    ">
                  </circle>
                </svg>
                <div class="aqi-gauge__value" style="color: ${level.color}">${aqi || '—'}</div>
              </div>
              <div class="aqi-gauge__label" style="color: ${level.color}">${level.level}</div>
              <p style="font-size:var(--text-sm);color:var(--text-secondary);max-width:300px;margin: 0 auto">
                ${level.advice}
              </p>
            </div>

            <div class="divider"></div>

            <div style="display:flex;justify-content:center;gap:var(--space-xl);flex-wrap:wrap">
              <div>
                <div style="font-size:var(--text-xs);color:var(--text-tertiary)">US AQI</div>
                <div style="font-family:var(--font-mono);font-weight:700;font-size:var(--text-lg)">${data.current.usAqi || '—'}</div>
              </div>
              <div>
                <div style="font-size:var(--text-xs);color:var(--text-tertiary)">EU AQI</div>
                <div style="font-family:var(--font-mono);font-weight:700;font-size:var(--text-lg)">${data.current.europeanAqi || '—'}</div>
              </div>
            </div>
          </div>

          <!-- Pollutant Cards -->
          ${pollutants.map((p) => {
            const pct = Math.min((p.value || 0) / p.threshold * 100, 100);
            const isHigh = pct > 70;
            return `
              <div class="card stat-card ${isHigh ? 'card--accent-violet' : ''}" data-stagger>
                <div class="stat-card__header">
                  <span class="stat-card__label">${p.name}</span>
                  <span>${p.icon}</span>
                </div>
                <div class="stat-card__value stat-value" style="font-size:var(--text-xl)">
                  ${p.value != null ? p.value.toFixed(1) : '—'}
                </div>
                <div class="stat-card__sub">${p.unit}</div>
                <div style="margin-top:var(--space-xs)">
                  <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:9999px;overflow:hidden">
                    <div style="height:100%;width:${pct}%;background:${isHigh ? '#fb7185' : '#34d399'};border-radius:9999px;transition:width 1s var(--ease-out)"></div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}

          <!-- AQI Forecast Chart -->
          <div class="card col-span-4 chart-card" data-stagger>
            <div class="card__header">
              <span class="card__title">5-Day AQI Forecast</span>
              <span class="badge badge--emerald">Hourly</span>
            </div>
            <div class="chart-container chart-container--md">
              <canvas id="aqiForecastChart"></canvas>
            </div>
          </div>

          <!-- Health Recommendations -->
          <div class="card col-span-4" data-stagger>
            <div class="card__header">
              <span class="card__title">Health Recommendations</span>
              <span style="font-size:1.2rem">🏥</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:var(--space-md)">
              ${getHealthRecommendations(aqi).map((rec) => `
                <div style="display:flex;align-items:flex-start;gap:var(--space-sm);padding:var(--space-sm);background:var(--bg-card);border-radius:var(--radius-md)">
                  <span style="font-size:1.3rem;flex-shrink:0">${rec.icon}</span>
                  <div>
                    <div style="font-size:var(--text-sm);font-weight:600;margin-bottom:2px">${rec.title}</div>
                    <div style="font-size:var(--text-xs);color:var(--text-tertiary)">${rec.text}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    render(container, html);
    staggerCards($(container));

    // Render AQI forecast chart
    renderAQIChart(data.hourly);

  } catch (err) {
    render(container, `
      <div class="empty-state">
        <div class="empty-state__icon">💨</div>
        <div class="empty-state__title">Unable to load air quality data</div>
        <div class="empty-state__text">${err.message}</div>
      </div>
    `);
  }
}

function renderAQIChart(hourlyData) {
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  const ctx = document.getElementById('aqiForecastChart');
  if (!ctx || typeof Chart === 'undefined') return;

  // Sample every 3 hours
  const sampled = hourlyData.filter((_, i) => i % 3 === 0);

  const colors = sampled.map((h) => {
    const level = getAQILevel(h.aqi);
    return level.color;
  });

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sampled.map((h) => {
        const d = new Date(h.time);
        return `${d.getMonth() + 1}/${d.getDate()} ${formatHour(h.time)}`;
      }),
      datasets: [{
        label: 'US AQI',
        data: sampled.map((h) => h.aqi),
        borderColor: '#34d399',
        backgroundColor: 'rgba(52, 211, 153, 0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        segment: {
          borderColor: (ctx) => {
            const val = ctx.p1.parsed.y;
            if (val > 200) return '#ef4444';
            if (val > 150) return '#fb923c';
            if (val > 100) return '#fbbf24';
            if (val > 50) return '#34d399';
            return '#34d399';
          },
        },
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: { color: 'rgba(240,244,255,0.35)', font: { size: 9 }, maxTicksLimit: 12, maxRotation: 45 },
          grid: { color: 'rgba(255,255,255,0.03)' },
        },
        y: {
          min: 0,
          ticks: { color: 'rgba(240,244,255,0.35)', font: { size: 10 } },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
      },
    },
  });
}

function getHealthRecommendations(aqi) {
  const recs = [
    { icon: '🏃', title: 'Outdoor Exercise', text: aqi <= 50 ? 'Great conditions for outdoor activities.' : aqi <= 100 ? 'Generally safe, sensitive groups should reduce prolonged exertion.' : 'Consider moving activities indoors.' },
    { icon: '😷', title: 'Mask Usage', text: aqi <= 100 ? 'Not necessary for most people.' : aqi <= 150 ? 'Recommended for sensitive groups.' : 'Recommended for everyone outdoors.' },
    { icon: '🪟', title: 'Ventilation', text: aqi <= 50 ? 'Open windows for fresh air.' : aqi <= 150 ? 'Use air purifiers if available.' : 'Keep windows closed, use air filtration.' },
    { icon: '👶', title: 'Children & Elderly', text: aqi <= 50 ? 'No special precautions needed.' : aqi <= 100 ? 'Monitor for respiratory symptoms.' : 'Limit outdoor exposure significantly.' },
  ];
  return recs;
}
