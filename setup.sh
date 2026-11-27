#!/usr/bin/env bash
# 一键复跑：安装依赖 → 构建（tsc + vite）→ 全量测试 → 变异自证 → MANIFEST 核对。
# 任何一步失败都退出非零；结果全部打印出来。
# 截图不由本脚本重跑（截图含浏览器渲染，每次字节可能不同，进 MANIFEST
# 后无法逐字节复核）；截图用 npm run screenshots 单独生成，见 README。
set -u
cd "$(dirname "$0")"

echo "=== 1/5 安装依赖（npm ci）==="
npm ci --no-audit --no-fund || { echo "ERROR: npm ci 失败" >&2; exit 1; }

echo "=== 2/5 构建（tsc + vite build）==="
npm run build || { echo "ERROR: 构建失败" >&2; exit 1; }

echo "=== 3/5 全量测试 ==="
npm test || { echo "ERROR: 测试未通过" >&2; exit 1; }

echo "=== 4/5 变异自证 ==="
npm run mutation || { echo "ERROR: 变异自证未通过" >&2; exit 1; }

echo "=== 5/5 核对 MANIFEST ==="
sha256sum -c MANIFEST || { echo "ERROR: MANIFEST 核对失败" >&2; exit 1; }

echo "SELFTEST: PASS"
exit 0
