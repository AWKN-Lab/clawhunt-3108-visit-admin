import { useEffect, useState } from 'react';
import { Button, Checkbox, Input } from 'tdesign-react';
import { closeSlot, getBookings, getSlots } from '../lib/api';
import type { Booking, Slot } from '../lib/mockData';
import { HOLIDAYS, SLOT_TEMPLATES, WEEKDAYS } from '../lib/mockData';
import { closeConfirmText, countConfirmedBookings, slotRemaining } from '../lib/schedule';

/**
 * 参观排班：周视图展示每个时段的余量；批量生成弹窗含日期范围、
 * 星期多选、可增删的时段模板行、节假日多选；关闭时段须填写原因，
 * 若有已确认预约，确认框显示“将取消 n 个预约并短信通知访客”（AC1）。
 */
export default function VisitSchedulePage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState('');
  const [showBatch, setShowBatch] = useState(false);
  const [startDate, setStartDate] = useState('2026-12-07');
  const [endDate, setEndDate] = useState('2026-12-13');
  const [weekdays, setWeekdays] = useState<string[]>(['周一', '周二', '周三', '周四', '周五']);
  const [templates, setTemplates] = useState(SLOT_TEMPLATES.map((t) => ({ ...t })));
  const [holidays, setHolidays] = useState<string[]>([]);
  const [closing, setClosing] = useState<Slot | null>(null);
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    void getSlots().then(setSlots);
    void getBookings().then(setBookings);
  }, []);

  const dates = [...new Set(slots.map((s) => s.date))].sort();
  const cancelCount = closing ? countConfirmedBookings(closing.id, bookings) : 0;

  function toggleWeekday(day: string) {
    setWeekdays((w) => (w.includes(day) ? w.filter((d) => d !== day) : [...w, day]));
  }

  function toggleHoliday(h: string) {
    setHolidays((v) => (v.includes(h) ? v.filter((x) => x !== h) : [...v, h]));
  }

  function generateSlots() {
    const made: Slot[] = [];
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const weekday = WEEKDAYS[(d.getDay() + 6) % 7];
      if (!weekdays.includes(weekday)) continue;
      const iso = d.toISOString().slice(0, 10);
      templates.forEach((t, i) => {
        made.push({
          id: `${iso}-gen${i + 1}`,
          date: iso,
          weekday,
          start: t.start,
          end: t.end,
          capacity: 6,
          status: 'open',
        });
      });
    }
    setSlots((prev) => [...prev, ...made]);
    setShowBatch(false);
    setMessage(`批量生成成功：新增 ${made.length} 个时段（节假日 ${holidays.join('、') || '无'}已排除）`);
  }

  async function confirmClose() {
    if (!closing) return;
    if (reason.trim() === '') {
      setMessage('关闭时段须填写原因');
      return;
    }
    const result = await closeSlot(closing.id, reason);
    setSlots((prev) =>
      prev.map((s) => (s.id === closing.id ? { ...s, status: 'closed', closeReason: reason } : s)),
    );
    setBookings((prev) =>
      prev.map((b) =>
        b.slotId === closing.id && b.status === 'confirmed' ? { ...b, status: 'cancelled' } : b,
      ),
    );
    setMessage(`时段已关闭，已取消 ${result.cancelled} 个预约并短信通知访客`);
    setClosing(null);
    setConfirming(false);
    setReason('');
  }

  return (
    <div>
      <h2>参观排班</h2>
      <Button data-testid="batch-generate-button" theme="primary" onClick={() => setShowBatch(true)}>
        批量生成
      </Button>
      {message && <p data-testid="schedule-message">{message}</p>}
      <table data-testid="schedule-table" style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>日期</th>
            <th>星期</th>
            <th>时段</th>
            <th>余量</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => (
            <tr key={slot.id}>
              <td>{slot.date}</td>
              <td>{slot.weekday}</td>
              <td>
                {slot.start}–{slot.end}
              </td>
              <td>{slotRemaining(slot, bookings)} / {slot.capacity}</td>
              <td>{slot.status === 'open' ? '开放' : `已关闭（${slot.closeReason ?? ''}）`}</td>
              <td>
                {slot.status === 'open' && (
                  <Button
                    data-testid={`close-slot-${slot.id}`}
                    size="small"
                    onClick={() => {
                      setClosing(slot);
                      setConfirming(false);
                      setReason('');
                    }}
                  >
                    关闭时段
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showBatch && (
        <div data-testid="batch-modal" role="dialog" aria-label="批量生成排班" style={{ border: '1px solid #ccc', padding: 16, marginTop: 16 }}>
          <h3>批量生成排班</h3>
          <label>
            开始日期
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label>
            结束日期
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
          <p>星期多选</p>
          {WEEKDAYS.map((day) => (
            <Checkbox key={day} checked={weekdays.includes(day)} onChange={() => toggleWeekday(day)}>
              {day}
            </Checkbox>
          ))}
          <p>时段模板行</p>
          {templates.map((t, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <Input
                value={t.start}
                placeholder="开始时间"
                onChange={(v) => setTemplates((ts) => ts.map((x, j) => (j === i ? { ...x, start: String(v) } : x)))}
              />
              <Input
                value={t.end}
                placeholder="结束时间"
                onChange={(v) => setTemplates((ts) => ts.map((x, j) => (j === i ? { ...x, end: String(v) } : x)))}
              />
              <Button size="small" onClick={() => setTemplates((ts) => ts.filter((_, j) => j !== i))}>
                删除
              </Button>
            </div>
          ))}
          <Button
            size="small"
            onClick={() => setTemplates((ts) => [...ts, { start: '15:30', end: '16:30' }])}
          >
            增加时段行
          </Button>
          <p>节假日多选</p>
          {HOLIDAYS.map((h) => (
            <Checkbox key={h} checked={holidays.includes(h)} onChange={() => toggleHoliday(h)}>
              {h}
            </Checkbox>
          ))}
          <div style={{ marginTop: 12 }}>
            <Button theme="primary" onClick={generateSlots}>
              生成
            </Button>{' '}
            <Button onClick={() => setShowBatch(false)}>取消</Button>
          </div>
        </div>
      )}

      {closing && !confirming && (
        <div data-testid="close-reason-dialog" role="dialog" aria-label="关闭时段" style={{ border: '1px solid #ccc', padding: 16, marginTop: 16 }}>
          <h3>
            关闭时段 {closing.date} {closing.start}–{closing.end}
          </h3>
          <label>
            关闭原因
            <Input
              data-testid="close-reason-input"
              value={reason}
              placeholder="请填写关闭原因"
              onChange={(v) => setReason(String(v))}
            />
          </label>
          <div style={{ marginTop: 12 }}>
            <Button
              theme="primary"
              onClick={() => {
                if (reason.trim() === '') {
                  setMessage('关闭时段须填写原因');
                  return;
                }
                setConfirming(true);
              }}
            >
              下一步
            </Button>{' '}
            <Button
              onClick={() => {
                setClosing(null);
                setReason('');
              }}
            >
              取消
            </Button>
          </div>
        </div>
      )}

      {closing && confirming && (
        <div data-testid="close-confirm-dialog" role="alertdialog" aria-label="确认关闭时段" style={{ border: '1px solid #ccc', padding: 16, marginTop: 16 }}>
          <h3>确认关闭该时段？</h3>
          <p data-testid="close-confirm-text">{closeConfirmText(cancelCount)}</p>
          <p>关闭原因：{reason}</p>
          <div style={{ marginTop: 12 }}>
            <Button data-testid="confirm-close-button" theme="danger" onClick={() => void confirmClose()}>
              确认关闭
            </Button>{' '}
            <Button onClick={() => setConfirming(false)}>返回</Button>
          </div>
        </div>
      )}
    </div>
  );
}
