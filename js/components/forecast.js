// ============================================
// NimbusIQ — Forecast Component
// ============================================

import { getHourlyForecast, getDailyForecast, getWindDirection } from '../services/weatherService.js';
import { formatHour, formatTime, getShortDayName, formatDate, isToday } from '../utils/dateUtils.js';
import { $, render, showSkeleton } from '../utils/dom.js';
import { staggerCards } from '../utils/animations.js';

let activeTab = 'hourly';
let chartInstance = null;

export async function renderForecast(container, city) {
  showSkeleton(container, 4);

  try {
    const [hourly, daily] = await Promise.all([
      getHourlyForecast(city.latitude, city.longitude, 3),
      getDailyForecast(city.latitude, city.longitude, 16),
    ]);

    const html = `
      <div class="page-view">
        <h2 class="page-title">Weather Forecast</h2>
        <p class="page-subtitle">${city.name}, ${city.country} — Extended forecast up to 16 days</p>

        <div class="tabs" id="forecastTabs" style="margin-bottom: var(--space-lg)">
          <div class="tab ${activeTab === 'hourly' ? 'active' : ''}" data-tab="hourly">Hourly</div>
          <div class="tab ${activeTab === 'daily' ? 'active' : ''}" data-tab="daily">7-Day</div>
          <div class="tab ${activeTab === 'extended' ? 'active' : ''}" data-tab="extended">16-Day</div>
        </div>

        <div id="forecastContent"></div>
      </div>
    `;

    render(container, html);

    // Tab click events
    const tabs = container.querySelectorAll('.tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.tab;
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        renderTabContent(hourly, daily);
      });
    });

    renderTabContent(hourly, daily);

  } catch (err) {
    render(container, `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <div class="empty-state__title">Failed to load forecast</div>
        <div class="empty-state__text">${err.message}</div>
      </div>
    `);
  }
}

function renderTabContent(hourly, daily) {
  const content = document.getElementById('forecastContent');
  if (!content) return;

  // Destroy previous chart
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  if (activeTab === 'hourly') {
    renderHourlyTab(content, hourly);
  } else if (activeTab === 'daily') {
    renderDailyTab(content, daily.slice(0, 7));
  } else {
    renderDailyTab(content, daily);
  }
}

function renderHourlyTab(content, hourly) {
  const now = new Date();
  const upcoming = hourly.filter((h) => new Date(h.time) >= new Date(now.getTime() - 3600000));
  const display = upcoming.slice(0, 48);

  content.innerHTML = `
    <div class="grid grid--2">
      <div class="card col-span-2 chart-card">
        <div class="chart-card__toolbar">
          <span class="chart-card__title">Temperature & Precipitation</span>
        </div>
        <div class="chart-container chart-container--md">
          <canvas id="hourlyChart"></canvas>
        </div>
      </div>

      <div class="card col-span-2">
        <div class="card__header">
          <span class="card__title">Hourly Details</span>
          <span class="badge badge--cyan">${display.length}h</span>
        </div>
        <div class="data-table-wrap" style="max-height:400px;overflow-y:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Cond.</th>
                <th>Temp</th>
                <th>Feels</th>
                <th>Humidity</th>
                <th>Precip %</th>
                <th>Wind</th>
              </tr>
            </thead>
            <tbody>
              ${display.map((h) => `
                <tr>
                  <td>${formatHour(h.time)}</td>
                  <td>${h.icon} ${h.description}</td>
                  <td>${Math.round(h.temp)}°C</td>
                  <td>${Math.round(h.feelsLike)}°C</td>
                  <td>${h.humidity}%</td>
                  <td>${h.precipProb}%</td>
                  <td>${h.windSpeed} km/h ${getWindDirection(h.windDir)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Chart
  const ctx = document.getElementById('hourlyChart');
  if (ctx && typeof Chart !== 'undefined') {
    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: display.map((h) => formatHour(h.time)),
        datasets: [
          {
            label: 'Temperature (°C)',
            data: display.map((h) => h.temp),
            borderColor: '#00e5ff',
            backgroundColor: 'rgba(0, 229, 255, 0.08)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
            yAxisID: 'y',
          },
          {
            label: 'Precip. Prob. (%)',
            data: display.map((h) => h.precipProb),
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            yAxisID: 'y1',
          },
        ],
      },
      options: getChartOptions(true),
    });
  }
}

function renderDailyTab(content, daily) {
  content.innerHTML = `
    <div class="grid grid--2">
      <div class="card col-span-2 chart-card">
        <div class="chart-card__toolbar">
          <span class="chart-card__title">Temperature Range</span>
        </div>
        <div class="chart-container chart-container--md">
          <canvas id="dailyChart"></canvas>
        </div>
      </div>

      ${daily.map((d) => `
        <div class="card" data-stagger>
          <div class="card__header">
            <span class="card__title">${isToday(d.date) ? '📅 Today' : formatDate(d.date)}</span>
            <span style="font-size:1.5rem">${d.icon}</span>
          </div>
          <div style="display:flex;align-items:baseline;gap:var(--space-sm);margin-bottom:var(--space-xs)">
            <span class="stat-value" style="font-size:var(--text-2xl)">${Math.round(d.tempMax)}°</span>
            <span style="color:var(--text-tertiary);font-family:var(--font-mono);font-size:var(--text-sm)">${Math.round(d.tempMin)}°</span>
          </div>
          <p style="font-size:var(--text-sm);margin-bottom:var(--space-xs)">${d.description}</p>
          <div style="display:flex;gap:var(--space-md);font-size:var(--text-xs);color:var(--text-tertiary)">
            <span>💧 ${d.precipProb}%</span>
            <span>💨 ${d.windMax} km/h</span>
            <span>☀️ UV ${d.uvIndex}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  staggerCards(content);

  // Chart
  const ctx = document.getElementById('dailyChart');
  if (ctx && typeof Chart !== 'undefined') {
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: daily.map((d) => isToday(d.date) ? 'Today' : getShortDayName(d.date)),
        datasets: [
          {
            label: 'High',
            data: daily.map((d) => d.tempMax),
            backgroundColor: 'rgba(0, 229, 255, 0.6)',
            borderRadius: 4,
          },
          {
            label: 'Low',
            data: daily.map((d) => d.tempMin),
            backgroundColor: 'rgba(139, 92, 246, 0.6)',
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top', labels: { color: 'rgba(240,244,255,0.65)', font: { size: 11 }, boxWidth: 12 } },
        },
        scales: {
          x: { ticks: { color: 'rgba(240,244,255,0.4)', font: { size: 10 } }, grid: { display: false } },
          y: { ticks: { color: 'rgba(240,244,255,0.4)', font: { size: 11 }, callback: (v) => v + '°' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        },
      },
    });
  }
}

function getChartOptions(dualAxis = false) {
  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: true, position: 'top', labels: { color: 'rgba(240,244,255,0.65)', font: { size: 11 }, boxWidth: 12 } },
    },
    scales: {
      x: { ticks: { color: 'rgba(240,244,255,0.4)', font: { size: 10 }, maxTicksLimit: 12 }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { position: 'left', ticks: { color: 'rgba(240,244,255,0.4)', font: { size: 11 }, callback: (v) => v + '°' }, grid: { color: 'rgba(255,255,255,0.04)' } },
    },
  };

  if (dualAxis) {
    opts.scales.y1 = {
      position: 'right',
      min: 0, max: 100,
      ticks: { color: 'rgba(139,92,246,0.5)', font: { size: 11 }, callback: (v) => v + '%' },
      grid: { display: false },
    };
  }

  return opts;
}
