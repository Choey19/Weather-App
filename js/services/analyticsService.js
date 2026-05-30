// ============================================
// NimbusIQ — Analytics Service
// ============================================

/**
 * Calculate linear regression trend line
 * Returns { slope, intercept, predict(x) }
 */
export function calculateTrend(dataPoints) {
  const n = dataPoints.length;
  if (n < 2) return { slope: 0, intercept: dataPoints[0] || 0, predict: () => dataPoints[0] || 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += dataPoints[i];
    sumXY += i * dataPoints[i];
    sumXX += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return {
    slope,
    intercept,
    predict: (x) => slope * x + intercept,
    trendLine: Array.from({ length: n }, (_, i) => slope * i + intercept),
  };
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(data, windowSize = 7) {
  if (data.length < windowSize) return [...data];

  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < windowSize - 1) {
      // Not enough data yet, use available
      const slice = data.slice(0, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
    } else {
      const slice = data.slice(i - windowSize + 1, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / windowSize);
    }
  }
  return result;
}

/**
 * Detect anomalies using Z-score
 */
export function detectAnomalies(data, threshold = 2) {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return [];

  return data.map((val, i) => {
    const zScore = (val - mean) / stdDev;
    return {
      index: i,
      value: val,
      zScore,
      isAnomaly: Math.abs(zScore) > threshold,
    };
  }).filter((d) => d.isAnomaly);
}

/**
 * Calculate statistics for a dataset
 */
export function calculateStats(data) {
  const filtered = data.filter((v) => v !== null && v !== undefined && !isNaN(v));
  if (filtered.length === 0) return { min: 0, max: 0, mean: 0, stdDev: 0, median: 0 };

  const sorted = [...filtered].sort((a, b) => a - b);
  const mean = filtered.reduce((a, b) => a + b, 0) / filtered.length;
  const variance = filtered.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / filtered.length;

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: Math.round(mean * 100) / 100,
    stdDev: Math.round(Math.sqrt(variance) * 100) / 100,
    median: sorted[Math.floor(sorted.length / 2)],
    count: filtered.length,
  };
}

/**
 * Generate forecast summary text
 */
export function generateForecastSummary(dailyData) {
  if (!dailyData || dailyData.length === 0) return 'No data available.';

  const temps = dailyData.map((d) => d.tempMax);
  const precips = dailyData.map((d) => d.precipSum || 0);
  const trend = calculateTrend(temps);

  const avgHigh = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
  const totalPrecip = precips.reduce((a, b) => a + b, 0).toFixed(1);

  let trendText = 'stable';
  if (trend.slope > 0.3) trendText = 'warming';
  else if (trend.slope < -0.3) trendText = 'cooling';

  const rainyDays = dailyData.filter((d) => (d.precipSum || 0) > 1).length;

  return `Average high of ${avgHigh}°C with a ${trendText} trend. ` +
    `Total precipitation: ${totalPrecip}mm across ${rainyDays} rainy day${rainyDays !== 1 ? 's' : ''}.`;
}

/**
 * Compare historical period to current forecast
 */
export function compareHistoricalToForecast(historical, forecast) {
  const histTemps = historical.map((d) => d.tempMean || (d.tempMax + d.tempMin) / 2);
  const foreTemps = forecast.map((d) => (d.tempMax + d.tempMin) / 2);

  const histStats = calculateStats(histTemps);
  const foreStats = calculateStats(foreTemps);

  const tempDiff = foreStats.mean - histStats.mean;

  return {
    historical: histStats,
    forecast: foreStats,
    tempDifference: Math.round(tempDiff * 100) / 100,
    isWarmer: tempDiff > 0,
    summary: `Current forecast is ${Math.abs(tempDiff).toFixed(1)}°C ${tempDiff > 0 ? 'warmer' : 'cooler'} than the historical average.`,
  };
}
