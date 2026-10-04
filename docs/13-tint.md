# 13 · tint 配方与三级色映射 —— 设计师交付

> 回复：`10-review-summary.md` §6.1 前置条件第 3 项（§10.2-11）
> 状态：**定稿 v1.0（2026-10-04）**
> 方法：WCAG 2.1 相对亮度 + sRGB alpha 合成

---

## 0. 一句话

`tonal` 的底一直是一个**挑出来的 hex**（`#D5EBF6`），复算不出任何配方；而且规格里那 4 处 `tonal` / 已选 / shared **至今还写着 `gradient.surface`** —— 第一轮说"已改 2 处"其实没有落盘。

这一版把 tint 变成**一条配方 + 一个算出来的值**，并在 `build.js` 里加了逐年复算的守卫。

---

## 1. 结论先行（是 / 否）

| # | 问题 | 结论 |
| --- | --- | --- |
| **C1** | tint 值存在 `gradient.tint` 还是 `surface.tint`？ | **`surface.tint`。** `semantic.*.gradient` 是生成器保留给 `linear-gradient` 的通道，塞平色会让 `collectGradients()` 抛错 —— 与色晕是同一类坑 |
| **C2** | 基准底是 `surface.card` 还是 `bg.canvas`？ | **`surface.card`。** 理由见 §2.2 |
| **C3** | 配方是什么？ | **品牌蓝 `#1677B3` @ 16%，叠在 `surface.card` 上**（`surface.card` 自身先合成到 `bg.canvas`） |
| **C4** | 值由谁算？ | 配方是唯一真源，hex 由 `build.js` 的 `assertTintRecipe()` 逐年复算；对不上就构建失败 |
| **C5** | 三级阶梯单调吗？ | **是。** 浅色 0.557–0.424 / **0.794** / 0.927；深色 0.166–0.111 / **0.029** / 0.010 |
| **C6** | `tonal` 上的字用什么？ | **`text.on-soft`**（浅色 8.93:1 / 深色 8.47:1）。**不能用 `text.brand`** |

---

## 2. 配方与基准底

### 2.1 配方

```
surface.tint = 品牌蓝 #1677B3 @ 16% 叠在 surface.card 上
               （surface.card 自身先合成到 bg.canvas）
```

| 主题 | `surface.card` 合成后 | tint | L |
| --- | --- | --- | --- |
| 浅色 | `#FEFFFF`（`#FFFFFFF0` 叠 `#F1F8FA`） | **`#D9E9F3`** | 0.7942 |
| 深色 | `#112633`（`#132836D1` 叠 `#0A1B26`） | **`#123348`** | 0.0293 |

### 2.2 为什么基准底是 `surface.card` 而不是 `bg.canvas`

基准底决定"tonal 比**谁**重一档"。tonal 出现在卡片和浮层里，它的视觉邻居是卡片，不是页面底。两种取法的实测差：

| 基准底 | 浅色结果 | L | 与 `filled` 起点（0.5569）的空档 |
| --- | --- | --- | --- |
| **`surface.card`（采纳）** | `#D9E9F3` | **0.7942** | 0.237 |
| `bg.canvas` | `#CEE3EF` | 0.7446 | 0.188 |

取 `surface.card` 时，三级空档是 **0.20 / 0.24**（卡片 0.9956 → tonal → filled）；取 `bg.canvas` 变成 **0.25 / 0.19**，tonal 被压得偏重、与 filled 挤在一起。所以基准底必须是 `surface.card`。

---

## 3. 组件填充的三级阶梯（两端）

| 级 | 令牌 | 浅色 | 浅色 L | 深色 | 深色 L |
| --- | --- | --- | --- | --- | --- |
| 实 | `gradient.fill` | `#8FCFDD → #63BAD2` | 0.557 → 0.424 | `#1677B3 → #2A5CAA` | 0.166 → 0.111 |
| 中 | `surface.tint` | `#D9E9F3` | 0.794 | `#123348` | 0.029 |
| 无 | 透明 | — | canvas 0.927 | — | canvas 0.010 |

