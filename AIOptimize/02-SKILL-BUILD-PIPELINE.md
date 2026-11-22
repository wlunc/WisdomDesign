# WisdomDesign Skill 生成流水线实施方案

> 状态：**方案待评审，未批准实施**。
> 日期：2026-11-21。
> 本文只定义实施方案，不代表生成器、平台 Provider、模板、CI 或正式 Skill 包已经落地。
> 上游现状评审与跨端架构原则见 [优化方案](README.md)；任务拆解见 [开发计划](03-DEVELOPMENT-PLAN.md)。

---

## 0. 一句话方案

> **把当前多仓项目作为 Skill 的编译输入与验证环境，通过可复现流水线，将设计真源、平台公开 API、能力画像和原生黄金页面编译成按版本分发、按需加载、可验证的 Core + 平台 Skill 包。**

不是手工维护一个巨大的 `SKILL.md`，也不是让模型在运行时猜测组件 API。

```text
设计仓 + iOS 仓 + Android 仓
              ↓
      Extract → Normalize → Resolve
              ↓
      Render → Package → Verify
              ↓
          Evaluate → Publish
              ↓
Core Skill + iOS Provider + Android Provider + 质量报告
```

---

## 1. 当前项目基线与约束

### 1.1 已核对的项目事实

| 项目 | 当前事实 | 对流水线的影响 |
| --- | --- | --- |
| 设计组件 | 37 份 `contracts/WD*.yaml`，规格覆盖 37 个组件与 R1–R5 配方 | 组件语义以设计契约为准，不从旧 `02-components.md` 抄清单 |
| 组件规格 | 每个正式组件有「用途 / 反例 / 状态 / 内容 / 无障碍 / 验收」等章节 | 用途与反例优先提取，不另抄 37 份用途真源 |
| Token | 当前 `tokens/wisdom.tokens.json` 为 v1.1.0，含 light / dark schemes | Skill manifest 必须记录 Token 版本和内容哈希 |
| iOS | SwiftUI，已有公开 symbol/API 快照、Demo 组合与原生测试体系 | API 卡以真实公开符号为主，YAML 只补 canonical 语义 |
| Android | Jetpack Compose，已有真实组件源码、ABI `.api` 基线与 Gradle 门禁 | 按实际实现覆盖生成 Provider，不假设 37 个组件全部可用 |
| Android 平台 | 当前构建配置为 compileSdk 36 / minSdk 24 | capability profile 从构建配置提取，不能照抄 iOS 能力 |
| Web | 当前没有与双端对等、已验收的 Web 组件实现 | 只保留 Provider SPI；不能宣称支持 Web 代码生成 |
| 现有工具 | Token 与 contracts 已有独立检查工具 | 新流水线复用真源，不接管或重写现有组件库门禁 |

### 1.2 工作区与版本纪律

- 构建必须记录各输入仓的 commit、工作区 dirty 状态及内容哈希。
- dirty 工作区生成的是 **workspace snapshot**，不能冒充某个已发布组件库版本。
- iOS 在本次方案调研前已有其他未提交修改；本方案实施时不得覆盖或混入这些修改。
- 跨仓修改由对应仓所有者分别提交；流水线只读其它仓，不越权自动改真源。
- 所有未执行的编译、快照、UI 或真机测试必须写「未验证」。

### 1.3 核心设计约束

1. 设计语义跨端统一，平台实现保持原生；
2. 组件选择索引与平台 API 卡分离；
3. Page Spec 是设计与交换契约，不是跨端 UI 虚拟机；
4. 模板由确定性工具复制，模型只实现业务差异；
5. 平台支持状态由验证结果决定；
6. 缺实现、缺映射或缺验证时显式降级，不自动编造；
7. 构建结果可复现，所有生成物禁止手改。

---

## 2. 目标与非目标

### 2.1 目标

- 一个统一 AI 入口，支持设计、单平台实现和跨端实现三种模式；
- Core 设计语义与平台实现解耦；
- 自动生成轻量组件目录、组件语义卡、平台 API 卡和平台能力画像；
- 生成 Core、iOS、Android、All 四种目录包；
- 提供结构化 Page Spec 校验、精确查询、脚手架与验证工具；
- 用真实消费方工程验证模板与生成结果；
- 通过固定任务集测量 Token、API 幻觉、编译和设计质量；
- 发布带版本、来源和验证状态的可复现产物。

