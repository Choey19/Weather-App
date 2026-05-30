# ⛅ NimbusIQ — Weather Analytics Platform

A sleek, single-page weather analytics dashboard built with **vanilla JavaScript (ES modules)** and **Chart.js** — no build step, no framework. Real-time forecasts, historical climate analysis, air quality, and interactive visualizations, all powered by the free [Open-Meteo](https://open-meteo.com/) API.

## ✨ Features

- **🏠 Dashboard** — Current conditions at a glance: temperature, weather state, and key metrics for any city.
- **📅 Forecast** — Multi-day forecast with daily highs/lows and weather icons.
- **📜 Historical** — Pull and explore past weather data from the Open-Meteo archive.
- **📊 Charts** — Interactive Chart.js visualizations with linear-regression trend lines for spotting climate trends.
- **💨 Air Quality** — Current air quality readings from the Open-Meteo air-quality API.
- **📖 API Docs** — In-app reference for the data sources powering the platform.
- **🔍 City search** — Type-ahead geocoding search; your selected city is remembered across sessions.
- **⚡ Smart caching** — API responses are cached in `localStorage` with a TTL to cut network calls and speed up navigation.
- **📱 Responsive UI** — Collapsible sidebar, mobile menu, dark theme, and smooth page transitions.

## 🚀 Getting Started

Because the app uses native ES modules (`<script type="module">`), it must be served over HTTP — opening `index.html` directly via `file://` will break the module imports.

### Run locally

```bash
# Clone the repo
git clone https://github.com/Choey19/Weather-App.git
cd Weather-App

# Start any static server, e.g. Python's built-in one:
python3 -m http.server 8000
```

Then open **http://localhost:8000/** in your browser.

Any static file server works equally well:

```bash
npx serve .             # Node
php -S localhost:8000   # PHP
```

## 🗂️ Project Structure

```
weatherApp/
├── index.html                  # App shell, sidebar nav, CDN imports
├── js/
│   ├── app.js                  # Router, search, sidebar wiring, app init
│   ├── components/             # View renderers (one per route)
│   │   ├── dashboard.js
│   │   ├── forecast.js
│   │   ├── historical.js
│   │   ├── charts.js
│   │   ├── airQuality.js
│   │   └── apiDocs.js
│   ├── services/               # Data + business logic
│   │   ├── weatherService.js   # Open-Meteo forecast/archive/air-quality
│   │   ├── geocodingService.js # City search + default-city persistence
│   │   ├── cacheService.js     # localStorage cache with TTL
│   │   └── analyticsService.js # Linear-regression trend analysis
│   └── utils/                  # DOM helpers, date utils, animations
└── styles/                     # Modular CSS (variables, layout, components, charts, …)
```

## 🛠️ Tech Stack

- **Vanilla JavaScript** — ES modules, hash-based routing, zero dependencies to install.
- **[Chart.js 4](https://www.chartjs.org/)** — loaded via CDN for the charts view.
- **[Open-Meteo API](https://open-meteo.com/)** — forecast, historical archive, and air-quality data (no API key required).
- **CSS** — hand-written, modular stylesheets with CSS custom properties for theming.

## 📡 Data Sources

All data comes from Open-Meteo's free, no-key endpoints:

| Endpoint | Used for |
| --- | --- |
| `api.open-meteo.com/v1/forecast` | Current conditions & forecast |
| `archive-api.open-meteo.com/v1/archive` | Historical weather |
| `air-quality-api.open-meteo.com/v1/air-quality` | Air quality |
| `geocoding-api.open-meteo.com` | City search |

## 📄 License

Released under the MIT License. Weather data © [Open-Meteo](https://open-meteo.com/) under CC BY 4.0.
