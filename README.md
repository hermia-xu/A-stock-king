# A 股资金净流入排行

沪深 A 股（含创业板、科创板）主力资金净流入前十。默认近三个交易日，可切换今日 / 近五日 / 近十日。

数据来自东方财富公开接口。主力净流入 = 超大单 + 大单。仅供浏览，非投资建议。

## 在线地址

部署到 GitHub Pages 后打开：

https://hermia-xu.github.io/A-stock-king/

## 本地运行

```bash
npm install
npm run preview
```

预览地址：[http://127.0.0.1:43123](http://127.0.0.1:43123)

`preview` 使用生产模式启动，避免 Next.js 开发态对预览 iframe 的跨站拦截。日常开发也可用 `npm run dev`。

## GitHub Pages

仓库已包含 `.github/workflows/deploy-pages.yml`。把代码推到 `main` 后：

1. 打开仓库 Settings → Pages
2. Source 选 **GitHub Actions**
3. 等待 Actions 跑完即可访问上面的在线地址

本地检查静态构建：

```bash
npm run build:pages
```

产物在 `out/`。