两端都单调、都有空档。深色端是"越实越亮"（canvas 最暗、filled 最亮），与浅色端方向相反但同样单调。

---

## 4. 三级色映射表（文字）

三级文字色只差 1.18 倍对比度（`secondary` 7.10:1 vs `tertiary` 6.04:1），**层级不能只靠颜色区分**。按"这条信息是不是必需"分工：

| 语义 | 色 | 字阶 | 例 |
| --- | --- | --- | --- |
| 主 | `text.primary` | headline 17 及以上 | 页面标题、列表主文案 |
| 次 | `text.secondary` | body 17 / callout 16 / subheadline 15 | 副标题、说明、表单标签 |
| 三级 | `text.tertiary` | footnote 13 / caption1 12 | 时间戳、计数、非交互元信息 |

两条约束：

1. **`text.tertiary` 只用于非必需信息** —— 用户不看它也不影响完成任务。
2. **占位符承载"该填什么"的必要信息时，用 `text.secondary`** —— 13 与 12 只差 1pt、颜色也接近，层级靠"是否必需"分工，而不是再压一档颜色。

已写入 [`01-foundation §4.3`](01-foundation.md)。

---

## 5. 改动清单

| 项 | 动作 | 影响面 |
| --- | --- | --- |
| `semantic.{light,dark}.surface.tint` | 新增（`#D9E9F3` / `#123348`） | 两端各 1 个新公开入口 → `apiDump` 同提交 |
| `build.js` | 新增 `assertTintRecipe()` | 每次生成与 `--check` |
| `01-foundation` | 新增 §3.7「组件填充的三级阶梯」+ §4.3 三级色映射表 | 文档 |
| `specs/01-basic.md` | `tonal` ×2（`:49`、`:162`）、Chip 已选（`:956`）、Badge shared（`:1050`）的 `gradient.surface` → **`surface.tint`** | 4 处 |

**没有改**：图标底座那几处继续用 `gradient.surface`（它们本来就是"背景层 / 图标底座"这个语义）。改完之后 `gradient.surface` 只剩这一个合法消费者，回到它的定义。

---

## 6. 顺带发现（待裁，不在本次改动内）

Badge 的 `pending` 变体不达标。`specs/01-basic.md:1051` 写的是 `surface.glass-strong` + `text.brand`，最不利口径下：

| 主题 | 最不利合成 | `text.brand` 在其上 |
| --- | --- | --- |
| 浅色 | `#DBDBDB`（glass-strong 叠纯黑） | **3.51 ❌** |
| 深色 | `#41515A`（glass-strong 叠纯白） | **4.19 ❌** |

这与 B22 的裁定同源（玻璃不承载彩色字）。而且 Badge 的其它状态变体（`success` / `warning` / `danger`）走的都是 `status-soft.*` + `status.*`，只有 `pending` 是例外。

**建议**：`pending` 改成 `status-soft.info` + `status-text.info`（浅色 5.89 ✅ / 深色 8.14 ✅），与其它变体统一。这条需要拍板，因为它改的是「进行中」这个状态的视觉表达。

---

## 7. 落盘结果（2026-10-04）

| 项 | 状态 |
| --- | --- |
| `surface.tint` ×2 | ✅ |
| `assertTintRecipe()` 守卫 | ✅ 自测过（改坏 1/255 即抛错） |
| `01-foundation` §3.7 + §4.3 | ✅ |
| `specs/01-basic.md` 4 处 | ✅ |
| 两端产物重新生成、`--check` | ✅ |

**至此 M0 的四项前置全部关闭。**

---

← 返回：[评审总览与开工决策](10-review-summary.md) ｜ [A2 深色 canvas](11-a2-dark-canvas.md) ｜ [B22 玻璃](12-b22-glass.md) ｜ [设计基础](01-foundation.md)
