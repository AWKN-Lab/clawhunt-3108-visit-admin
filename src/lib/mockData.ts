/**
 * 虚构演示数据：全部为编造的演示值，不含任何真实个人信息或企业信息。
 * 公司名、姓名、手机号均为虚构；手机号段 138/139/136/135/137/150 仅作格式演示。
 */
export interface Slot {
  id: string;
  date: string;
  weekday: string;
  start: string;
  end: string;
  capacity: number;
  status: 'open' | 'closed';
  closeReason?: string;
}

export interface Booking {
  booking_no: string;
  visitTime: string;
  visitorName: string;
  phone: string;
  company: string;
  guests: number;
  purpose: string;
  status: 'confirmed' | 'visited' | 'no_show' | 'cancelled';
  source: '官网' | '电话' | '小程序';
  slotId: string;
  date: string;
}

export interface SyncError {
  id: string;
  source: string;
  lastError: string;
  retryCount: number;
  lastAttempt: string;
}

export const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
export const SLOT_TEMPLATES = [
  { start: '09:00', end: '10:00' },
  { start: '10:30', end: '11:30' },
  { start: '14:00', end: '15:00' },
];
export const HOLIDAYS = ['元旦', '春节', '清明', '劳动节', '端午', '中秋', '国庆'];

function buildSlots(): Slot[] {
  const dates = ['2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05', '2026-12-06'];
  const slots: Slot[] = [];
  dates.forEach((date, di) => {
    SLOT_TEMPLATES.forEach((t, ti) => {
      slots.push({
        id: `${date}-s${ti + 1}`,
        date,
        weekday: WEEKDAYS[di],
        start: t.start,
        end: t.end,
        capacity: 6,
        status: 'open',
      });
    });
  });
  return slots;
}

export const INITIAL_SLOTS: Slot[] = buildSlots();

export const INITIAL_BOOKINGS: Booking[] = [
  {
    booking_no: 'BK-20261130-001',
    visitTime: '2026-11-30 09:30',
    visitorName: '张小明',
    phone: '13812345678',
    company: '虚构科技有限公司',
    guests: 2,
    purpose: '参观洽谈',
    status: 'confirmed',
    source: '官网',
    slotId: '2026-11-30-s1',
    date: '2026-11-30',
  },
  {
    booking_no: 'BK-20261130-002',
    visitTime: '2026-11-30 09:45',
    visitorName: '李小红',
    phone: '13987654321',
    company: '虚构创新有限公司',
    guests: 3,
    purpose: '场地考察',
    status: 'confirmed',
    source: '电话',
    slotId: '2026-11-30-s1',
    date: '2026-11-30',
  },
  {
    booking_no: 'BK-20261130-003',
    visitTime: '2026-11-30 10:45',
    visitorName: '王大伟',
    phone: '13611112222',
    company: '虚构贸易有限公司',
    guests: 1,
    purpose: '入会咨询',
    status: 'confirmed',
    source: '小程序',
    slotId: '2026-11-30-s2',
    date: '2026-11-30',
  },
  {
    booking_no: 'BK-20261201-001',
    visitTime: '2026-12-01 09:15',
    visitorName: '陈小芳',
    phone: '13533334444',
    company: '虚构设计工作室',
    guests: 4,
    purpose: '参观洽谈',
    status: 'visited',
    source: '官网',
    slotId: '2026-12-01-s1',
    date: '2026-12-01',
  },
  {
    booking_no: 'BK-20261201-002',
    visitTime: '2026-12-01 14:20',
    visitorName: '刘小强',
    phone: '13755556666',
    company: '虚构咨询公司',
    guests: 2,
    purpose: '商务洽谈',
    status: 'no_show',
    source: '电话',
    slotId: '2026-12-01-s3',
    date: '2026-12-01',
  },
  {
    booking_no: 'BK-20261202-001',
    visitTime: '2026-12-02 09:30',
    visitorName: '赵小丽',
    phone: '15077778888',
    company: '虚构文化公司',
    guests: 5,
    purpose: '活动场地',
    status: 'confirmed',
    source: '官网',
    slotId: '2026-12-02-s1',
    date: '2026-12-02',
  },
];

export const INITIAL_SYNC_ERRORS: SyncError[] = [
  {
    id: 'SYNC-001',
    source: '官网预约表单',
    lastError: '线索池写入超时：连接超时',
    retryCount: 2,
    lastAttempt: '2026-11-27 10:15:00',
  },
  {
    id: 'SYNC-002',
    source: '小程序预约',
    lastError: '线索池写入失败：唯一键冲突',
    retryCount: 1,
    lastAttempt: '2026-11-27 09:40:00',
  },
  {
    id: 'SYNC-003',
    source: '电话登记',
    lastError: '线索池写入超时：连接超时',
    retryCount: 3,
    lastAttempt: '2026-11-27 09:02:00',
  },
  {
    id: 'SYNC-004',
    source: '官网预约表单',
    lastError: '线索池写入失败：字段校验失败',
    retryCount: 0,
    lastAttempt: '2026-11-26 18:20:00',
  },
];

export const STATUS_LABEL: Record<Booking['status'], string> = {
  confirmed: '已确认',
  visited: '已到访',
  no_show: '未到',
  cancelled: '已取消',
};
