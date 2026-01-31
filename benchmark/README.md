# SIMD Benchmark

Benchmark comparing baseline chafa-wasm vs SIMD-optimized build.

## Results

| Mode | Baseline FPS | SIMD FPS | Speedup |
|------|-------------|----------|---------|
| half-block-256 | 157 | 223 | **1.42x** |
| block-256 | 175 | 197 | **1.12x** |
| ascii-256 | 179 | 204 | **1.14x** |
| block | 178 | 193 | **1.08x** |
| braille | 285 | 299 | **1.05x** |

Test: 640x480 image, 20 iterations, various output sizes (12-120 rows).

## Running Benchmarks

```bash
cd benchmark
npm install

# Baseline (npm chafa-wasm)
node benchmark.js

# SIMD (local build from ../dist/)
node benchmark-simd.js
```

Results saved to `results-baseline.json` and `results-simd.json`.

## Key Finding: half-block-256 mode

For streaming/remote display, `half-block-256` mode is optimal:
- 42% faster with SIMD
- Smallest output size (2 bytes per cell with custom protocol)
- 120 rows = 320×240 = PS1 native resolution

## SIMD Implementation

See [monteslu/chafa](https://github.com/monteslu/chafa) fork:
- `chafa/internal/chafa-wasm-simd.c` - WASM SIMD128 intrinsics
- Optimized: `calc_cell_error`, `extract_mean_colors`, `color_accum_div`
- Guarded by `#ifdef HAVE_WASM_SIMD`, no impact on non-WASM builds
