import type { Booking, Slot, SyncError } from './mockData';

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return (await res.json()) as T;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T & { message?: string };
  if (!res.ok) throw new Error(data.message ?? `POST ${url} -> ${res.status}`);
  return data;
}

export async function getSlots(): Promise<Slot[]> {
  const data = await getJson<{ slots: Slot[] }>('/api/visit/slots');
  return data.slots;
}

export async function getBookings(): Promise<Booking[]> {
  const data = await getJson<{ bookings: Booking[] }>('/api/visit/bookings');
  return data.bookings;
}

export async function closeSlot(id: string, reason: string): Promise<{ cancelled: number }> {
  return postJson<{ cancelled: number }>(`/api/visit/slots/${id}/close`, { reason });
}

export async function markBooking(no: string, status: 'visited' | 'no_show'): Promise<void> {
  await postJson(`/api/visit/bookings/${no}/mark`, { status });
}

export async function getSyncErrors(): Promise<SyncError[]> {
  const data = await getJson<{ errors: SyncError[] }>('/api/visit/sync-errors');
  return data.errors;
}

export async function retrySyncError(id: string): Promise<void> {
  await postJson(`/api/visit/sync-errors/${id}/retry`, {});
}

/** 批量重试 = 对每条勾选记录各发一次重试请求（AC3 口径：勾 3 条，mock 收到 3 次请求）。 */
export async function batchRetrySyncErrors(ids: string[]): Promise<void> {
  for (const id of ids) {
    await retrySyncError(id);
  }
}
