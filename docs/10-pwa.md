# 10 · 手机预览 PWA

规格画廊原本是四个自包含 HTML，桌面浏览器双击就能看。手机上要么把文件传过去，要么开一份本地服务器，都不够"随手"。这一层把四份画廊包成一个可安装的 Web App：首页、组件搜索、全屏查看器、离线缓存。

它**不是**第二份设计实现，只是把 \`design/preview\` 与 \`design/gallery\` 里已经定稿的画廊搬到手机上。设计稿仍是唯一源文件。

## 1. 结构

\`\`\`
design/pwa/
├── index.html               首页：四份画廊 + 42 个条目的索引 + 搜索
├── viewer.html              全屏查看器：返回、浅/深/并排、分享
├── manifest.webmanifest     安装信息、图标、快捷方式
├── sw.js                    预缓存清单（由构建生成，含版本号）
├── assets/
│   ├── app.css              首页与查看器样式（沿用温和蓝令牌）
│   ├── app.js               路由、搜索、Service Worker、安装提示
│   ├── icon.svg             PWA 图标源文件
│   └── icons/               192 / 512 / maskable / Apple Touch / favicon
├── vendor/                  lucide、floating-ui（离线）
├── docs/                    四份画廊（由构建生成）
└── data/index.json          组件索引（由构建生成）
\`\`\`

生成物不要手改。源文件仍是：

- \`design/preview/wisdom-light.html\`
- \`design/gallery/wisdom-components.html\`
- \`design/gallery/wisdom-advanced.html\`
- \`design/gallery/wisdom-patterns.html\`

## 2. 构建

\`\`\`bash
node tools/pwa/build.js          # 写入 docs/、data/index.json、sw.js
node tools/pwa/build.js --check  # CI 校验生成物是否过期
\`\`\`

构建做五件事：

1. **拆 wrapper**：四份画廊是 Codex visualization 生成的 wrapper，真正页面在 iframe 的 \`data-srcdoc\` 里。构建反转义出完整 HTML，并去掉已经失效的 Codex host shim（它在独立打开时会因占位 JSON 报错）。
2. **本地化运行时**：把 lucide 与 floating-ui 三个 CDN 脚本换成本地 \`vendor/\` 文件，CSP 收回为 \`'self'\`。这样断网后图标、tooltip 仍然可用。
3. **加锚点**：给每个 \`<section class="spec">\` 写 \`id="spec-<name>"\`，给浅色预览的五个二级标题写 \`id="sec-<slug>"\`。首页索引与查看器深链都依赖这些 id。
4. **加移动端模式桥**：注入 \`window.__wdPwaSetMode()\`，读取查看器传入的 \`?mode=light|dark|pair\`，并在画廊内原生 \`select\` 变化时 \`postMessage\` 回查看器，两边状态始终一致。
5. **生成索引与缓存清单**：\`data/index.json\` 汇总四份画廊、42 个条目和版本号；\`sw.js\` 以内容哈希做版本，内容一变就换缓存。

图标只在图形变化时重新生成：

\`\`\`bash
node tools/pwa/make-icons.js
# 需要 Chrome/Chromium；非默认路径用 CHROME_PATH=/path/to/chrome
\`\`\`

## 3. 本地运行与手机访问

\`\`\`bash
node tools/pwa/serve.js
# 默认监听 0.0.0.0:4173，并打印局域网地址
# 换端口：node tools/pwa/serve.js --port 8080
\`\`\`

手机与电脑连同一 Wi-Fi，打开终端打印的 \`http://<电脑局域网 IP>:4173/\`。

**关于 HTTPS：**

| 访问方式 | 能看 | 离线缓存 | 安装提示 |
| --- | --- | --- | --- |
| \`localhost\` | ✅ | ✅ | ✅ |
| 局域网 \`http://192.168.x.x\` | ✅ | ❌（Service Worker 不注册） | iOS 可"添加到主屏幕"成网页快捷方式；Chrome 不显示安装 |
| 任意 HTTPS 静态托管 | ✅ | ✅ | ✅ |

所以局域网 HTTP 适合"现在就看"，真正的 PWA 离线安装需要把 \`design/pwa/\` 部署到 HTTPS。可选：

- 静态托管（推荐）：GitHub Pages、Cloudflare Pages、Vercel、对象存储 + CDN
- 临时隧道：\`cloudflared tunnel --url http://localhost:4173\` 或 \`ngrok http 4173\`
- 本地 TLS：Caddy / nginx 配证书；iOS 对外部证书要求较严，不推荐折腾

## 4. 部署

\`design/pwa/\` 是纯静态目录，**所有路径都是相对路径**，可以放在子路径下，例如 \`https://example.com/design/\`。

部署前：

\`\`\`bash
node tools/pwa/build.js --check
\`\`\`

若生成物过期，先 \`node tools/pwa/build.js\` 再提交 / 发布。Service Worker 只在 HTTPS（或 localhost）下生效；部署后第一次打开会预缓存 20 个 URL，之后断网可用。

更新逻辑：构建内容变化 → 版本哈希变化 → 新的 \`sw.js\` 安装并 \`skipWaiting\` → 已打开的旧页面会收到"新版本已就绪，重新打开即可更新"的提示。

### GitHub Pages 示例

仓库是公开的，可以把 PWA 发布成独立站点（是否公开设计稿请自行确认）：

1. \`node tools/pwa/build.js\`
2. 把 \`design/pwa/\` 作为 Pages 的发布目录（Actions 或 \`gh-pages\` 分支）
3. 访问 \`https://<user>.github.io/<repo>/\`，再在手机上安装

本仓库还没有提交 Pages workflow。需要发布时再加，避免无意中把设计稿公开出去。

## 5. 维护约定

- **改设计稿后必须重建**：\`node tools/pwa/build.js\`，否则手机端还是旧页面。
- **CI 加一条 \`--check\`**：生成物和源文件不一致就失败。
- **新增画廊**：在 \`tools/pwa/build.js\` 的 \`GALLERIES\` 里加配置（source、out、标题、数量断言、modeSelect），再补首页文案；\`data/index.json\` 会自动生成。
- **升级 vendor**：改 \`VENDOR_URLS\` 与 \`design/pwa/vendor/README.md\` 的版本表，重新构建。
- **不要手改** \`docs/\`、\`data/index.json\`、\`sw.js\`。它们带生成头注释。

## 6. 验收

已在 Chrome 157 headless 的 390×844 与 320×568 视口验证：

- 首页 4 张画廊卡片、42 条索引；搜索"按钮"命中 2 条；"高级组件"筛选 16 条
- 深链 \`viewer.html?doc=components&spec=spec-button\` 正确滚动到 01 Button，顶部留 12px
- 查看器浅 / 深 / 并排切换会同步 iframe 内的 \`select\`；iframe 内切换也会回传
- 断网后首页、查看器、组件内容仍能打开（Service Worker 缓存 20 个 URL）
- manifest 无解析错误，Chrome installability errors 为空
- 浅色 / 深色、390 / 320 宽度无横向溢出

**尚未在真机 iPhone / Android 上做过安装与触控验证。** 真机安装需要 HTTPS，部署后建议补一轮：iOS Safari 分享 → 添加到主屏幕、Chrome Android 安装、断网冷启动。

## 7. 已知限制

- 画廊在查看器里是 iframe，页面标题由查看器接管；画廊自带的内层"显示"下拉与查看器模式条并存，但已经双向同步。
- 浅色预览页的画廊文本仍跟随系统深浅色；查看器的"浅/深"只切换组件单元格，不强制整页主题。这是原画廊的语义。
- 画廊 CSS 里的色值仍是手工抄写的令牌副本（见 05）；PWA 不改变这一点，令牌改动后画廊仍需同步。
- 没有自定义 iOS 启动图、推送和后台同步。当前定位是"离线速览"，不是完整产品 App。
