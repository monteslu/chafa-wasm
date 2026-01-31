#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadResults(filename) {
  const path = join(__dirname, filename);
  if (!existsSync(path)) {
    return null;
  }
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function generateSVGChart(title, data, width = 600, height = 400) {
  const margin = { top: 40, right: 120, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const modes = [...new Set(data.map(d => d.mode))];
  const heights = [...new Set(data.map(d => d.outputHeight))].sort((a, b) => a - b);

  const maxFps = Math.max(...data.map(d => d.fps)) * 1.1;

  const colors = {
    'block': '#4CAF50',
    'ascii': '#2196F3',
    'braille': '#FF9800',
    'braille-dither': '#9C27B0',
  };

  const xScale = (i) => margin.left + (i / (heights.length - 1)) * chartWidth;
  const yScale = (fps) => margin.top + chartHeight - (fps / maxFps) * chartHeight;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="font-family: system-ui, sans-serif;">`;

  // Background
  svg += `<rect width="${width}" height="${height}" fill="#1a1a2e"/>`;

  // Title
  svg += `<text x="${width / 2}" y="25" text-anchor="middle" fill="#fff" font-size="16" font-weight="bold">${title}</text>`;

  // Grid lines
  for (let i = 0; i <= 5; i++) {
    const y = margin.top + (i / 5) * chartHeight;
    const fps = Math.round(maxFps * (1 - i / 5));
    svg += `<line x1="${margin.left}" y1="${y}" x2="${margin.left + chartWidth}" y2="${y}" stroke="#333" stroke-dasharray="2,2"/>`;
    svg += `<text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" fill="#888" font-size="11">${fps}</text>`;
  }

  // X axis labels
  heights.forEach((h, i) => {
    const x = xScale(i);
    svg += `<text x="${x}" y="${height - margin.bottom + 20}" text-anchor="middle" fill="#888" font-size="11">${h} rows</text>`;
  });

  // Y axis label
  svg += `<text x="15" y="${height / 2}" text-anchor="middle" fill="#888" font-size="12" transform="rotate(-90, 15, ${height / 2})">Frames per Second</text>`;

  // X axis label
  svg += `<text x="${width / 2}" y="${height - 10}" text-anchor="middle" fill="#888" font-size="12">Output Height</text>`;

  // Lines for each mode
  modes.forEach(mode => {
    const modeData = data.filter(d => d.mode === mode).sort((a, b) => a.outputHeight - b.outputHeight);
    const color = colors[mode] || '#fff';

    // Line
    let path = `M ${xScale(0)} ${yScale(modeData[0].fps)}`;
    modeData.forEach((d, i) => {
      if (i > 0) path += ` L ${xScale(i)} ${yScale(d.fps)}`;
    });
    svg += `<path d="${path}" fill="none" stroke="${color}" stroke-width="2"/>`;

    // Points
    modeData.forEach((d, i) => {
      svg += `<circle cx="${xScale(i)}" cy="${yScale(d.fps)}" r="4" fill="${color}"/>`;
    });
  });

  // Legend
  let legendY = margin.top + 10;
  modes.forEach(mode => {
    const color = colors[mode] || '#fff';
    svg += `<rect x="${width - margin.right + 10}" y="${legendY}" width="12" height="12" fill="${color}"/>`;
    svg += `<text x="${width - margin.right + 28}" y="${legendY + 10}" fill="#fff" font-size="11">${mode}</text>`;
    legendY += 20;
  });

  svg += '</svg>';
  return svg;
}

function generateComparisonChart(title, baseline, simd, mode, width = 600, height = 400) {
  const margin = { top: 40, right: 100, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const baselineData = baseline.benchmarks.filter(d => d.mode === mode);
  const simdData = simd ? simd.benchmarks.filter(d => d.mode === mode) : [];

  const heights = [...new Set(baselineData.map(d => d.outputHeight))].sort((a, b) => a - b);
  const allFps = [...baselineData.map(d => d.fps), ...simdData.map(d => d.fps)];
  const maxFps = Math.max(...allFps) * 1.1;

  const xScale = (i) => margin.left + (i / (heights.length - 1)) * chartWidth;
  const yScale = (fps) => margin.top + chartHeight - (fps / maxFps) * chartHeight;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="font-family: system-ui, sans-serif;">`;

  // Background
  svg += `<rect width="${width}" height="${height}" fill="#1a1a2e"/>`;

  // Title
  svg += `<text x="${width / 2}" y="25" text-anchor="middle" fill="#fff" font-size="16" font-weight="bold">${title}</text>`;

  // Grid lines
  for (let i = 0; i <= 5; i++) {
    const y = margin.top + (i / 5) * chartHeight;
    const fps = Math.round(maxFps * (1 - i / 5));
    svg += `<line x1="${margin.left}" y1="${y}" x2="${margin.left + chartWidth}" y2="${y}" stroke="#333" stroke-dasharray="2,2"/>`;
    svg += `<text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" fill="#888" font-size="11">${fps}</text>`;
  }

  // X axis labels
  heights.forEach((h, i) => {
    const x = xScale(i);
    svg += `<text x="${x}" y="${height - margin.bottom + 20}" text-anchor="middle" fill="#888" font-size="11">${h}</text>`;
  });

  svg += `<text x="${width / 2}" y="${height - 10}" text-anchor="middle" fill="#888" font-size="12">Output Height (rows)</text>`;

  // Baseline line (red)
  let basePath = `M ${xScale(0)} ${yScale(baselineData[0].fps)}`;
  baselineData.sort((a, b) => a.outputHeight - b.outputHeight).forEach((d, i) => {
    if (i > 0) basePath += ` L ${xScale(i)} ${yScale(d.fps)}`;
  });
  svg += `<path d="${basePath}" fill="none" stroke="#f44336" stroke-width="2"/>`;
  baselineData.forEach((d, i) => {
    svg += `<circle cx="${xScale(i)}" cy="${yScale(d.fps)}" r="4" fill="#f44336"/>`;
  });

  // SIMD line (green) if available
  if (simdData.length > 0) {
    let simdPath = `M ${xScale(0)} ${yScale(simdData[0].fps)}`;
    simdData.sort((a, b) => a.outputHeight - b.outputHeight).forEach((d, i) => {
      if (i > 0) simdPath += ` L ${xScale(i)} ${yScale(d.fps)}`;
    });
    svg += `<path d="${simdPath}" fill="none" stroke="#4CAF50" stroke-width="2"/>`;
    simdData.forEach((d, i) => {
      svg += `<circle cx="${xScale(i)}" cy="${yScale(d.fps)}" r="4" fill="#4CAF50"/>`;
    });
  }

  // Legend
  svg += `<rect x="${width - margin.right + 10}" y="${margin.top + 10}" width="12" height="12" fill="#f44336"/>`;
  svg += `<text x="${width - margin.right + 28}" y="${margin.top + 20}" fill="#fff" font-size="11">chafa-wasm</text>`;

  if (simdData.length > 0) {
    svg += `<rect x="${width - margin.right + 10}" y="${margin.top + 30}" width="12" height="12" fill="#4CAF50"/>`;
    svg += `<text x="${width - margin.right + 28}" y="${margin.top + 40}" fill="#fff" font-size="11">chafa-simd</text>`;
  }

  svg += '</svg>';
  return svg;
}

