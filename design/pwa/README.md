# Wisdom Design PWA

手机上快速查看设计稿的安装式 Web 应用。完整的构建、部署与 HTTPS 说明见 [`docs/10-pwa.md`](../../docs/10-pwa.md)。源文件仍是 `design/preview` 与 `design/gallery` 里的自包含 HTML；本目录下的 `docs/`、`data/index.json` 和 `sw.js` 由构建脚本生成。

## 本地查看

```bash
# 在仓库根目录
node tools/pwa/build.js      # 生成 docs/、index.json、sw.js
node tools/pwa/serve.js      # http://localhost:4173
```

手机与电脑连同一 Wi-Fi，打开终端里打印的局域网地址即可。iOS Safari 可以「分享 → 添加到主屏幕」；Chrome 在 HTTPS 下会显示安装按钮。

> 离线缓存和完整 PWA 安装要求 HTTPS（或 localhost）。局域网 HTTP 下页面能看，但 Service Worker 不会注册。

## 部署

`design/pwa/` 是纯静态目录，所有路径都是相对路径，可以原样放到任意 HTTPS 静态托管（GitHub Pages、Cloudflare Pages、Vercel、对象存储等）的子路径下。部署前先运行 `node tools/pwa/build.js`。

## 生成文件

- `docs/*.html` — 从设计稿 wrapper 抽出的自包含画廊页面（已本地化脚本、注入锚点与移动端微调）
- `data/index.json` — 画廊与 42 个条目（37 个组件 + 5 个场景配方）的索引，供首页搜索与查看器使用
- `sw.js` — 预缓存清单与版本号，随内容自动更新
- `assets/icons/` — 由 `node tools/pwa/make-icons.js` 从 `icon.svg` 生成

构建校验：

```bash
node tools/pwa/build.js --check
```
