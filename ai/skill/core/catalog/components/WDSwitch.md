<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDSwitch 语义卡

Component: `WDSwitch`
Spec: `docs/specs/01-basic.md` (number 5)
Contract: `contracts-digest.json#WDSwitch` (source `contracts/WDSwitch.yaml`, sha256 `7189a1ea57fc81d37f96b4658482df32bddc2b82c7b88a72ccc7606289413719`)

## 用途（来自正式规格 §1）

**即时生效**的布尔开关。拨动即写入，没有确认按钮。

- **用**：共享给家人、每日提醒、免打扰
- **不要用**：需要点"保存"才生效的设置（用 `WDCheckbox`）；二选一（用 `WDSegmentedControl` 或 Radio）；会触发不可逆操作的开关

## 来源追溯

- `docs/specs/01-basic.md:444,446,448,449,451,453,455,457,461,462,464,466,470,471,473,475,479,480,481,482,490,492,493,514,516,517,518,519,520`

## 设计者摘要

圆角 `radius.full`。

## 解剖（来自正式规格 §2）

- 轨道 + 滑块两段。轨道承担状态色，滑块承担位置。整行可点时，标签在左、开关在右。（`docs/specs/01-basic.md:455`）

## 尺寸（来自正式规格 §3）

- 档=标准; 轨道=51×31; 圆角=`radius.full`; 滑块直径=27（轨道高 − 4）; 行程=20（`radius.full` = 999）（`docs/specs/01-basic.md:461`）
- 档=紧凑; 轨道=40×24; 圆角=`radius.full`; 滑块直径=20; 行程=16（`radius.full` = 999）（`docs/specs/01-basic.md:462`）
- 滑块上下左右各留 2 的内边距。（`docs/specs/01-basic.md:464`）

## 变体（来自正式规格 §4）

- 变体=标准; 说明=只有标签（`docs/specs/01-basic.md:470`）
- 变体=带描述; 说明=标签下方一行 `type.footnote` 用 `text.secondary`，说明开关的后果（"关闭后不再收到推送"）（`type.footnote` = 13/18 · 400；`text.secondary` = 浅 #3E5764 / 深 #A4BCCB）（`docs/specs/01-basic.md:471`）
- 描述只在"用户不看清后果就会误操作"时使用，不是默认。（`docs/specs/01-basic.md:473`）

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

- searchAliases: 开关, 拨动开关, toggle, switch
- combinesWith: none
- pageRegions: form, collection-item

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
