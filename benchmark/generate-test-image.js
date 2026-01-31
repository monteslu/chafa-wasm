#!/usr/bin/env node

import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Generate a 640x480 test image with varied content for benchmarking
// Includes: gradients, solid colors, patterns, noise - stress tests all conversion paths

async function generateTestImage() {
  const width = 640;
  const height = 480;

  // Create raw RGBA buffer
  const pixels = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;

      // Divide image into regions with different patterns
      const region = Math.floor(x / 160) + Math.floor(y / 120) * 4;

      let r, g, b;

      switch (region % 16) {
        case 0: // Red gradient
          r = Math.floor((x / 160) * 255);
          g = 0;
          b = 0;
          break;
        case 1: // Green gradient
          r = 0;
          g = Math.floor((x % 160 / 160) * 255);
          b = 0;
          break;
        case 2: // Blue gradient
          r = 0;
          g = 0;
          b = Math.floor((x % 160 / 160) * 255);
          break;
        case 3: // Grayscale gradient
          r = g = b = Math.floor((x % 160 / 160) * 255);
          break;
        case 4: // Checkerboard
          const check = ((Math.floor(x / 8) + Math.floor(y / 8)) % 2);
          r = g = b = check ? 255 : 0;
          break;
        case 5: // Rainbow horizontal
          const hue = (x % 160) / 160;
          [r, g, b] = hslToRgb(hue, 1, 0.5);
          break;
        case 6: // Noise
          r = Math.floor(Math.random() * 256);
          g = Math.floor(Math.random() * 256);
          b = Math.floor(Math.random() * 256);
          break;
        case 7: // Vertical stripes
          const stripe = Math.floor(x / 10) % 3;
          r = stripe === 0 ? 255 : 0;
          g = stripe === 1 ? 255 : 0;
          b = stripe === 2 ? 255 : 0;
          break;
        case 8: // Diagonal gradient
          const diag = ((x % 160) + (y % 120)) / 280;
          r = Math.floor(diag * 255);
          g = Math.floor((1 - diag) * 255);
          b = 128;
          break;
        case 9: // Circles
          const cx = (x % 160) - 80;
          const cy = (y % 120) - 60;
          const dist = Math.sqrt(cx * cx + cy * cy);
          const ring = Math.floor(dist / 15) % 2;
          r = ring ? 255 : 100;
          g = ring ? 200 : 50;
          b = ring ? 100 : 200;
          break;
        case 10: // Plasma-like
          const px = Math.sin(x / 20) * 127 + 128;
          const py = Math.sin(y / 15) * 127 + 128;
          r = Math.floor((px + py) / 2);
          g = Math.floor(Math.abs(px - py));
          b = Math.floor(255 - r);
          break;
        case 11: // Color blocks
          const bx = Math.floor((x % 160) / 40);
          const by = Math.floor((y % 120) / 30);
          r = (bx * 85) % 256;
          g = (by * 85) % 256;
          b = ((bx + by) * 60) % 256;
          break;
        case 12: // Fine dither pattern
          const dith = (x + y) % 2;
          r = dith ? 200 : 100;
          g = dith ? 150 : 180;
          b = dith ? 100 : 150;
          break;
        case 13: // Skin tones (good for testing color accuracy)
          const skin = (x % 160) / 160;
          r = Math.floor(180 + skin * 60);
          g = Math.floor(120 + skin * 80);
          b = Math.floor(80 + skin * 60);
          break;
        case 14: // High contrast edges
          const edge = (x % 20 < 2 || y % 20 < 2);
          r = edge ? 255 : 20;
          g = edge ? 255 : 20;
          b = edge ? 255 : 20;
          break;
        case 15: // Retro game colors (NES-like palette)
          const nesColors = [
            [0,0,0], [255,0,0], [0,255,0], [0,0,255],
            [255,255,0], [255,0,255], [0,255,255], [255,255,255],
            [128,0,0], [0,128,0], [0,0,128], [128,128,0]
          ];
          const nesIdx = (Math.floor(x / 13) + Math.floor(y / 10)) % nesColors.length;
          [r, g, b] = nesColors[nesIdx];
          break;
        default:
          r = g = b = 128;
      }

      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
      pixels[i + 3] = 255;
    }
  }

  // Save as PNG
  const outPath = join(__dirname, 'test-image-640x480.png');
  await sharp(pixels, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(outPath);

  console.log(`Generated: ${outPath}`);
}

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

generateTestImage().catch(console.error);
