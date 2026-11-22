<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDSwitch 语义卡

Component: `WDSwitch`
Spec: `docs/specs/01-basic.md` (number 5)
Contract: `contracts/WDSwitch.yaml` (sha256 `7189a1ea57fc81d37f96b4658482df32bddc2b82c7b88a72ccc7606289413719`)

## 用途（来自正式规格 §1）

**即时生效**的布尔开关。拨动即写入，没有确认按钮。

- **用**：共享给家人、每日提醒、免打扰
- **不要用**：需要点"保存"才生效的设置（用 `WDCheckbox`）；二选一（用 `WDSegmentedControl` 或 Radio）；会触发不可逆操作的开关

## 来源追溯

- `docs/specs/01-basic.md:444`
- `docs/specs/01-basic.md:446`
- `docs/specs/01-basic.md:451`
- `docs/specs/01-basic.md:448`
- `docs/specs/01-basic.md:449`
- `docs/specs/01-basic.md:475`
- `docs/specs/01-basic.md:479`
- `docs/specs/01-basic.md:480`
- `docs/specs/01-basic.md:481`
- `docs/specs/01-basic.md:482`
- `docs/specs/01-basic.md:490`
- `docs/specs/01-basic.md:492`
- `docs/specs/01-basic.md:493`
- `docs/specs/01-basic.md:514`
- `docs/specs/01-basic.md:516`
- `docs/specs/01-basic.md:517`
- `docs/specs/01-basic.md:518`
- `docs/specs/01-basic.md:519`
- `docs/specs/01-basic.md:520`

## 状态（来自正式规格 §5）

- 状态=关; 视觉=轨道 `border.hairline-strong`，滑块白; 动效=—; 触觉=—（`docs/specs/01-basic.md:479`）
- 状态=开; 视觉=轨道 `gradient.mid`，滑块白; 动效=轨道 260ms，滑块 300ms; 触觉=轻（`docs/specs/01-basic.md:480`）
- 状态=按下; 视觉=滑块临时放大到 1.06; 动效=100ms; 触觉=—（`docs/specs/01-basic.md:481`）
- 状态=禁用; 视觉=整体 40%，不响应; 动效=无; 触觉=无（`docs/specs/01-basic.md:482`）

## 内容（来自正式规格 §7）

- 标签 4–10 个汉字，动词或名词短语，不用疑问句（`docs/specs/01-basic.md:492`）
- 描述一行，最多 18 个汉字，超过换成两行说明文字而不是截断（`docs/specs/01-basic.md:493`）

## 无障碍（来自正式规格 §10）

- 角色为 `switch`，状态为"开"/"关"，读屏读"共享给家人，开，开关"（`docs/specs/01-basic.md:516`）
- 带描述时，描述并入朗读内容（`docs/specs/01-basic.md:517`）
- 触控热区 ≥ 44×44（`docs/specs/01-basic.md:518`）
- 开关状态**不能只靠颜色**表达，滑块位置是主要信号，颜色是辅助（`docs/specs/01-basic.md:519`）
- 禁用态标注为不可用，不可从无障碍树中移除（`docs/specs/01-basic.md:520`）

## 契约摘要（来自 YAML）

- params: 4
- slots: label
- enums: WDSwitchSize

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
