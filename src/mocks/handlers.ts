/**
 * MSW mock：任务描述约定“接口先用 mock”。
 * 全部数据均为虚构演示值，不含任何真实个人信息或企业信息。
 *
 * - GET /api/visit/slots：周排班时段
 * - GET /api/visit/bookings：预约名单
 * - POST /api/visit/slots/:id/close：关闭时段，返回将取消的已确认预约数
 * - POST /api/visit/bookings/:no/mark：标记到访 / 标记未到
 * - GET /api/visit/sync-errors：同步异常列表
 * - POST /api/visit/sync-errors/:id/retry：单条重试；每次调用记一次
 *   （AC3 的断言口径：批量重试 3 条，mock 收到 3 次重试请求）。
 */
import { http, HttpResponse } from 'msw';
import { INITIAL_BOOKINGS, INITIAL_SLOTS, INITIAL_SYNC_ERRORS } from '../lib/mockData';
import type { Booking, Slot, SyncError } from '../lib/mockData';
import { countConfirmedBookings } from '../lib/schedule';

let slots: Slot[] = structuredClone(INITIAL_SLOTS);
let bookings: Booking[] = structuredClone(INITIAL_BOOKINGS);
let syncErrors: SyncError[] = structuredClone(INITIAL_SYNC_ERRORS);
/** mock 收到的重试请求记录（按 id 顺序）：AC3 测试直接读它计数。 */
let retryRequests: string[] = [];

export function getRetryRequests(): string[] {
  return [...retryRequests];
}

export function resetMockState(): void {
  slots = structuredClone(INITIAL_SLOTS);
  bookings = structuredClone(INITIAL_BOOKINGS);
  syncErrors = structuredClone(INITIAL_SYNC_ERRORS);
  retryRequests = [];
}

export const handlers = [
  http.get('/api/visit/slots', () => {
    return HttpResponse.json({ slots });
  }),

  http.get('/api/visit/bookings', () => {
    return HttpResponse.json({ bookings });
  }),

  http.post('/api/visit/slots/:id/close', async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as { reason?: string };
    if (!body.reason || body.reason.trim() === '') {
      return HttpResponse.json({ message: '关闭时段须填写原因' }, { status: 422 });
    }
    const slot = slots.find((s) => s.id === id);
    if (!slot) return HttpResponse.json({ message: '时段不存在' }, { status: 404 });
    const cancelled = countConfirmedBookings(id, bookings);
    bookings = bookings.map((b) =>
      b.slotId === id && b.status === 'confirmed' ? { ...b, status: 'cancelled' as const } : b,
    );
    slots = slots.map((s) =>
      s.id === id ? { ...s, status: 'closed' as const, closeReason: body.reason } : s,
    );
    return HttpResponse.json({ ok: true, cancelled });
  }),

  http.post('/api/visit/bookings/:no/mark', async ({ params, request }) => {
    const no = String(params.no);
    const body = (await request.json()) as { status?: string };
    if (body.status !== 'visited' && body.status !== 'no_show') {
      return HttpResponse.json({ message: '状态不合法' }, { status: 422 });
    }
    const found = bookings.find((b) => b.booking_no === no);
    if (!found) return HttpResponse.json({ message: '预约不存在' }, { status: 404 });
    bookings = bookings.map((b) =>
      b.booking_no === no ? { ...b, status: body.status as Booking['status'] } : b,
    );
    return HttpResponse.json({ ok: true });
  }),

  http.get('/api/visit/sync-errors', () => {
    return HttpResponse.json({ errors: syncErrors });
  }),

  http.post('/api/visit/sync-errors/:id/retry', ({ params }) => {
    const id = String(params.id);
    const found = syncErrors.find((e) => e.id === id);
    if (!found) return HttpResponse.json({ message: '记录不存在' }, { status: 404 });
    retryRequests.push(id);
    syncErrors = syncErrors.map((e) =>
      e.id === id ? { ...e, retryCount: e.retryCount + 1 } : e,
    );
    return HttpResponse.json({ ok: true, id });
  }),
];
