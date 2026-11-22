<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.rb. -->
<!-- Regenerate with: ruby tools/ai-skill/lib/extract-design.rb | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDProgressRing 语义卡

Component: `WDProgressRing`
Spec: `docs/specs/01-basic.md` (number 16)
Contract: `contracts/WDProgressRing.yaml` (sha256 `9df7760a1c90b040558955524391dc62486c1dc82fbe140c5a939db419639fc6`)

## 用途（来自正式规格 §1）

环形进度。用于**需要强调的单一指标**，因为环比线占用更多视觉重量。

- **用**：一张卡片里的核心指标（本周家务完成度）、连续打卡
- **不要用**：一行里出现 3 个以上（视觉过载）；纯等待（用不确定态）

## 来源追溯

- `docs/specs/01-basic.md:1465`
- `docs/specs/01-basic.md:1467`
- `docs/specs/01-basic.md:1470`
- `docs/specs/01-basic.md:1469`
- `docs/specs/01-basic.md:1493`
- `docs/specs/01-basic.md:1497`
- `docs/specs/01-basic.md:1498`
- `docs/specs/01-basic.md:1499`
- `docs/specs/01-basic.md:1508`
- `docs/specs/01-basic.md:1510`
- `docs/specs/01-basic.md:1511`
- `docs/specs/01-basic.md:1512`
- `docs/specs/01-basic.md:1528`
- `docs/specs/01-basic.md:1530`
- `docs/specs/01-basic.md:1531`
- `docs/specs/01-basic.md:1532`
- `docs/specs/01-basic.md:1533`

## 状态（来自正式规格 §5）

- 状态=增长; 视觉=弧从 0 长到目标值; 动效=3200ms 缓出，数字同步递增（`docs/specs/01-basic.md:1497`）
- 状态=完成; 视觉=环色转 `status.success`; 动效=弹一下 + 成功触觉，只播一次（`docs/specs/01-basic.md:1498`）
- 状态=停滞; 视觉=环色降饱和到 70%; 动效=无（`docs/specs/01-basic.md:1499`）

## 内容（来自正式规格 §7）

- 环内数字不超过 4 个字符（"60%"、"3/5"、"完成"）（`docs/specs/01-basic.md:1510`）
- 环外必须有说明文字，环本身不解释自己代表什么（`docs/specs/01-basic.md:1511`）
- 计数模式的分子不超过分母（`docs/specs/01-basic.md:1512`）

## 无障碍（来自正式规格 §10）

- 作为整体朗读"本周家务，已完成 3 项，共 5 项，60%"（`docs/specs/01-basic.md:1530`）
- 环本身标记为装饰，信息由文字承担（`docs/specs/01-basic.md:1531`）
- 旋转的进度弧不触发持续播报，只在完成时播报一次（`docs/specs/01-basic.md:1532`）
- 环与轨道对比度 ≥ 3:1；环内数字与环内底色对比度 ≥ 4.5:1（`docs/specs/01-basic.md:1533`）

## 契约摘要（来自 YAML）

- params: 4
- slots: label, valueText
- enums: WDProgressRingSize

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