### 2.2 非目标

- 不实现跨端运行时 UI 框架；
- 不追求 iOS / Android 函数签名完全相同；
- 不追求跨端像素级一致；
- 不用向量检索替代精确 API 查询；
- 不把业务页面模板加入 WisdomUI 发布组件库；
- 不在首版自动修改业务 App 的导航、依赖或工程配置；
- 不在首版建设 MCP 服务或复杂 RAG 基础设施；
- 不因为 YAML 中存在组件契约就生成未经验证的平台实现；
- 不在本阶段修改现有视觉真源或实现 37 个缺失平台组件。

---

## 3. 总体架构与职责边界

### 3.1 构建时与运行时分离

| 阶段 | 负责者 | 工作内容 |
| --- | --- | --- |
| 构建时 | WisdomDesign 流水线 | 读取真源、解析版本、生成 Skill、执行验证、打包 |
| 使用时 | 生成的 Skill | 路由任务、按需检索、复制模板、引导模型、调用验证 |
| 业务实现时 | AI + 消费方工程 | 只修改业务数据、状态、文案、动作与组件组合 |
| 验收时 | 平台工具链 + 设计评审 | 分别证明结构、编译、运行时和设计质量 |

流水线对应四层产物：

```text
L0 设计真源
   tokens / components / layout / a11y / content
                ↓
L1 跨端页面语义层
   Page Spec：导航、信息架构、状态、操作、组件语义
                ↓
L2 平台能力适配层
   capability profile + 平台 API cards + 原生页面模板
                ↓
L3 原生工程与验收层
   SwiftUI / Compose / Web ...
   编译、测试、截图、交互、无障碍
```

L0 和 L1 提供跨端共享语义，L2 和 L3 保持平台真实能力。构建时不把 Swift / Kotlin 调用写入 Page Spec，运行时不强迫消费方 App 加载 Page Spec。

### 3.2 仓库职责

#### `wisdomdesign/`：构建主仓

拥有：

- Page Spec schema；
- 跨端组件语义提取；
- 设计规则与页面配方；
- Provider SPI 与版本兼容规则；
- 构建编排、渲染、打包和反漂移；
- Skill 包结构检查；
- 跨端评测任务与报告。

不拥有：

- Swift / Kotlin 公开 API 的解释权；
- 原生组件实现细节；
- 平台构建门禁的替代实现。

#### `iOS/`：iOS Provider 所有者

拥有：

- iOS capability profile；
- 公开符号提取适配器；
- SwiftUI API 卡补充元数据；
- 原生模板源与最小调用例；
- iOS 模板编译、快照和 UI 验证入口。

#### `android/`：Android Provider 所有者

拥有：

- Android capability profile；
- Compose API 提取适配器；
- Kotlin / Compose API 卡补充元数据；
- 原生模板源与最小调用例；
- Android 编译、ABI、截图和 UI 验证入口。

#### 消费方 App / AIStarter

拥有：

- 业务导航与依赖；
- 页面模板的消费侧编译；
- 业务状态和数据契约；
- 黄金页面与生成页面测试；
- 最终可维护性评审。

---

## 4. 源目录与生成目录

以下均为**拟新增结构，当前未创建**。

### 4.1 设计仓源目录

```text
wisdomdesign/
├── ai/
│   └── skill/
│       ├── pipeline.config.json
│       ├── SKILL.md.template
│       ├── page-spec/
│       │   ├── schema.json
│       │   └── examples/
│       ├── page-patterns/
│       ├── component-overlays/
│       ├── recipes/
│       ├── runtime/
│       │   ├── get-component.js
│       │   ├── get-api-card.js
│       │   ├── scaffold-page.js
│       │   └── validate-spec.js
│       └── evaluation/
│           ├── tasks.json
│           └── fixtures/
│
├── tools/
│   └── ai-skill/
│       ├── cli.js
│       ├── lib/
│       │   ├── extract-design.js
│       │   ├── extract-contracts.js
│       │   ├── load-provider.js
│       │   ├── resolve-version.js
│       │   ├── render-skill.js
│       │   ├── validate-bundle.js
│       │   ├── verify-template.js
│       │   └── package-skill.js
│       └── tests/
│
└── dist/
    └── ai-skill/              # 生成物，禁止手改
```

`component-overlays` 只允许补充检索关键词、组合关系、页面区域等现有真源没有的语义，不复制参数和视觉数值。

