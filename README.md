# 会员空间平台 · 官网运营后台页面（ClawHunt #3108 样品）

任务编码：**S4-SITE-041** · ClawHunt 问题 #3108 · 类别 frontend

在员工工作台「官网管理」中实现 3 个页签（React + TypeScript + TDesign，接口先用 MSW mock）：

- **参观排班**：周视图展示每个时段的余量；批量生成弹窗含日期范围、星期多选、可增删的时段模板行、节假日多选；关闭时段须填写原因，若有已确认预约，确认框显示「将取消 n 个预约并短信通知访客」。
- **预约名单**：表格列 booking_no、到访时间、访客（打码）、公司、人数、目的、状态、来源，按日期与状态筛选；行内操作「标记到访」「标记未到」；导出当日名单需二次确认。
- **同步异常**：列出写入招商线索池失败的记录（编号、来源、最后错误、重试次数、最后尝试时间），支持单条重试与勾选后批量重试，结果以消息提示。

## 一键复跑

```bash
bash setup.sh
```

实测 `SELFTEST: PASS`（npm ci → tsc + vite build → 全量测试 → 变异自证 → MANIFEST 核对）。
截图用 `npm run screenshots` 单独生成（vite preview + Playwright + 本机 Chromium，见 `docs/screenshots/`）。

## 验收标准逐条对照

| # | 验收标准（平台原文） | 样品覆盖 | 结果 |
|---|---|---|---|
| 1 | 关闭含已确认预约的时段时，确认框中显示将取消的预约数量（测试通过） | `tests/test_ac1_close_slot.test.tsx` 5 项：`countConfirmedBookings` 单测（2026-11-30-s1 计 2 个）、含 2 个已确认预约的时段确认框显示「将取消 2 个预约并短信通知访客」、无已确认预约的时段显示 0 个、确认关闭后时段变已关闭且消息报已取消 2 个、不填原因不进确认框 | 通过 |
| 2 | 预约名单中访客姓名与手机号以打码形式显示（截图与测试） | `tests/test_ac2_masking.test.tsx` 6 项：`maskName`/`maskPhone` 单测、表格只含打码值（`张*明` / `138****5678`，不含完整手机号与原名）、日期筛选、标记到访、导出二次确认；截图 `docs/screenshots/booking-list.png` | 通过 |
| 3 | 勾选 3 条同步异常并点击批量重试后，mock 收到 3 次重试请求（测试通过） | `tests/test_ac3_batch_retry.test.tsx` 3 项：勾 3 条批量重试后 `getRetryRequests()` 为 `['SYNC-001', 'SYNC-002', 'SYNC-003']`、单条重试只发 1 次、未勾选时按钮不可点且不发请求 | 通过 |

## 测试结果（全部实跑）

- 环境：Node v24.22.1，vitest 3.2.7，TypeScript 5.9.3，tdesign-react 1.19.0，MSW 2.15.0，jsdom，未连真实后端。
- `npm test`：**14 passed (14)**，3 个测试文件，Duration 54.40s（见 `evidence/pytest-20261127.log`）。
- `npm run build`：tsc 类型检查 + vite build 通过（见 `evidence/build-20261127.log`）。
- `npm run mutation`：**MUTATION CHECK: PASS**（A 相 14 项全过；B1 相 maskPhone 返回原号后 AC2 变红；B2 相批量重试只发第一条后 AC3 变红；C 相恢复后 14 项全过；变异前后文件 SHA256 一致，见 `evidence/mutation-check-20261127.log`）。
- `npm run screenshots`：**SCREENSHOTS: PASS（4 张）**，1280×900 PNG：排班周视图、批量生成弹窗、预约名单、同步异常（见 `docs/screenshots/`，日志见 `evidence/screenshots-20261127.log`）。
- `bash setup.sh`：**SELFTEST: PASS**。

## 结构

```
src/
  App.tsx                  # 3 个页签路由（#/schedule、#/bookings、#/sync-errors）
  main.tsx                 # MSW worker 启动
  lib/
    mockData.ts            # 虚构演示数据（时段 / 预约 / 同步异常）
    masking.ts             # 姓名与手机号打码（AC2）
    schedule.ts            # 已确认预约计数、关闭确认文案、时段余量（AC1）
    api.ts                 # fetch 封装；批量重试 = 逐条各发一次重试请求（AC3）
  mocks/
    handlers.ts            # MSW mock；重试请求记入 retryRequests，供 AC3 断言
    browser.ts / server.ts # 浏览器 worker / 测试 server
  pages/
    VisitSchedulePage.tsx  # 参观排班（周视图 + 批量生成弹窗 + 关闭时段）
    BookingListPage.tsx    # 预约名单（打码表格 + 筛选 + 标记 + 导出二次确认）
    SyncErrorsPage.tsx     # 同步异常（单条重试 + 批量重试 + 消息提示）
tests/                     # 3 个 AC 测试文件 + setup.ts
scripts/
  mutation_check.cjs       # 变异自证
  screenshots.mjs          # 4 张截图
```

## 对接点与限制

- 依赖 S2-IAM（身份、角色与数据范围）：本样品未接真实身份接口，页面不做权限判断；按任务描述先用 mock，接入时在 `src/lib/api.ts` 换真实接口。
- 只用虚构测试数据，不出现客户名称；访客姓名、手机号、公司名均为编造的演示值。
- 批量生成目前只在本地状态里加时段（未调后端）；关闭时段、标记到访/未到、重试均走 MSW mock，不写真实库。
- TDesign `Input` 不支持 `type="date"`，日期输入用原生 `<input type="date">`；状态筛选用原生 `<select>`（TDesign Select 弹窗在 jsdom 测试里不稳定）。
- 截图脚本曾被 #2998 的残留 vite preview（占住 4173 端口）干扰：先确认 4173 端口空闲再跑 `npm run screenshots`。
