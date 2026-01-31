#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import initChafa from '../dist/chafa.js';  // Use local SIMD build from dist/

const __dirname = dirname(fileURLToPath(import.meta.url));

// Chafa constants
const CHAFA_CANVAS_MODE_TRUECOLOR = 0;
const CHAFA_CANVAS_MODE_256 = 1;
const CHAFA_CANVAS_MODE_16 = 3;
const CHAFA_CANVAS_MODE_FGBG = 5;

const CHAFA_SYMBOL_TAG_SPACE = 0x1;
const CHAFA_SYMBOL_TAG_HALF = 0x4;
const CHAFA_SYMBOL_TAG_BLOCK = 0x8;
const CHAFA_SYMBOL_TAG_BORDER = 0x10;
const CHAFA_SYMBOL_TAG_BRAILLE = 0x800;
const CHAFA_SYMBOL_TAG_ASCII = 0x4000;

const CHAFA_DITHER_MODE_NONE = 0;
const CHAFA_DITHER_MODE_DIFFUSION = 2;

// Test configurations
const RENDER_MODES = {
  'block': {
    symbols: CHAFA_SYMBOL_TAG_SPACE | CHAFA_SYMBOL_TAG_BLOCK | CHAFA_SYMBOL_TAG_BORDER,
    canvasMode: CHAFA_CANVAS_MODE_TRUECOLOR,
    ditherMode: CHAFA_DITHER_MODE_NONE,
  },
  'block-256': {
    symbols: CHAFA_SYMBOL_TAG_SPACE | CHAFA_SYMBOL_TAG_BLOCK | CHAFA_SYMBOL_TAG_BORDER,
    canvasMode: CHAFA_CANVAS_MODE_256,
    ditherMode: CHAFA_DITHER_MODE_NONE,
  },
  'half-block': {
    symbols: CHAFA_SYMBOL_TAG_SPACE | CHAFA_SYMBOL_TAG_HALF,
    canvasMode: CHAFA_CANVAS_MODE_TRUECOLOR,
    ditherMode: CHAFA_DITHER_MODE_NONE,
  },
  'half-block-256': {
    symbols: CHAFA_SYMBOL_TAG_SPACE | CHAFA_SYMBOL_TAG_HALF,
    canvasMode: CHAFA_CANVAS_MODE_256,
    ditherMode: CHAFA_DITHER_MODE_NONE,
  },
  'ascii': {
    symbols: CHAFA_SYMBOL_TAG_SPACE | CHAFA_SYMBOL_TAG_ASCII,
    canvasMode: CHAFA_CANVAS_MODE_TRUECOLOR,
    ditherMode: CHAFA_DITHER_MODE_NONE,
  },
  'ascii-256': {
    symbols: CHAFA_SYMBOL_TAG_SPACE | CHAFA_SYMBOL_TAG_ASCII,
    canvasMode: CHAFA_CANVAS_MODE_256,
    ditherMode: CHAFA_DITHER_MODE_NONE,
  },
  'braille': {
    symbols: CHAFA_SYMBOL_TAG_BRAILLE,
    canvasMode: CHAFA_CANVAS_MODE_FGBG,
    ditherMode: CHAFA_DITHER_MODE_NONE,
  },
  'braille-dither': {
    symbols: CHAFA_SYMBOL_TAG_BRAILLE,
    canvasMode: CHAFA_CANVAS_MODE_FGBG,
    ditherMode: CHAFA_DITHER_MODE_DIFFUSION,
  },
};

// Output heights to test (terminal rows)
const OUTPUT_HEIGHTS = [12, 24, 48, 96, 120];

// Iterations for accurate timing
const WARMUP_ITERATIONS = 3;
const BENCHMARK_ITERATIONS = 20;

async function loadTestImage() {
  const imagePath = join(__dirname, 'test-image-640x480.png');

  if (!existsSync(imagePath)) {
    console.log('Test image not found. Generating...');
    const { execSync } = await import('child_process');
    execSync(`node ${join(__dirname, 'generate-test-image.js')}`, { stdio: 'inherit' });
  }

  const { data, info } = await sharp(imagePath)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  return { data, width: info.width, height: info.height };
}