### 4.2 平台仓 Provider 源目录

```text
<platform-repo>/
├── ai/
│   └── skill-provider/
│       ├── provider.json
│       ├── capabilities.json
│       ├── component-overlays/
│       ├── templates/
│       ├── examples/
│       └── verification.json
└── <现有构建系统中的 Provider 导出入口>
```

`provider.json` 只声明适配器、版本与验证入口；API 数据从真实源码 / 符号工具生成，不在 Provider 文档中另抄一份。

### 4.3 生成包目录（与 R12 实现对齐）

```text
dist/ai-skill/<skill-version>/
├── wisdom-page-core/              # 必有：单仓 checkout 也能构建
│   ├── SKILL.md
│   ├── catalog/                   # 37 张语义卡 + catalog.md + manifest.json
│   ├── page-spec/                 # schema + examples
│   ├── runtime/                   # validate-spec.js / get-component.js / README
│   ├── component-overlays/        # 检索元数据（含 alias）
│   ├── build-info.json            # residentBytes / 预算依据 / inputs
│   ├── files.json                 # 逐文件 SHA-256（含 LICENSE-NOTICE.txt）
│   ├── manifest.json              # 对 M0 manifest.schema.json 0 错
│   └── LICENSE-NOTICE.txt
├── wisdom-page-ios/               # 可选：iOS 平台仓可用且被选入时
├── wisdom-page-android/           # 可选
├── wisdom-page-all/               # 可选：同时构建 ios+android 时
├── packages/                      # 按实际构建的包集生成 ZIP
│   ├── wisdom-page-core.zip
│   └── ...
└── checksums.json                 # ZIP 哈希 + 各包 manifest/files.json 自指哈希
```

- **没有 `reports/` 目录**：机器报告落 `tools/ai-skill/reports/m4-ci-result.json`（CI artifact）、每包 `build-info.json` 与 `files.json`、以及顶层 `checksums.json`；不存在 `build-report/verification-report/evaluation-report` 这些历史设计稿文件。
- **单仓 core-only**：标准 checkout 没有同级 iOS / android 时，`python3 tools/ai-skill/package.py --platforms core` 只产出 Core 包，manifest 只记录 wisdomdesign 来源（不伪造平台 commit）。
- **full**：`--platforms core,ios,android` 且平台仓通过 `--ios-root/--android-root` 或 `WISDOMDESIGN_*_ROOT` 或同级目录提供；缺失时以清晰非零退出提示，不静默降级。

每个可加载包都有独立 `SKILL.md`、`manifest.json` 和 `files.json`。All 包复用 Core 和平台包内容，不形成第五份真源。

---

## 5. 四种发布产物

| 产物 | 包含 | 允许任务 |
| --- | --- | --- |
| Core | 组件语义、Page Spec、页面模式、跨端校验 | 设计分析、跨端交接、spec-only 平台 |
| iOS | Core + iOS capability / API / 模板 / 验证 | 设计分析与 SwiftUI 页面生成 |
| Android | Core + Android capability / API / 模板 / 验证 | 设计分析与 Compose 页面生成 |
| All | Core + 所有选定 Provider | 同一 Page Spec 的多端分别实现与验证 |

首版提供通用目录包和 ZIP 包。具体宿主的自动安装器作为独立 adapter，确认该宿主正式 Skill 加载契约后再实现；不能假设把目录复制到某处就会被所有 AI 工具自动识别。

---

## 6. 流水线详细设计

### 6.1 Extract：只读提取

#### 设计输入

| 来源 | 提取结果 |
| --- | --- |
| `tokens/wisdom.tokens.json` | 版本、schemes、语义键摘要、平台映射引用 |
| `contracts/*.yaml` | canonical 组件、参数语义、slots、defaults、enums |
| `docs/specs/01-basic.md`、`02-advanced.md`、`03-patterns.md` | 组件编号、用途、反例、状态、内容、验收 |
| `docs/09-layout.md` | 导航骨架、间距关系、密度与多设备规则 |
| `docs/06-accessibility.md`、`07-content.md` | 跨端硬门槛与内容规则 |
| 人工 overlay | 搜索别名、组合建议、页面区域、设计评审标签 |

不读取 HTML 画廊作为规范；不读取历史评审文档生成结论。

#### 平台输入

