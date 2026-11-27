/**
 * 访客打码：预约名单只显示打码后的姓名与手机号（AC2）。
 * 姓名保留首尾字、中间变 *；两字姓名保留首字 + *。
 * 手机号保留前 3 位与后 4 位，中间变 ****。
 */
export function maskName(name: string): string {
  const t = name.trim();
  if (t.length <= 1) return '*';
  if (t.length === 2) return `${t[0]}*`;
  return `${t[0]}${'*'.repeat(t.length - 2)}${t[t.length - 1]}`;
}

export function maskPhone(phone: string): string {
  const t = phone.trim();
  if (/^\d{11}$/.test(t)) return `${t.slice(0, 3)}****${t.slice(7)}`;
  if (t.length <= 4) return '*'.repeat(t.length);
  return `${t.slice(0, 3)}****${t.slice(-4)}`;
}
