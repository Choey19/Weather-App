// ============================================
// NimbusIQ — Dashboard Component (Main View)
// ============================================

import { getCurrentWeather, getHourlyForecast, getDailyForecast, getWindDirection } from '../services/weatherService.js';
import { formatTime, formatHour, formatDate, getCurrentDateTime, getShortDayName, isToday } from '../utils/dateUtils.js';
import { $, render, showSkeleton } from '../utils/dom.js';
import { staggerCards, animateCounter } from '../utils/animations.js';

/**
 * Render the Dashboard view
 */
export async function renderDashboard(container, city) {
  showSkeleton(container, 6);

  try {
    const [current, hourly, daily] = await Promise.all([
      getCurrentWeather(city.latitude, city.longitude),
      getHourlyForecast(city.latitude, city.longitude, 2),
      getDailyForecast(city.latitude, city.longitude, 7),
    ]);

    const now = new Date();
    const currentHourIndex = hourly.findIndex((h) => new Date(h.time) >= now);
    const next24 = hourly.slice(Math.max(0, currentHourIndex - 1), currentHourIndex + 24);

    const html = `
      <div class="grid grid--dashboard">
        <!-- Hero Card -->
        <div class="card card--glass hero-card col-span-2 animate-in stagger-1" data-stagger>
          <div class="hero-card__top">
            <div>
              <div class="hero-card__location">
                <span class="hero-card__location-icon">📍</span>
                <span>${city.name}, ${city.country || ''}</span>
              </div>
              <div class="hero-card__datetime">${getCurrentDateTime()}</div>
            </div>
            <div class="live-indicator">
              <span class="live-indicator__dot"></span>
              LIVE
            </div>
          </div>

          <div class="hero-card__temp-section">
            <div>
              <div class="hero-card__temp">
                ${Math.round(current.current.temp)}°
              </div>
              <div class="hero-card__condition">${current.current.description}</div>
              <div class="hero-card__feels-like">Feels like ${Math.round(current.current.feelsLike)}°C</div>
            </div>
            <div class="hero-card__weather-icon">${current.current.icon}</div>
          </div>

          <div class="hero-card__details">
            <div class="hero-detail">
              <span class="hero-detail__icon">💧</span>
              <span class="hero-detail__value">${current.current.humidity}%</span>
              <span class="hero-detail__label">Humidity</span>
            </div>
            <div class="hero-detail">
              <span class="hero-detail__icon">💨</span>
              <span class="hero-detail__value">${current.current.windSpeed} km/h</span>
              <span class="hero-detail__label">${getWindDirection(current.current.windDirection)}</span>
            </div>
            <div class="hero-detail">
              <span class="hero-detail__icon">🌡️</span>
              <span class="hero-detail__value">${current.current.pressure} hPa</span>
              <span class="hero-detail__label">Pressure</span>
            </div>
            <div class="hero-detail">
              <span class="hero-detail__icon">☁️</span>
              <span class="hero-detail__value">${current.current.cloudCover}%</span>
              <span class="hero-detail__label">Cloud Cover</span>
            </div>
          </div>
        </div>

        <!-- Quick Stat Cards -->
        <div class="card stat-card animate-in stagger-2" data-stagger>
          <div class="stat-card__header">
            <span class="stat-card__label">UV Index</span>
            <span class="stat-card__icon">☀️</span>
          </div>
          <div class="stat-card__value stat-value">${current.today.uvIndex}</div>
          <div class="stat-card__sub">${getUVLevel(current.today.uvIndex)}</div>
        </div>

        <div class="card stat-card animate-in stagger-3" data-stagger>
          <div class="stat-card__header">
            <span class="stat-card__label">Wind Gusts</span>
            <span class="stat-card__icon">🌬️</span>
          </div>
          <div class="stat-card__value stat-value">${current.current.windGusts}<span class="stat-unit">km/h</span></div>
          <div class="stat-card__sub">Max today: ${current.today.windMax} km/h</div>
        </div>

        <!-- Sunrise/Sunset -->
        <div class="card animate-in stagger-4 col-span-2" data-stagger>
          <div class="card__header">
            <span class="card__title">Sun & Moon</span>
          </div>
          <div class="sun-times">
            <div class="sun-time">
              <span class="sun-time__icon">🌅</span>
              <div>
                <div class="sun-time__label">Sunrise</div>
                <div class="sun-time__value">${formatTime(current.today.sunrise)}</div>
              </div>
            </div>
            <div class="sun-time">
              <span class="sun-time__icon">🌇</span>
              <div>
                <div class="sun-time__label">Sunset</div>
                <div class="sun-time__value">${formatTime(current.today.sunset)}</div>
              </div>
            </div>
            <div class="sun-time">
              <span class="sun-time__icon">🌧️</span>
              <div>
                <div class="sun-time__label">Precipitation</div>
                <div class="sun-time__value">${current.today.precipSum} mm</div>
              </div>
            </div>
            <div class="sun-time">
              <span class="sun-time__icon">🌡️</span>
              <div>
                <div class="sun-time__label">High / Low</div>
                <div class="sun-time__value">${Math.round(current.today.tempMax)}° / ${Math.round(current.today.tempMin)}°</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Precipitation & Temp cards -->
        <div class="card stat-card animate-in stagger-5" data-stagger>
          <div class="stat-card__header">
            <span class="stat-card__label">Precipitation</span>
            <span class="stat-card__icon">🌧️</span>
          </div>
          <div class="stat-card__value stat-value">${current.today.precipSum}<span class="stat-unit">mm</span></div>
          <div class="stat-card__sub">Today's total</div>
        </div>

        <div class="card stat-card animate-in stagger-6" data-stagger>
          <div class="stat-card__header">
            <span class="stat-card__label">High / Low</span>
            <span class="stat-card__icon">🌡️</span>
          </div>
          <div class="stat-card__value stat-value">${Math.round(current.today.tempMax)}°<span class="stat-unit" style="font-size:0.6em;opacity:0.5"> / ${Math.round(current.today.tempMin)}°</span></div>
          <div class="stat-card__sub">Temperature range</div>
        </div>

        <!-- Hourly Forecast Strip -->
        <div class="card col-span-4 animate-in stagger-7" data-stagger>
          <div class="card__header">
            <span class="card__title">24-Hour Forecast</span>
            <span class="badge badge--cyan">Hourly</span>
          </div>
          <div class="hourly-strip">
            ${next24.map((h, i) => {
              const isNow = i === 1 && currentHourIndex > 0;
              return `
                <div class="hourly-item ${isNow ? 'hourly-item--now' : ''}">
                  <span class="hourly-item__time">${isNow ? 'Now' : formatHour(h.time)}</span>
                  <span class="hourly-item__icon">${h.icon}</span>
                  <span class="hourly-item__temp">${Math.round(h.temp)}°</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Weekly Forecast -->
        <div class="card col-span-2 animate-in stagger-8" data-stagger>
          <div class="card__header">
            <span class="card__title">7-Day Forecast</span>
            <span class="badge badge--violet">Daily</span>
          </div>
          <div class="weekly-row">
            ${daily.map((d) => {
              const absMin = Math.min(...daily.map(x => x.tempMin));
              const absMax = Math.max(...daily.map(x => x.tempMax));
              const range = absMax - absMin || 1;
              const left = ((d.tempMin - absMin) / range) * 100;
              const width = ((d.tempMax - d.tempMin) / range) * 100;
              return `
                <div class="weekly-day">
                  <span class="weekly-day__name">${isToday(d.date) ? 'Today' : getShortDayName(d.date)}</span>
                  <span class="weekly-day__icon">${d.icon}</span>
                  <div class="weekly-day__bar-wrap">
                    <div class="weekly-day__bar" style="left:${left}%;width:${Math.max(width, 8)}%"></div>
                  </div>
                  <span class="weekly-day__low">${Math.round(d.tempMin)}°</span>
                  <span class="weekly-day__high">${Math.round(d.tempMax)}°</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Weekly Temp chart -->
        <div class="card col-span-2 chart-card animate-in stagger-8" data-stagger>
          <div class="card__header">
            <span class="card__title">Temperature Trend</span>
          </div>
          <div class="chart-container chart-container--sm">
            <canvas id="dashTempChart"></canvas>
          </div>
        </div>
      </div>
    `;

    render(container, html);
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    staggerCards(el);

    // Render Chart.js weekly temperature chart
    renderDashTempChart(daily);

  } catch (err) {
    render(container, `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <div class="empty-state__title">Unable to load weather data</div>
        <div class="empty-state__text">${err.message}</div>
      </div>
    `);
  }
}

function renderDashTempChart(daily) {
  const ctx = document.getElementById('dashTempChart');
  if (!ctx || typeof Chart === 'undefined') return;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: daily.map((d) => getShortDayName(d.date)),
      datasets: [
        {
          label: 'High',
          data: daily.map((d) => d.tempMax),
          borderColor: '#00e5ff',
          backgroundColor: 'rgba(0, 229, 255, 0.1)',
          fill: '+1',
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#00e5ff',
        },
        {
          label: 'Low',
          data: daily.map((d) => d.tempMin),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#8b5cf6',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { color: 'rgba(240,244,255,0.65)', font: { size: 11 }, boxWidth: 12 },
        },
      },
      scales: {
        x: {
          ticks: { color: 'rgba(240,244,255,0.4)', font: { size: 11 } },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
        y: {
          ticks: { color: 'rgba(240,244,255,0.4)', font: { size: 11 }, callback: (v) => v + '°' },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
      },
    },
  });
}

function getUVLevel(uv) {
  if (uv <= 2) return 'Low';
  if (uv <= 5) return 'Moderate';
  if (uv <= 7) return 'High';
  if (uv <= 10) return 'Very High';
  return 'Extreme';
}