| 平台 | 权威输入 | 辅助输入 |
| --- | --- | --- |
| iOS | 编译后的 `swift-symbolgraph` / 公开 API 快照 | Swift 源码、编译验证过的调用例、YAML 语义 |
| Android | Kotlin 公开声明 + 编译后的 ABI `.api` 交叉核对 | 编译验证过的 Composable 示例、YAML 语义 |

Android 二进制 `.api` 不能单独恢复所有 Kotlin 默认值与 Composable 源码形态，因此首版适配器必须明确证据来源。只做文本发现而未编译验证的签名标 `discovered`，不能标 `verified`。

### 6.2 Normalize：归一语义，不归一调用

统一：

- canonical component ID；
- 组件用途、反例和分类；
- 变体与状态语义；
- 内容、交互与无障碍意图；
- 页面区域与组合关系。

不统一：

- Swift / Kotlin 参数标签；
- Binding / Compose 状态类型；
- View / Modifier / Composable 形态；
- 构造函数、重载与默认值；
- 平台导航和系统返回；
- 单位与平台尺寸行为。

同一事实只保留一个权威来源，归一结果记录 `sourceRefs`，方便追溯。

### 6.3 Resolve：版本与覆盖解析

构建前解析：

- Skill 版本与 Page Spec schema 版本；
- Token 版本与哈希；
- Contracts 内容哈希；
- iOS / Android 组件库版本与 Provider 哈希；
- 模板兼容范围；
- 宿主 Skill 格式版本；
- 实际组件与验证覆盖。

处理原则：

| 情况 | 处理 |
| --- | --- |
| 设计有、平台无实现 | `spec-only`，不返回虚构 API |
| 有实现、API 提取成功、未编译示例 | `experimental` |
| 有实现、示例与模板编译通过 | 可进入 `verified` 候选 |
| 有编译、缺规定运行时矩阵 | 不得标完全 `verified` |
| Provider / Token / Contract 不兼容 | 构建失败 |
| dirty 工作区 | 允许本地快照，禁止伪装 release |

### 6.4 Render：生成面向 AI 的视图

生成物包括：

- 薄 `SKILL.md`；
- 一页一组件的语义卡；
- 一页一平台组件的 API 卡；
- 组件选择目录；
- Page Spec schema 和按需参考；
- 平台 capability profile；
- 模板 manifest 和经过脱敏的原生模板；
- 确定性运行时脚本；
- 支持矩阵和未验证项。

所有生成文件带统一 banner 和来源信息；模型使用文件时不需读取构建器源码。

### 6.5 Package：确定性打包

要求：

- 文件路径排序稳定；
- JSON 使用稳定键序与统一换行；
- ZIP 文件时间戳固定；
- 不包含绝对路径、机器名、临时目录或当前时间；
- 不包含 `.git`、`.build`、Gradle 缓存和测试派生物；
- 不包含用户业务密钥、签名、local.properties；
- 提供逐文件和整包 SHA-256；
- 同输入、同配置、同工具版本应产生相同包哈希。

### 6.6 Verify：结构、反漂移与原生验证

`check` 在临时目录重新构建并比较，不覆盖正式产物：

1. 源文件可解析；
2. canonical 组件集合与 YAML 完全一致；
3. 规格章节和组件映射完整；
4. Page Spec 自身示例通过；
5. Provider 只声明真实存在的能力；
6. API 卡可以追溯来源；
7. 运行时工具正反例通过；
8. 模板 manifest 与文件一致；
9. 生成包无死链、无越界路径、无敏感文件；
10. 可复现构建无差异；
11. 按变更范围执行原生模板验证。

### 6.7 Evaluate：真实 AI 任务评测

固定模型、推理参数、宿主、任务输入和工具版本，执行：

- 无 Skill 的现有方式基线；
- 只给精简规则文档的方式；
- 生成 Skill 的方式。

每组保留：

- 模型与参数；
- 输入与输出；
- 工具调用日志；
- Token / 缓存统计；
- 编译错误与修复轮次；
- 最终 diff；
- 自动测试与设计评审结果。

样本不足时只报告观察值，不写普遍性的百分比承诺。

### 6.8 Publish：版本化发布

发布物必须包含：

- 包版本和变更说明；
- 输入 commit / dirty / hash；
- 支持矩阵；
- 验证报告；
- 未验证项；
- 安装与升级说明；
- checksums。

只有验证门槛满足才可把平台标为 `verified`；发布动作需单独明确批准。