function generateHTML(baseline, simd) {
  const modes = ['block', 'ascii', 'braille', 'braille-dither'];

  let html = `<!DOCTYPE html>
<html>
<head>
  <title>chafa-simd Benchmark Results</title>
  <style>
    body {
      background: #0d0d1a;
      color: #fff;
      font-family: system-ui, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { text-align: center; }
    h2 { margin-top: 40px; border-bottom: 1px solid #333; padding-bottom: 10px; }
    .chart-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    .chart { background: #1a1a2e; border-radius: 8px; padding: 10px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 8px 12px;
      text-align: right;
      border-bottom: 1px solid #333;
    }
    th { background: #252540; }
    td:first-child, th:first-child { text-align: left; }
    .improvement { color: #4CAF50; font-weight: bold; }
    .baseline { color: #f44336; }
    .simd { color: #4CAF50; }
  </style>
</head>
<body>
  <h1>chafa-simd Benchmark Results</h1>
  <p style="text-align: center; color: #888;">
    Test image: 640x480 | ${baseline.benchmarks[0].iterations} iterations per test
  </p>

  <h2>Overview: All Modes</h2>
  <div class="chart">
    ${generateSVGChart('FPS by Mode and Output Height (Baseline)', baseline.benchmarks)}
  </div>
`;

  if (simd) {
    html += `
  <h2>Comparison Charts</h2>
  <div class="chart-grid">
`;
    modes.forEach(mode => {
      html += `    <div class="chart">${generateComparisonChart(`${mode} Mode: Baseline vs SIMD`, baseline, simd, mode)}</div>\n`;
    });
    html += `  </div>`;

    // Speedup table
    html += `
  <h2>Speedup Summary</h2>
  <table>
    <tr>
      <th>Mode</th>
      <th>Height</th>
      <th class="baseline">Baseline (FPS)</th>
      <th class="simd">SIMD (FPS)</th>
      <th class="improvement">Speedup</th>
    </tr>
`;
    modes.forEach(mode => {
      const baseResults = baseline.benchmarks.filter(b => b.mode === mode);
      const simdResults = simd.benchmarks.filter(b => b.mode === mode);

      baseResults.forEach(base => {
        const simdResult = simdResults.find(s => s.outputHeight === base.outputHeight);
        if (simdResult) {
          const speedup = simdResult.fps / base.fps;
          html += `    <tr>
      <td>${mode}</td>
      <td>${base.outputHeight}</td>
      <td class="baseline">${base.fps.toFixed(1)}</td>
      <td class="simd">${simdResult.fps.toFixed(1)}</td>
      <td class="improvement">${speedup.toFixed(2)}x</td>
    </tr>\n`;
        }
      });
    });
    html += `  </table>`;
  }

  // Raw data table
  html += `
  <h2>Raw Data: Baseline</h2>
  <table>
    <tr>
      <th>Mode</th>
      <th>Height</th>
      <th>Width</th>
      <th>Time (ms)</th>
      <th>FPS</th>
      <th>Output Size</th>
    </tr>
`;
  baseline.benchmarks.forEach(b => {
    html += `    <tr>
      <td>${b.mode}</td>
      <td>${b.outputHeight}</td>
      <td>${b.outputWidth}</td>
      <td>${b.median.toFixed(2)}</td>
      <td>${b.fps.toFixed(1)}</td>
      <td>${(b.outputSize / 1024).toFixed(1)} KB</td>
    </tr>\n`;
  });
  html += `  </table>

</body>
</html>`;

  return html;
}

async function main() {
  const baseline = loadResults('results-baseline.json');
  const simd = loadResults('results-simd.json');

  if (!baseline) {
    console.error('No baseline results found. Run benchmark.js first.');
    process.exit(1);
  }

  const html = generateHTML(baseline, simd);
  const outPath = join(__dirname, 'benchmark-results.html');
  writeFileSync(outPath, html);

  console.log(`Generated: ${outPath}`);
  console.log(`Open in browser to view charts.`);

  if (!simd) {
    console.log('\nNote: No SIMD results found. Run with chafa-simd to generate comparison.');
  }
}

main().catch(console.error);
