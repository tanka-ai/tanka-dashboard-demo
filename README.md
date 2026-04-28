# dashboard-demo

积分运营看板的最小 Next.js 应用骨架，面向 Tanka App Platform 的企业应用生成场景。

## 本地启动

```bash
npm install
npm run dev
```

默认首页会优先通过平台运行时读取 Airtable 中名为 `OpenUI Points Dashboard Demo` 的数据，并自动生成团队积分与个人积分看板。

## 环境变量

请先复制 `.env.example` 并按实际环境补值：

- `AIRTABLE_TOKEN`
- `VERCEL_PROJECT_ID`
- `VERCEL_ORG_ID`
- `OPENAI_API_KEY`

当前应用不会在代码中要求 `AIRTABLE_BASE_ID`。base 会通过平台运行时的 metadata endpoint 自动发现，符合 Tanka App Platform 的 Airtable 接入约定。

## 当前范围

- Next.js App Router + TypeScript 基础结构
- Tailwind v4 风格的全局样式
- 团队积分与个人积分的显式类型契约
- 首页积分看板，包含 Airtable 自动发现、团队排行、个人排行和数据源状态
- 运行时 Airtable 读取层，通过平台 `/api/apps/dashboard-demo/...` 接口获取 base、table 和 records

## 后续接入建议

1. 为 `OpenUI Points Dashboard Demo` 约定更稳定的字段命名，减少启发式识别成本。
2. 在服务端补充字段校验与 schema 断言，避免表结构漂移影响看板。
3. 如需 drill-down，可继续接入团队详情页和个人详情页，而不是回退到本地 mock 数据。