---

## 7. Provider SPI

### 7.1 Provider 声明

建议字段：

```json
{
  "schemaVersion": "1.0",
  "id": "ios",
  "displayName": "SwiftUI",
  "library": "WisdomUI",
  "libraryVersion": "…",
  "source": {
    "repository": "…",
    "commit": "…",
    "contentHash": "…"
  },
  "adapters": {
    "api": "…",
    "tokens": "…",
    "templates": "…",
    "verify": "…"
  },
  "capabilities": "capabilities.json",
  "status": "experimental"
}
```

状态由构建器根据证据重新计算，Provider 不能仅通过填写 `verified` 自我认证。

### 7.2 能力画像

每个 Provider 至少声明：

| 能力组 | 必填内容 |
| --- | --- |
| runtime | 最低 OS / SDK、语言、UI 框架、构建工具 |
| navigation | 页面堆栈、系统返回、模态与状态恢复 |
| layout | Safe Area / Insets、尺寸类别、横屏、分屏 |
| typography | 字体缩放、自然行高、大字体降级 |
| input | 键盘、焦点、触控目标、手势冲突 |
| accessibility | 读屏、焦点、对比度、减少动态 / 透明度 |
| rendering | 玻璃、阴影、动画、效果配额和降级 |
| verification | 编译、单测、快照、UI、真机命令与未验证项 |

能力值从构建配置和真实实现提取；论证文档只能补充，不得覆盖代码事实。

### 7.3 API 卡证据等级

| 等级 | 证据 | 可否指导代码生成 |
| --- | --- | --- |
| contract-only | 只有 YAML 语义 | 否，只能做设计描述 |
| discovered | 从公开源码 / ABI 发现 | 可以辅助，但必须显式提示未编译 |
| example-compiled | 最小调用例编译通过 | 可以，限于该调用形态 |
| template-verified | 原生模板及规定测试通过 | 可以，作为首选示例 |

---

## 8. Page Spec 契约

### 8.1 定位

Page Spec 用于：

- 跨端设计交接；
- 页面结构检查；
- 平台分别映射；
- 测试意图和设计评审。

Page Spec 不用于：

- 在 App 运行时渲染所有平台；
- 描述每个平台全部 API；
- 强迫所有单平台小修改先生成完整 DSL；
- 取代业务数据模型或状态管理。

### 8.2 最小结构

```json
{
  "schemaVersion": "1.0",
  "page": {
    "id": "task-list",
    "intent": "查看并管理家庭任务",
    "navigation": "tabRoot",
    "contentPattern": "collection",
    "primaryAction": "createTask"
  },
  "states": [
    { "id": "loading", "kind": "loading" },
    { "id": "content", "kind": "content" },
    { "id": "empty", "kind": "empty" },
    { "id": "error", "kind": "error" }
  ],
  "regions": [
    {
      "id": "tasks",
      "kind": "collection",
      "component": "ListSection",
      "itemPattern": "TaskRow"
    }
  ],
  "accessibility": {
    "title": "家庭任务"
  },
  "acceptance": [
    "空列表显示可执行的空状态",
    "底部内容不被 Tab 栏遮挡"
  ],
  "overrides": {}
}
```

### 8.3 校验原则

- 未知字段和未知组件默认失败；
- canonical 名称区分大小写；
- 页面必须有用户意图、导航、内容模式和状态；
- 集合页面必须考虑空态；
- 主操作最多一个；
- `overrides` 不能改写共享设计意图；
- 校验器只证明结构，不证明视觉或原生编译；
- 错误包含 JSON path、错误码、说明和修复建议，供模型有限轮次自修。

---

## 9. Skill 运行时设计

### 9.1 薄入口

`SKILL.md` 只包含：

1. 触发范围与不适用范围；
2. 三种模式选择；
3. 平台 / 版本识别；
4. Page Brief；
5. 按需加载规则；
6. 脚手架与业务修改边界；
7. 验证闭环；
8. 不确定、不兼容和未验证时的停止条件。

组件目录、API、平台细节和完整 Page Spec 文档全部按需读取。

### 9.2 三种模式

#### Design

```text
需求 → Page Brief → Page Spec → 跨端结构校验 → 设计评审
```

不加载平台 API。

#### Single Platform

```text
需求 → 页面模式 → 目标 Provider → 精确 API → 原生模板
     → 业务差异 → 平台验证
```

