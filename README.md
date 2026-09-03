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

## 部署到 hermia-xu/A-stock-king

本仓库已包含 GitHub Actions（`.github/workflows/deploy-pages.yml`）。在你自己的电脑上：

```bash
git remote add github https://github.com/hermia-xu/A-stock-king.git
# 若已有 github 远程则跳过上一行
git push -u github main
```

然后打开 https://github.com/hermia-xu/A-stock-king/settings/pages ，Source 选 **GitHub Actions**，等 Actions 跑完后访问：

https://hermia-xu.github.io/A-stock-king/

本地检查静态构建：

```bash
npm run build:pages
```

产物在 `out/`。

