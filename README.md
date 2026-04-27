# dashboard-demo

客户跟进 CRM 的最小 Next.js 应用骨架，面向 Tanka App Platform 的企业应用生成场景。

## 本地启动

```bash
npm install
npm run dev
```

默认首页展示的是一套类型化的 CRM 示例数据，方便在未配置外部数据源前直接预览流程。

## 环境变量

请先复制 `.env.example` 并按实际环境补值：

- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_TABLE_CUSTOMERS`
- `AIRTABLE_TABLE_FOLLOW_UPS`
- `AIRTABLE_TABLE_OPPORTUNITIES`
- `VERCEL_PROJECT_ID`
- `VERCEL_ORG_ID`
- `OPENAI_API_KEY`

当前版本不会主动请求这些服务；它们只是后续对接时需要的占位说明。

## 当前范围

- Next.js App Router + TypeScript 基础结构
- Tailwind v4 风格的全局样式
- 客户、跟进任务、商机、活动记录的显式类型契约
- 首页 CRM 工作台，包括指标、今日跟进、管道进展、重点客户和近期动态

## 后续接入建议

1. 将 `lib/mock-crm-data.ts` 替换为 Airtable 读取层。
2. 在服务端增加表结构校验与字段映射。
3. 将静态动作按钮接成实际的创建/更新流程。