Page Spec 按需生成，不强制作为中间文件。

#### Cross Platform

```text
Page Spec
  ├── iOS Provider → SwiftUI → iOS 验证
  └── Android Provider → Compose → Android 验证
```

禁止从一端生成代码后机械翻译成另一端。

### 9.3 确定性工具

| 工具 | 输入 | 输出 / 行为 |
| --- | --- | --- |
| `get_component` | canonical 名称或关键词 | 单个语义卡或有限候选，不返回整库 |
| `get_api_card` | 平台 + 组件 + 库版本 | 单张真实 API 卡及证据等级 |
| `scaffold_page` | 平台 + 模板 + 目标路径 + 页面名 | 复制模板并做受控标识符替换 |
| `validate_spec` | Page Spec 文件 | 结构化 errors / warnings |
| `validate_page` | 平台 + 工程路径 | 调用平台已有验证入口并汇总结果 |

`scaffold_page` 默认拒绝覆盖已有文件；目标必须位于调用方明确指定的工程目录。它不能自行改包依赖、签名、导航或构建脚本。

### 9.4 Token 控制

- 常驻入口只保留路由和硬规则；
- 组件目录短行返回，不全量加载语义卡；
- 只加载当前平台；
- 只加载本次组件 API；
- 工具复制骨架，模型不重复输出；
- 修改已有页面只输出局部 diff；
- 构建错误只返回相关错误与有限源码片段；
- 自动修复轮次有上限；
- 稳定上下文按版本缓存；
- 统计端到端成本，而非只统计 `SKILL.md` 大小。

---

## 10. 原生模板与黄金页面

### 10.1 模板选择模型

导航骨架：

- Tab 一级页；
- 二级详情页；
- 模态 / 弹层任务。

内容模式：

- 概览；
- 列表与筛选；
- 详情；
- 表单；
- 空态 / 新手引导；
- 加载与失败恢复。

首版每端只选择一个黄金页面完成闭环，再逐步扩充，不一开始生成四套未经验证模板。

### 10.2 黄金页面最低状态

```text
loading / content / empty / error
默认字体 / 大字体
浅色 / 深色
短内容 / 长内容
```

按页面类型增加：键盘、焦点、RTL、横屏 / 分屏、滚动、返回与状态恢复。

### 10.3 验证不等于静态扫描

| 层级 | 证明内容 |
| --- | --- |
| Spec / lint | 页面语义、组件存在性、允许的结构 |
| 原生编译 | 真实 API、类型、泛型、状态、平台版本 |
| 快照 / UI | 视觉、遮挡、键盘、焦点、读屏和交互 |
| 人工设计评审 | 信息架构、业务合理性、视觉重量与内容质量 |

前一层通过不能替代后一层。

---

## 11. CLI 契约（与 R12 实现对齐）

实际命令（`wisdomdesign/tools/ai-skill/`）；**不存在** `pack` / `verify-templates` / `evaluate` 子命令——打包在 `package.py`，模板验证属平台仓 CI，评测在 `eval/run.js`。

```bash
# Core 包：设计真源 -> 目录包（平台仓仅作来源出处，可选）
node tools/ai-skill/cli.js build [--out <dir>] [--ios-root ../iOS] [--android-root ../android]

# 临时目录重建 + 结构与反漂移检查（不覆盖正式产物）
node tools/ai-skill/cli.js check

# 流水线自身与运行时正反例（含打包布局 runtime、超预算负例）
node tools/ai-skill/cli.js test

# 确定性四类包 + ZIP + checksums（与 cli.js 共用 lib/manifest.js）
python3 tools/ai-skill/package.py --platforms core                 # 单仓 checkout
python3 tools/ai-skill/package.py --platforms core,ios,android \
  --ios-root ../iOS --android-root ../android                     # full

# 已构建包审计（manifest schema / 文件计数 / 哈希 / ZIP / 包内 runtime / 预算）
node tools/ai-skill/tests/dist-package.test.js --platforms core,ios,android

# CI 辅助（单仓可运行）
node tools/ai-skill/ci/route-changes.js --paths-file changed-files.txt --require-paths --out plan.json
node tools/ai-skill/ci/check-native-layers.js --plan plan.json [--ios-root ../iOS --android-root ../android] [--strict-evidence]
node tools/ai-skill/ci/release-gate.js --dist dist/ai-skill/v1.0.0

# M5 评测 harness（真实评测需 readiness exit 0；当前 5 个 blocker）
node tools/ai-skill/eval/run.js --check-readiness
node tools/ai-skill/eval/run.js --report
```

