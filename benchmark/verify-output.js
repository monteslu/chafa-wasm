#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Chafa constants
const CHAFA_CANVAS_MODE_TRUECOLOR = 0;
const CHAFA_CANVAS_MODE_256 = 1;
const CHAFA_CANVAS_MODE_FGBG = 5;

const CHAFA_SYMBOL_TAG_SPACE = 0x1;
const CHAFA_SYMBOL_TAG_BLOCK = 0x8;
const CHAFA_SYMBOL_TAG_BORDER = 0x10;
const CHAFA_SYMBOL_TAG_BRAILLE = 0x800;
const CHAFA_SYMBOL_TAG_ASCII = 0x4000;

const CHAFA_DITHER_MODE_NONE = 0;

const TEST_MODES = {
  'block': {
    symbols: CHAFA_SYMBOL_TAG_SPACE | CHAFA_SYMBOL_TAG_BLOCK | CHAFA_SYMBOL_TAG_BORDER,
    canvasMode: CHAFA_CANVAS_MODE_TRUECOLOR,
  },
  'block-256': {
    symbols: CHAFA_SYMBOL_TAG_SPACE | CHAFA_SYMBOL_TAG_BLOCK | CHAFA_SYMBOL_TAG_BORDER,
    canvasMode: CHAFA_CANVAS_MODE_256,
  },
  'braille': {
    symbols: CHAFA_SYMBOL_TAG_BRAILLE,
    canvasMode: CHAFA_CANVAS_MODE_FGBG,
  },
};

async function loadTestImage() {
  const imagePath = join(__dirname, 'test-image-640x480.png');
  const { data, info } = await sharp(imagePath)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

async function renderWithChafa(chafa, image, mode, config, height) {
  const aspectRatio = image.width / image.height;
  const width = Math.round(height * aspectRatio * 2);

  const symbolMap = chafa._chafa_symbol_map_new();
  chafa._chafa_symbol_map_add_by_tags(symbolMap, config.symbols);

  const canvasConfig = chafa._chafa_canvas_config_new();
  chafa._chafa_canvas_config_set_geometry(canvasConfig, width, height);
  chafa._chafa_canvas_config_set_canvas_mode(canvasConfig, config.canvasMode);
  chafa._chafa_canvas_config_set_symbol_map(canvasConfig, symbolMap);

  const dataPtr = chafa._malloc(image.data.length);
  chafa.HEAPU8.set(image.data, dataPtr);

  const canvas = chafa._chafa_canvas_new(canvasConfig);
  chafa._chafa_canvas_set_contents_rgba8(canvas, dataPtr, image.width, image.height, image.width * 4);
  const gsPtr = chafa._chafa_canvas_build_ansi(canvas);
  const strPtr = chafa._g_string_free_and_steal(gsPtr);
  const ansi = chafa.UTF8ToString(strPtr);

  chafa._free(strPtr);
  chafa._chafa_canvas_unref(canvas);
  chafa._free(dataPtr);
  chafa._chafa_canvas_config_unref(canvasConfig);
  chafa._chafa_symbol_map_unref(symbolMap);

  return ansi;
}

async function main() {
  const outputDir = join(__dirname, 'output-samples');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir);
  }

  console.log('Loading test image...');
  const image = await loadTestImage();

  // Test with baseline (npm chafa-wasm)
  console.log('\n=== Baseline (chafa-wasm from npm) ===');
  const initBaseline = (await import('chafa-wasm')).default;
  const baseline = await initBaseline();

  const baselineOutputs = {};
  for (const [mode, config] of Object.entries(TEST_MODES)) {
    const output = await renderWithChafa(baseline, image, mode, config, 48);
    const hash = createHash('md5').update(output).digest('hex');
    baselineOutputs[mode] = { output, hash };

    const filename = join(outputDir, `baseline-${mode}.txt`);
    writeFileSync(filename, output);
    console.log(`${mode}: ${hash} (${output.length} bytes) -> ${filename}`);
  }

  // Test with SIMD build (local)
  console.log('\n=== SIMD (local build) ===');
  const initSimd = (await import('./chafa.js')).default;
  const simd = await initSimd();

  const simdOutputs = {};
  for (const [mode, config] of Object.entries(TEST_MODES)) {
    const output = await renderWithChafa(simd, image, mode, config, 48);
    const hash = createHash('md5').update(output).digest('hex');
    simdOutputs[mode] = { output, hash };

    const filename = join(outputDir, `simd-${mode}.txt`);
    writeFileSync(filename, output);
    console.log(`${mode}: ${hash} (${output.length} bytes) -> ${filename}`);
  }

  // Compare
  console.log('\n=== Comparison ===');
  let allMatch = true;
  for (const mode of Object.keys(TEST_MODES)) {
    const match = baselineOutputs[mode].hash === simdOutputs[mode].hash;
    const status = match ? '✓ MATCH' : '✗ DIFFER';
    console.log(`${mode}: ${status}`);
    if (!match) {
      allMatch = false;
      console.log(`  Baseline: ${baselineOutputs[mode].hash}`);
      console.log(`  SIMD:     ${simdOutputs[mode].hash}`);
    }
  }

  console.log(`\nOutput samples saved to: ${outputDir}/`);

  if (allMatch) {
    console.log('\n✓ All outputs match! SIMD build is producing identical results.');
  } else {
    console.log('\n✗ Some outputs differ. Check the files for differences.');
  }
}

main().catch(console.error);
