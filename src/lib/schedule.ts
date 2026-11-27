import type { Booking, Slot } from './mockData';

/** 某时段已确认的预约数：关闭时段确认框里显示的“将取消 n 个预约”就是这个数（AC1）。 */
export function countConfirmedBookings(slotId: string, bookings: Booking[]): number {
  return bookings.filter((b) => b.slotId === slotId && b.status === 'confirmed').length;
}

/** 关闭时段确认框文案：任务描述原文——“确认框显示「将取消 n 个预约并短信通知访客」”。 */
export function closeConfirmText(n: number): string {
  return `将取消 ${n} 个预约并短信通知访客`;
}

/** 时段余量 = 容量 - 未取消的预约数。 */
export function slotRemaining(slot: Slot, bookings: Booking[]): number {
  const taken = bookings.filter((b) => b.slotId === slot.id && b.status !== 'cancelled').length;
  return Math.max(0, slot.capacity - taken);
}
