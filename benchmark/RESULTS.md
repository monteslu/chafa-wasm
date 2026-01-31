# Benchmark Results

## System Information

| Property | Value |
|----------|-------|
| OS | Linux 6.17.0-8-generic (Ubuntu) |
| CPU | AMD Ryzen AI 9 HX PRO 370 w/ Radeon 890M |
| Node.js | v24.12.0 |
| Date | 2026-01-29 |

## Test Configuration

- **Image:** 640×480 PNG with varied patterns
- **Iterations:** 20 per measurement
- **Output sizes:** 12, 24, 48, 96, 120 terminal rows

---

## Summary: SIMD vs Baseline

| Mode | Baseline FPS | SIMD FPS | Speedup |
|------|-------------|----------|---------|
| block | 161.6 | 184.7 | **1.14x** |
| block-256 | 151.8 | 183.1 | **1.21x** |
| half-block | 176.7 | 211.7 | **1.20x** |
| **half-block-256** | 181.5 | 218.3 | **1.20x** |
| ascii | 160.9 | 189.0 | **1.17x** |
| ascii-256 | 161.2 | 198.5 | **1.23x** |
| braille | 266.5 | 273.7 | 1.03x |
| braille-dither | 230.7 | 241.0 | 1.04x |

**Average speedup: 14-23%** for color modes, 3-4% for braille.

---

## Detailed Results: Baseline (chafa-wasm npm)

| Mode | Height | Time (ms) | FPS | Output |
|------|--------|-----------|-----|--------|
| block | 12 | 1.89 | 530.0 | 10.5 KB |
| block | 24 | 5.04 | 198.3 | 40.4 KB |
| block | 48 | 17.83 | 56.1 | 169.8 KB |
| block | 96 | 70.66 | 14.2 | 604.5 KB |
| block | 120 | 107.00 | 9.3 | 883.8 KB |
| block-256 | 12 | 1.95 | 511.6 | 5.1 KB |
| block-256 | 24 | 5.97 | 167.6 | 18.0 KB |
| block-256 | 48 | 17.88 | 55.9 | 57.9 KB |
| block-256 | 96 | 68.18 | 14.7 | 160.2 KB |
| block-256 | 120 | 109.25 | 9.2 | 223.5 KB |
| half-block | 12 | 1.72 | 579.9 | 9.9 KB |
| half-block | 24 | 4.64 | 215.5 | 38.8 KB |
| half-block | 48 | 16.17 | 61.8 | 136.2 KB |
| half-block | 96 | 62.96 | 15.9 | 493.3 KB |
| half-block | 120 | 96.48 | 10.4 | 681.5 KB |
| half-block-256 | 12 | 1.67 | 599.7 | 3.7 KB |
| half-block-256 | 24 | 4.57 | 218.6 | 13.5 KB |
| half-block-256 | 48 | 15.91 | 62.9 | 45.9 KB |
| half-block-256 | 96 | 62.85 | 15.9 | 126.6 KB |
| half-block-256 | 120 | 97.31 | 10.3 | 178.3 KB |
| ascii | 12 | 1.89 | 528.9 | 10.6 KB |
| ascii | 24 | 5.16 | 193.8 | 40.6 KB |
| ascii | 48 | 17.57 | 56.9 | 155.2 KB |
| ascii | 96 | 65.52 | 15.3 | 551.1 KB |
| ascii | 120 | 104.63 | 9.6 | 756.5 KB |
| ascii-256 | 12 | 1.87 | 534.2 | 4.9 KB |
| ascii-256 | 24 | 5.18 | 192.9 | 16.4 KB |
| ascii-256 | 48 | 18.12 | 55.2 | 51.6 KB |
| ascii-256 | 96 | 69.59 | 14.4 | 149.3 KB |
| ascii-256 | 120 | 105.30 | 9.5 | 209.4 KB |
| braille | 12 | 1.27 | 789.0 | 0.4 KB |
| braille | 24 | 2.71 | 368.9 | 1.5 KB |
| braille | 48 | 8.18 | 122.2 | 6.0 KB |
| braille | 96 | 30.91 | 32.3 | 24.1 KB |
| braille | 120 | 49.34 | 20.3 | 37.6 KB |
| braille-dither | 12 | 1.40 | 713.9 | 0.4 KB |
| braille-dither | 24 | 3.27 | 306.2 | 1.5 KB |
| braille-dither | 48 | 10.85 | 92.2 | 6.0 KB |
| braille-dither | 96 | 41.00 | 24.4 | 24.1 KB |
| braille-dither | 120 | 60.13 | 16.6 | 37.6 KB |

