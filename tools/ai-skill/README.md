# AI Skill 工具

本目录是实现与验证工具的入口。所有命令在 `wisdomdesign/` 下执行；生成物只写 `ai/skill/core/dist/`、`dist/ai-skill/` 或显式 `--out` 临时目录。

## M0 契约自检

- `node tools/ai-skill/tests/contract-selftest.js`：用零依赖子集校验器跑 Page Spec / Provider / API Card / manifest 的正反例。
- `lib/schema-lite.js`：仅供契约与 manifest 自检；M1 正式 Page Spec 校验器另需完整 JSON Schema 实现与独立测试。

## M1-1/M1-2 设计真源提取与组件语义目录

- `ruby tools/ai-skill/lib/extract-design.rb`：只读提取 Token 摘要、37 份 YAML、正式 specs §1（用途/反例）、§5 状态、§7 内容、§10 无障碍结论、布局/无障碍/内容规则摘要和 overlay；YAML 由 Ruby 标准库 Psych 解析。每条 bullet / note / 状态行 / 内容行 / 无障碍行都带 `sourceRef`（文件 + 绝对行号）与 `lineText`（该行原文），供逐行审计。
- `node tools/ai-skill/lib/generate-core-catalog.js --out ai/skill/core/catalog`：生成短行组件目录、37 张独立语义卡和来源 manifest。卡片内不出现 markdown 链接（规格中的仓库相对链接会退化为文本标签），来源一律以 `path:line` 锚点表达。
- `node tools/ai-skill/tests/core-catalog.test.js`：37 组件集合、用途/反例来源、行号逐条回读、缺章节、重复 ID、未知引用、路径逃逸和确定性输出的正反例。

## M1-3/M1-4 校验器与查询运行时

- `node ai/skill/runtime/validate-spec.js --file <spec> --json`：Page Spec 正式结构 + 语义校验；错误含 code/jsonPath/message/suggestion，报告分开给出 `structureValid` / `semanticValid`（语义规则吸收 `contains` 后不会把语义失败误报为结构失败）。
- `node ai/skill/runtime/get-component.js --id <WDComponent>|--query <text> --json`：canonical 精确查询或有上限关键词查询；未知组件不编造，路径不逃逸，默认不全量输出。同一脚本适配两种布局：源码 `ai/skill/core/catalog`、打包 `<package>/catalog`；overlay 只按包内相对路径解析。
- `node tools/ai-skill/tests/runtime.test.js`：校验器正反例、退出码、错误结构、安全路径、查询上限，以及**从构建出的包内**执行 runtime 的打包布局测试。

## M1-5/M1-6 薄 Core Skill 渲染与可复现构建

- `node tools/ai-skill/cli.js build [--out <dir>] [--template <file>]`：从设计真源生成 `wisdom-page-core` 目录包（SKILL.md、catalog、page-spec、runtime、component-overlays、build-info.json、files.json、manifest.json）。`--template` 仅用于超预算负例测试。
- `node tools/ai-skill/cli.js check [--out <dir>]`：临时目录重建并逐文件比较，不覆盖正式产物。
- `node tools/ai-skill/cli.js test`：一次运行 M0 契约、M1 目录、M1 运行时与 M1 构建四组测试。
- 默认输出 `ai/skill/core/dist/wisdom-page-core`；生成物带 banner、LF 换行、排序路径和相对路径，无时间戳/绝对路径/机器信息；Core 包不含 Provider/API 卡/原生模板。
- `--allow-outside-root` 仅供测试临时目录使用；常规 build/check 拒绝写设计仓外路径。
- 缺失 `--out` / `--template` 的值按用法错误 `exit 2` 处理，不会静默回退默认值。

### 常驻预算（M1-5 / F9）

| 项 | 值 |
| --- | --- |
| 预算上限 | 6,000 bytes（`cli.js` 常量 + `manifest.js` 常量 + `tests/build.test.js` 断言） |
| 本轮测量 Core SKILL.md | 5,389 bytes（`build-info.json.residentBytes`，含本轮 F7 来源优先级与预算说明修正） |
| 平台包追加后 | core 5,389 + 平台段落 ≈ 5,5xx bytes，仍 < 6,000；`package.py` 追加后重新校验并在 `build-info.json` 记录 |
| 取值依据 | 宿主入口只加载单一 SKILL.md，需容纳三模式路由、禁读、按需加载、停止条件与来源优先级；6,000 给上述固定段落留 ≈10% 余量，同时远小于把目录卡整包驻留的体积 |
| 负例 | `tests/build.test.js` 用临时模板副本构造 >6,000 bytes，断言 build 非零退出（不改正式模板） |
| 溢出行为 | build / package.py 均非零退出，不压缩停止条件或来源优先级 |

## M4 打包 / manifest / CI

- `python3 tools/ai-skill/package.py [--platforms core|core,ios,android] [--ios-root <dir>] [--android-root <dir>]`：生成所选包集、ZIP 与 `checksums.json`（固定时间戳、0644、deflate，条目按路径排序）。
  - **单仓 checkout（默认 CI）**：`--platforms core` 只构建 Core，不需要同级 iOS/android，manifest 只记录 wisdomdesign 来源；
  - **full**：`--platforms core,ios,android` 需要平台仓，平台仓位置按 `--ios-root/--android-root` → `WISDOMDESIGN_IOS_ROOT/WISDOMDESIGN_ANDROID_ROOT` → 同级 `../iOS`、`../android` 的顺序解析；缺失时以清晰非零退出提示（checkout / 传根目录 / 改用 `--platforms core`），不静默降级；
  - 没有平台仓时 `cli.js build` 仍可成功（平台来源只是可选出处，平台载荷只由 `package.py` 的 full 模式引入）。
