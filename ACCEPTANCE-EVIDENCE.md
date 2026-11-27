# ACCEPTANCE-EVIDENCE — ClawHunt #3108 (S4-SITE-041)

样品仓：https://github.com/AWKN-Lab/clawhunt-3108-visit-admin

## 实测结果（2026-11-27，全部本机实跑，原始日志见 evidence/）

- `npm test`：Test Files 3 passed (3)，Tests 14 passed (14)，Duration 54.40s。
  AC1 5 项、AC2 6 项、AC3 3 项（`evidence/pytest-20261127.log`）。
- `npm run build`：tsc + vite build 通过，`✓ built in 49.42s`
  （`evidence/build-20261127.log`；另有一次构建因 TDesign Input 不支持
  type="date" 报错，已改用原生 date 输入框后通过）。
- `npm run mutation`：MUTATION CHECK: PASS。
  A 相 14 项全过；B1 相 maskPhone 返回原号后 AC2 测试 exit 1；
  B2 相批量重试只发第一条后 AC3 测试 exit 1；C 相恢复后 14 项全过；
  masking / api 变异前后 SHA256 一致（`evidence/mutation-check-20261127.log`）。
- `npm run screenshots`：SCREENSHOTS: PASS（4 张），1280×900 PNG，
  排班周视图、批量生成弹窗、预约名单、同步异常
  （`docs/screenshots/`，`evidence/screenshots-20261127.log`）。
  预约名单截图肉眼核对：访客只显示打码值（张*明 / 138****5678），无完整手机号。
- `bash setup.sh`：SELFTEST: PASS（npm ci → 构建 → 测试 → 变异自证 → MANIFEST 核对）。

## AC 原文（平台实读，逐字）

1. 关闭含已确认预约的时段时，确认框中显示将取消的预约数量（测试通过）
2. 预约名单中访客姓名与手机号以打码形式显示（截图与测试）
3. 勾选 3 条同步异常并点击批量重试后，mock 收到 3 次重试请求（测试通过）

## 实测修掉的问题

1. TDesign `Input` 不支持 `type="date"`（tsc 报错）：三处日期输入改用原生
   `<input type="date">`，状态筛选用原生 `<select>`。
2. 关闭时段「下一步」未校验原因：空原因也能进确认框；已改为下一步时先校验，
   空原因显示「关闭时段须填写原因」且不进确认框，测试覆盖。
3. TDesign 禁用 Button 在 jsdom 里渲染为带 `t-is-disabled` class 的 div，
   `toBeDisabled()` 断言不适用：改断言 class + 点击后无请求发出。
4. 截图首次失败：#2998 的残留 vite preview 占住 4173 端口，脚本连上的是旧应用；
   另缺 `public/mockServiceWorker.js`（`npx msw init` 需交互确认，改用已生成的
   文件）；清掉残留进程、补齐 worker 文件后 SCREENSHOTS: PASS。

## 未执行（诚实记录）

- 未接真实后端与真实身份接口（S2-IAM）：全部接口走 MSW mock，按任务描述先用 mock。
- 未在 PostgreSQL / 真实工作台里联调：中标后在集成环境里补。
- CI（.github/workflows/ci.yml）尚未在 GitHub Actions 上跑过：推送后由 CI 实跑验证。