要求：

- 无参数不隐式写其它仓；未提供平台仓时 Core 构建/打包仍可完成，full 打包以清晰非零退出提示 checkout / `--*-root`，不再假设三仓同级；
- CLI `build/check/test` 只负责 Core；平台载荷打包在 `package.py`，模板验证在平台仓 CI，评测在 `eval/run.js`；
- 路径来自参数、环境变量（`WISDOMDESIGN_IOS_ROOT` / `WISDOMDESIGN_ANDROID_ROOT`）或同级 workspace 布局；
- 所有失败以非零退出码返回；
- 机器报告输出 JSON，人类摘要不替代原始报告；
- `check` 不写平台源码、不更新 ABI / API 基线；
- 真实模型评测与只读检查分离（`eval/run.js`），因为它会调用模型并产生成本；
- 单套 manifest：`tools/ai-skill/lib/manifest.js`，写入前对 M0 schema 校验；
- 发布不是默认命令的隐式步骤。

技术选型建议：Node.js 标准库负责编排、JSON、哈希与测试；YAML 通过现有 Ruby 标准库适配器读取，**不手写 YAML 解析器**。首版不引入 npm 运行时依赖。若未来替换为经过评审的解析库，Provider SPI 与产物格式不变。

---

## 12. CI 与变更触发

### 12.1 每次相关 PR（单仓 checkout 可运行）

- Core 提取与 Page Spec 检查；
- 运行时正反例；
- 包结构、死链和路径安全（跨仓证据链接 `../../iOS/...` 在无平台仓时记为 cross-repo/unverifiable，不计死链；审计下限按源文档计，不依赖生成 dist）；
- 可复现 `check`；
- 来源、版本和 coverage 报告；
- `SKILL.md` 常驻预算检查；
- 打包/复现层默认 **core-only**（`package.py --platforms core`）；只有显式 checkout 平台仓（`--ios-root/--android-root`）时才跑 full 打包。

### 12.2 按输入范围触发

| 变更 | 必跑 |
| --- | --- |
| Token / specs / contracts | Core 全量、双端兼容解析、受影响模板 |
| iOS API / Provider / 模板 | iOS 编译与对应快照 / UI |
| Android API / Provider / 模板 | Android 编译、ABI 与对应截图 / UI |
| 构建器 / 渲染器 / CLI | 全量结构、可复现、全平台模板编译 |
| 打包器 / manifest | 干净目录解包、安装与加载验证 |
| 仅开发计划 / 方案文字 | 文档链接与范围检查，不宣称原生测试已跑 |

### 12.3 发布门禁

- 所有标 `verified` 的平台证据齐全；
- 固定评测任务无未解释回归；
- 干净环境可解包、加载、查询和复制模板；
- 包哈希与构建报告一致；
- 未验证项已列入发布说明；
- 版本与输入来源可审计。

---

## 13. 质量与 Token 度量

### 13.1 质量指标

- 首次原生编译成功率；
- 不存在的组件、参数、枚举、Modifier / API 数；
- 设计规则违例数；
- loading / empty / error 等状态覆盖率；
- 平台测试矩阵通过率；
- 人工设计问题数与严重度；
- 最终人工修改行数；
- 修复轮次和失败类型。

### 13.2 成本指标

```text
端到端 Token =
入口与规则输入 + 检索输入 + API / 模板输入
+ 业务输入 + 代码输出 + 错误反馈 + 修复轮次
```

同时记录：

- 缓存命中与缓存 Token；
- 工具调用次数和耗时；
- 原生构建耗时；
- 模型费用（若宿主可提供）；
- 输出代码行数与重复骨架比例。

不能用整仓字符估算值作为真实基线，也不能用 `SKILL.md` 缩短冒充总成本下降。

### 13.3 首版验收策略

M0 冻结任务集和指标定义；首次评测只建立基线，不预设必须达到某个未经验证的百分比。M4 后根据基线设置回归阈值，阈值变化必须说明原因。

---

## 14. 安全与可维护性