---

## Detailed Results: SIMD Build

| Mode | Height | Time (ms) | FPS | Output |
|------|--------|-----------|-----|--------|
| block | 12 | 1.70 | 587.7 | 10.6 KB |
| block | 24 | 4.20 | 238.2 | 39.1 KB |
| block | 48 | 14.58 | 68.6 | 170.3 KB |
| block | 96 | 56.52 | 17.7 | 600.3 KB |
| block | 120 | 86.82 | 11.5 | 876.6 KB |
| block-256 | 12 | 1.69 | 592.7 | 5.1 KB |
| block-256 | 24 | 4.39 | 227.9 | 17.0 KB |
| block-256 | 48 | 15.10 | 66.2 | 58.0 KB |
| block-256 | 96 | 57.91 | 17.3 | 159.9 KB |
| block-256 | 120 | 89.36 | 11.2 | 223.2 KB |
| half-block | 12 | 1.45 | 688.3 | 10.3 KB |
| half-block | 24 | 3.85 | 259.7 | 38.8 KB |
| half-block | 48 | 13.02 | 76.8 | 144.7 KB |
| half-block | 96 | 50.12 | 20.0 | 487.8 KB |
| half-block | 120 | 73.24 | 13.7 | 696.3 KB |
| half-block-256 | 12 | 1.42 | 704.5 | 3.8 KB |
| half-block-256 | 24 | 3.64 | 275.0 | 13.7 KB |
| half-block-256 | 48 | 12.63 | 79.2 | 45.9 KB |
| half-block-256 | 96 | 49.85 | 20.1 | 125.3 KB |
| half-block-256 | 120 | 76.80 | 13.0 | 177.3 KB |
| ascii | 12 | 1.64 | 607.9 | 10.6 KB |
| ascii | 24 | 4.22 | 237.0 | 42.3 KB |
| ascii | 48 | 14.48 | 69.1 | 168.1 KB |
| ascii | 96 | 54.46 | 18.4 | 584.6 KB |
| ascii | 120 | 80.22 | 12.5 | 810.8 KB |
| ascii-256 | 12 | 1.57 | 637.1 | 5.0 KB |
| ascii-256 | 24 | 3.97 | 252.1 | 17.5 KB |
| ascii-256 | 48 | 13.68 | 73.1 | 51.5 KB |
| ascii-256 | 96 | 54.02 | 18.5 | 148.9 KB |
| ascii-256 | 120 | 83.93 | 11.9 | 210.5 KB |
| braille | 12 | 1.27 | 787.9 | 0.4 KB |
| braille | 24 | 2.54 | 393.2 | 1.5 KB |
| braille | 48 | 7.71 | 129.7 | 6.0 KB |
| braille | 96 | 28.50 | 35.1 | 24.1 KB |
| braille | 120 | 44.89 | 22.3 | 37.6 KB |
| braille-dither | 12 | 1.39 | 719.9 | 0.4 KB |
| braille-dither | 24 | 3.02 | 331.6 | 1.5 KB |
| braille-dither | 48 | 9.54 | 104.8 | 6.0 KB |
| braille-dither | 96 | 33.97 | 29.4 | 24.1 KB |
| braille-dither | 120 | 51.70 | 19.3 | 37.6 KB |

---

## Key Observations

1. **SIMD provides 14-23% speedup** for color modes (block, ascii, half-block)
2. **Braille modes see minimal improvement** (3-4%) - already optimized, less color computation
3. **half-block-256 is optimal for streaming** - fast, smallest output, 2 bytes/cell with custom protocol
4. **256-color modes** produce 4x smaller output than truecolor with negligible speed difference

## SIMD Implementation

Optimized functions in `chafa/internal/chafa-wasm-simd.c`:
- `chafa_calc_cell_error_wasm_simd` - processes 4 pixels at once
- `chafa_extract_cell_mean_colors_wasm_simd` - vectorized accumulation
- `chafa_color_accum_div_scalar_wasm_simd` - SIMD multiply-high

All changes guarded by `#ifdef HAVE_WASM_SIMD`, zero impact on non-WASM builds.
