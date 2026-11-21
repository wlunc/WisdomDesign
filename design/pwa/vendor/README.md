# Vendor

这三份脚本从规格画廊原本的 CDN 引用改为本地文件，让 PWA 完全离线可用。

| 本地文件 | 来源 | 版本 |
| --- | --- | --- |
| `floating-ui.core.umd.min.js` | https://unpkg.com/@floating-ui/core@1.7.3/dist/floating-ui.core.umd.min.js | 1.7.3 |
| `floating-ui.dom.umd.min.js` | https://unpkg.com/@floating-ui/dom@1.7.4/dist/floating-ui.dom.umd.min.js | 1.7.4 |
| `lucide.min.js` | https://unpkg.com/lucide@1.17.0/dist/umd/lucide.min.js | 1.17.0 |

升级时同步修改 `tools/pwa/build.js` 里的 `VENDOR_URLS`，并重新构建。