- manifest 只有一套生成器：`tools/ai-skill/lib/manifest.js`（被 `cli.js build` 与 `lib/write-manifest.js` 共用）。它在写出前用 `ai/skill/manifest/manifest.schema.json` 校验，违规即失败（非零退出）。
- 文件计数与哈希：`manifest.contents.fileCount` = 包内真实文件数；`files.json` 覆盖除 `manifest.json`/`files.json` 外的全部文件（含 `LICENSE-NOTICE.txt`）。这两个自指文件的 SHA-256 由 `dist/ai-skill/<version>/checksums.json` 发布，避免旧版“平台包 manifest 自哈希是 Core 旧值”的问题。
- `sources.repositories[*].contentHash` 覆盖打包**输入**：wisdomdesign = `ai/skill`+`tools/ai-skill`+`contracts`+`tokens`+`docs/specs`；iOS / android = `ai/skill-provider`。已生成证据（`dist`、`reports`、`eval/results`、`eval/run-manifest.json`）显式排除，因为它们是输出而非输入；否则跑一次测试就会让“可复现包”变陈旧。排除项写死在 `lib/manifest.js` 并在此声明。
- 注意：manifest 同时如实记录 `sources.repositories[*].dirtyFiles`（当前工作区 git status）。因此**新增/删除任何文件后，已构建的包即“陈旧于工作区”**，`cli.js check` 会报 `build-info.json` 差异；这是可复现语义的正确行为——重新 `build` 后再 `check`（CI 亦按 build → check → package 的顺序执行）。
- `node tools/ai-skill/lib/write-manifest.js --root <pkg> --package <enum> [--platforms core,ios,android]`：单一 manifest 生成入口；`package.py` 用它对四个包逐一生成。
- `node tools/ai-skill/tests/dist-package.test.js [--platforms core|core,ios,android]`：审计已构建包集 —— manifest schema 0 错、计数=实际、逐文件哈希、ZIP 元数据/CRC/路径安全、checksums 自哈希、scope 隔离、包内 runtime（get-component/validate-spec 六种退出码）、SKILL 预算、包内死引用、机器路径（平台自有文档若含本机路径必须登记在 `ai/skill/manifest/package-exemptions.json`，否则失败）。不传 `--platforms` 时按 `checksums.json` 自动识别包集，因此单仓 core-only dist 与 full dist 使用同一审计。
- 单仓可运行性：`cli.js build`/`test` 与 `package.py --platforms core` 不依赖同级 iOS/android，也不依赖预生成的 `ai/skill/core/catalog`（组件集合来自 `contracts/WD*.yaml`）；`runtime.test.js` 在源码布局测试前按需用同一生成器补齐 `core/catalog`。
- `node tools/ai-skill/ci/route-changes.js --event <payload> --paths-file <list> [--require-paths]`：PR 的 `pull_request.changed_files` 只是数量，CI 用 `git diff --name-only` 生成文件列表传入；`--require-paths` 让空列表直接失败，避免退化为 baseline。
- `node tools/ai-skill/ci/check-native-layers.js --plan <plan.json> [--ios-root <dir>] [--android-root <dir>] [--strict-evidence]`：L2 只校验原生层是否登记（owner/command/status/evidence）；平台仓不在时明确输出 external-owned（不判死），`--strict-evidence` 且提供根目录时才校验证据 JSON pointer。本仓从不执行 xcodebuild/gradle，也不声明原生通过。
- `node tools/ai-skill/ci/release-gate.js --dist dist/ai-skill/v1.0.0`：L3 校验真实四包 manifest、checksums、dirty→snapshot、verified→四 flag、refs 存在性；发布动作仍需仓外显式批准。

## 其他验证

- `node tools/ai-skill/tests/m4-ci.test.js`：版本兼容、证据反自证（含省略字段负例）、dirty/release 负例、路径安全、死链审计、范围路由（PR/push/REST payload）、原生层登记、真源不变指纹。死链审计递归扫描 `AIOptimize/**`、`ai/skill/**` 与已生成的 `dist`；`../../iOS/...`、`../../android/...` 归类为**跨仓证据链接**（平台仓存在时校验文件、单仓 checkout 记为 cross-repo/unverifiable，不计死链），其它越界路径仍判死；下限按源文档计（≥20 内部链接、≥10 md），不依赖生成物。真源指纹排除生成的 `core/catalog`、`core/dist`，因此在单仓与完整工作区一致。
- `node tools/ai-skill/tests/governance-selftest.js`：M6 治理结构自检。
- `node tools/ai-skill/eval/run.js --check-readiness`：M5 readiness（当前 5 个 blocker，exit 2；真实评测未执行）。

## overlay

overlay 只允许放在 `ai/skill/component-overlays/WD*.json`，只补检索关键词、组合关系和页面区域；不得覆盖规格、契约、Token 或平台 API。正式规格名 `PullToRefresh` 与 canonical YAML `WDPullRefresh` 的唯一别名在提取器 `policy.specAliases` 中记录。Core 包会携带 overlay 文件（检索元数据），保证打包布局的关键词查询与源码布局一致。

本工具只读设计真源与允许的 overlay；目录生成器默认只允许写入设计仓内。M1-1/M1-2 不写平台仓、不执行原生验证、不加载 HTML 画廊作为规范。