- 所有路径在写入前解析并检查目标边界；
- 脚手架不默认覆盖、不递归删除、不执行模板内脚本；
- 外部文档和仓库内容均视为数据，不作为流水线指令；
- 模板不含密钥、账号、签名与本地路径；
- 构建日志脱敏后才进入模型反馈；
- Provider 不能通过声明文字提高验证状态；
- 构建器、运行时脚本和模板分别版本化；
- 所有生成文件可追溯到输入来源；
- 组件库现有质量门禁继续有效，新流水线不绕过它们；
- 生成页面最终仍需消费方负责人和设计评审承担质量责任。

---

## 15. 风险与对策

| 风险 | 影响 | 对策 |
| --- | --- | --- |
| 把契约并集当真实重载 | 生成不可编译代码 | 平台符号为主，最小调用例编译 |
| Android API 文本解析误判 | 错误参数 / 默认值 | 与 ABI 交叉核对，未编译只标 discovered |
| Page Spec 过度膨胀 | 成为第二个 UI 框架 | 最小共享字段，平台细节进 Provider |
| 双端能力不对等 | 假支持、假一致 | coverage 和状态显式化，允许 spec-only |
| 模板进入组件库 | 业务耦合与兼容负担 | 消费方 / AIStarter 持有业务模板 |
| 生成物再次漂移 | AI 读旧 API | 自动提取、临时目录重建、hash 和 CI check |
| 静态 lint 假绿 | 视觉和交互缺陷漏检 | 编译、快照、UI、人工评审分层 |
| 模板复制仍写错工程 | 依赖与导航被破坏 | 默认不改工程配置，目标路径确认 |
| Skill 包很大 | 加载成本回升 | Core / 平台分包、单组件按需查询 |
| 只测构建器不测生成质量 | 工具正确但页面不好 | 固定 AI 任务集和人工设计评分 |
| 多仓版本不一致 | 不可复现、错误兼容承诺 | manifest、兼容矩阵、dirty snapshot 标识 |
| 宿主 Skill 规范差异 | 包生成后无法加载 | 通用核心 + 宿主 adapter，实机加载验收 |

---

## 16. 方案完成与实施完成的判定

### 本阶段方案交付完成

- 架构、源数据、Provider、Page Spec、构建、验证和发布方案齐全；
- 开发任务、依赖、范围、验收和责任角色明确；
- 当前项目事实与未验证项明确；
- 待拍板项明确；
- 没有把方案描述成已实施。

### 后续实施完成

必须同时满足：

1. Core、iOS、Android 生成包可从各自真源重建；
2. `cli.js build / check / test` 与 `package.py --platforms ...`、`dist-package.test.js` 有可运行证据（`pack` 子命令不存在，打包器即 `package.py`）；
3. 至少一个 iOS 和一个 Android 黄金页面在消费侧通过各自规定验证；
4. 不支持能力会显式失败或降级；
5. 生成包可被目标宿主实际加载；
6. 固定任务评测结果可复算；
7. 所有 `verified` 声明有对应报告；
8. 未验证项与后续计划已公开。

**只有方案文档、生成目录或静态检查通过，都不算整个方案实施完成。**

---

## 17. 待拍板决策

| # | 决策 | 默认建议 |
| --- | --- | --- |
| D1 | 是否批准按本方案进入实施 | 先评审并冻结 M0 契约，再写代码 |
| D2 | 首个黄金页面 | 列表页或设置表单二选一；需同时能覆盖核心状态与平台差异 |
| D3 | 首版宿主 | 先通用目录包，再明确一个实际 AI 宿主做加载验收 |
| D4 | 平台包版本策略 | Skill 独立版本，manifest 锁定各组件库兼容范围 |
| D5 | Android API 提取深度 | 首版 discovered + 编译示例；后续再评估编译器级提取 |
| D6 | verified 门槛 | 编译 + 规定快照 / UI 矩阵；只有静态检查不得标 verified |
| D7 | 是否允许新增工具依赖 | 默认零 npm 运行时依赖，新增需单独评审 |
| D8 | 模板归属 | 消费方 / AIStarter，组件库只保留组件示例 |
| D9 | 评测模型与预算 | 固定模型与任务，先测基线再设阈值 |
| D10 | CI 拓扑 | 设计仓编排，平台仓分别拥有原生验证，不在 CI 自动改真源 |

待这些事项确认后，按 [开发计划](03-DEVELOPMENT-PLAN.md) 的阶段门槛推进，而不是一次性同时铺开所有组件和平台。