async function runBenchmark(chafa, image, mode, modeConfig, outputHeight) {
  const aspectRatio = image.width / image.height;
  const outputWidth = Math.round(outputHeight * aspectRatio * 2); // *2 for terminal char aspect

  // Create symbol map
  const symbolMap = chafa._chafa_symbol_map_new();
  chafa._chafa_symbol_map_add_by_tags(symbolMap, modeConfig.symbols);

  // Create canvas config
  const canvasConfig = chafa._chafa_canvas_config_new();
  chafa._chafa_canvas_config_set_geometry(canvasConfig, outputWidth, outputHeight);
  chafa._chafa_canvas_config_set_canvas_mode(canvasConfig, modeConfig.canvasMode);
  chafa._chafa_canvas_config_set_symbol_map(canvasConfig, symbolMap);

  if (modeConfig.ditherMode !== CHAFA_DITHER_MODE_NONE) {
    chafa._chafa_canvas_config_set_dither_mode(canvasConfig, modeConfig.ditherMode);
  }

  // Allocate image data on heap
  const dataPtr = chafa._malloc(image.data.length);
  chafa.HEAPU8.set(image.data, dataPtr);

  // Warmup
  for (let i = 0; i < WARMUP_ITERATIONS; i++) {
    const canvas = chafa._chafa_canvas_new(canvasConfig);
    chafa._chafa_canvas_set_contents_rgba8(canvas, dataPtr, image.width, image.height, image.width * 4);
    const gsPtr = chafa._chafa_canvas_build_ansi(canvas);
    const strPtr = chafa._g_string_free_and_steal(gsPtr);
    chafa._free(strPtr);
    chafa._chafa_canvas_unref(canvas);
  }

  // Benchmark
  const times = [];
  let outputSize = 0;

  for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
    const start = performance.now();

    const canvas = chafa._chafa_canvas_new(canvasConfig);
    chafa._chafa_canvas_set_contents_rgba8(canvas, dataPtr, image.width, image.height, image.width * 4);
    const gsPtr = chafa._chafa_canvas_build_ansi(canvas);
    const strPtr = chafa._g_string_free_and_steal(gsPtr);
    const ansi = chafa.UTF8ToString(strPtr);

    const end = performance.now();
    times.push(end - start);

    if (i === 0) {
      outputSize = ansi.length;
    }

    chafa._free(strPtr);
    chafa._chafa_canvas_unref(canvas);
  }

  // Cleanup
  chafa._free(dataPtr);
  chafa._chafa_canvas_config_unref(canvasConfig);
  chafa._chafa_symbol_map_unref(symbolMap);

  // Calculate stats
  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  const min = times[0];
  const max = times[times.length - 1];
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const fps = 1000 / median;

  return {
    mode,
    outputHeight,
    outputWidth,
    outputSize,
    median,
    min,
    max,
    mean,
    fps,
    iterations: BENCHMARK_ITERATIONS,
  };
}

async function main() {
  console.log('Loading chafa-wasm (SIMD build)...');
  const chafa = await initChafa();

  console.log('Loading test image...');
  const image = await loadTestImage();
  console.log(`Image: ${image.width}x${image.height}`);

  const results = {
    timestamp: new Date().toISOString(),
    implementation: 'chafa-wasm (SIMD)',
    image: { width: image.width, height: image.height },
    benchmarks: [],
  };

  console.log('\nRunning benchmarks...\n');
  console.log('Mode             | Height | Width | Time (ms) |    FPS | Output Size');
  console.log('-----------------|--------|-------|-----------|--------|------------');

  for (const [mode, config] of Object.entries(RENDER_MODES)) {
    for (const height of OUTPUT_HEIGHTS) {
      const result = await runBenchmark(chafa, image, mode, config, height);
      results.benchmarks.push(result);

      const modeStr = mode.padEnd(16);
      const heightStr = String(height).padStart(6);
      const widthStr = String(result.outputWidth).padStart(5);
      const timeStr = result.median.toFixed(2).padStart(9);
      const fpsStr = result.fps.toFixed(1).padStart(6);
      const sizeStr = (result.outputSize / 1024).toFixed(1).padStart(7) + ' KB';

      console.log(`${modeStr} | ${heightStr} | ${widthStr} | ${timeStr} | ${fpsStr} | ${sizeStr}`);
    }
  }

  // Save results
  const resultsPath = join(__dirname, 'results-simd.json');
  writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${resultsPath}`);

  // Summary
  console.log('\n=== Summary ===');
  for (const mode of Object.keys(RENDER_MODES)) {
    const modeResults = results.benchmarks.filter(r => r.mode === mode);
    const avgFps = modeResults.reduce((a, r) => a + r.fps, 0) / modeResults.length;
    console.log(`${mode}: avg ${avgFps.toFixed(1)} FPS`);
  }

  // Compare with baseline if available
  const baselinePath = join(__dirname, 'results-baseline.json');
  if (existsSync(baselinePath)) {
    console.log('\n=== Comparison vs Baseline ===');
    const baseline = JSON.parse(readFileSync(baselinePath, 'utf-8'));

    for (const mode of Object.keys(RENDER_MODES)) {
      const simdResults = results.benchmarks.filter(r => r.mode === mode);
      const baselineResults = baseline.benchmarks.filter(r => r.mode === mode);

      const simdAvg = simdResults.reduce((a, r) => a + r.fps, 0) / simdResults.length;
      const baselineAvg = baselineResults.reduce((a, r) => a + r.fps, 0) / baselineResults.length;
      const speedup = simdAvg / baselineAvg;

      console.log(`${mode}: ${speedup.toFixed(2)}x (${baselineAvg.toFixed(1)} -> ${simdAvg.toFixed(1)} FPS)`);
    }
  }
}

main().catch(console.error);
