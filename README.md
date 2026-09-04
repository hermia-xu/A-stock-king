# A 股看板

两个实时模块：

1. **换手量比选股**（默认）：换手率 5% ≤ x &lt; 10%，量比 2–3，排除 ST
2. **资金净流入**：沪深 A 股主力净流入前十（今日 / 近三日 / 近五日 / 近十日）

数据来自东方财富公开接口。仅供浏览，非投资建议。

## 在线地址

https://hermia-xu.github.io/A-stock-king/

## 本地运行

```bash
npm install
npm run preview
```

预览地址：[http://127.0.0.1:43123](http://127.0.0.1:43123)

`preview` 使用生产模式启动。日常开发也可用 `npm run dev`。

接口：

- `GET /api/screener?turnoverMin=5&turnoverMax=10&volRatioMin=2&volRatioMax=3&excludeST=true`
- `GET /api/fund-flow?period=3d`

## 部署

推送到 `main` 后，GitHub Actions 会构建并发布 Pages：

```bash
git push -u github main
```

本地检查静态构建：`npm run build:pages`，产物在 `out/`。
