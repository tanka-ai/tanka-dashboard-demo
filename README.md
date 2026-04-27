# dashboard-demo

积分运营看板的最小 Next.js 应用骨架，面向 Tanka App Platform 的企业应用生成场景。

## 本地启动

```bash
npm install
npm run dev
```

默认首页展示的是一套类型化的积分示例数据，方便在未配置外部数据源前直接预览流程。

## 环境变量

请先复制 `.env.example` 并按实际环境补值：

- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_TABLE_POINTS_USERS`
- `AIRTABLE_TABLE_POINTS_LEDGER`
- `AIRTABLE_TABLE_POINTS_TASKS`
- `AIRTABLE_TABLE_POINTS_REWARDS`
- `VERCEL_PROJECT_ID`
- `VERCEL_ORG_ID`
- `OPENAI_API_KEY`

当前版本不会主动请求这些服务；它们只是后续对接时需要的占位说明。

## 当前范围

- Next.js App Router + TypeScript 基础结构
- Tailwind v4 风格的全局样式
- 积分档案、排行榜、任务、权益和流水的显式类型契约
- 首页积分看板，包括指标、成长进度、团队排行、可赚任务、权益兑换和最近流水

## 后续接入建议

1. 将 `lib/mock-points-data.ts` 替换为 Airtable 读取层。
2. 在服务端增加表结构校验与字段映射。
3. 将静态动作按钮接成实际的积分活动创建、任务结算和兑换流程。
