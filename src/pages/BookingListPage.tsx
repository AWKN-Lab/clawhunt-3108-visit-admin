import { useEffect, useState } from 'react';
import { Button } from 'tdesign-react';
import { getBookings, markBooking } from '../lib/api';
import type { Booking } from '../lib/mockData';
import { STATUS_LABEL } from '../lib/mockData';
import { maskName, maskPhone } from '../lib/masking';

/**
 * 预约名单：表格列 booking_no、到访时间、访客（打码）、公司、人数、
 * 目的、状态、来源，按日期与状态筛选；行内操作“标记到访”“标记未到”；
 * 导出当日名单需二次确认。访客姓名与手机号以打码形式显示（AC2）。
 */
export default function BookingListPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [message, setMessage] = useState('');
  const [showExportConfirm, setShowExportConfirm] = useState(false);

  useEffect(() => {
    void getBookings().then(setBookings);
  }, []);

  const shown = bookings.filter(
    (b) =>
      (filterDate === '' || b.date === filterDate) &&
      (filterStatus === '' || b.status === filterStatus),
  );

  async function mark(no: string, status: 'visited' | 'no_show') {
    await markBooking(no, status);
    setBookings((prev) => prev.map((b) => (b.booking_no === no ? { ...b, status } : b)));
    setMessage(`${no} 已标记为${STATUS_LABEL[status]}`);
  }

  return (
    <div>
      <h2>预约名单</h2>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <label>
          日期
          <input
            data-testid="filter-date"
            type="date"
            placeholder="选择日期"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </label>
        <label>
          状态
          <select
            data-testid="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">全部状态</option>
            <option value="confirmed">已确认</option>
            <option value="visited">已到访</option>
            <option value="no_show">未到</option>
            <option value="cancelled">已取消</option>
          </select>
        </label>
        <Button data-testid="export-button" onClick={() => setShowExportConfirm(true)}>
          导出当日名单
        </Button>
      </div>
      {message && <p data-testid="booking-message">{message}</p>}
      <table data-testid="booking-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>booking_no</th>
            <th>到访时间</th>
            <th>访客</th>
            <th>手机号</th>
            <th>公司</th>
            <th>人数</th>
            <th>目的</th>
            <th>状态</th>
            <th>来源</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((b) => (
            <tr key={b.booking_no}>
              <td>{b.booking_no}</td>
              <td>{b.visitTime}</td>
              <td>{maskName(b.visitorName)}</td>
              <td>{maskPhone(b.phone)}</td>
              <td>{b.company}</td>
              <td>{b.guests}</td>
              <td>{b.purpose}</td>
              <td>{STATUS_LABEL[b.status]}</td>
              <td>{b.source}</td>
              <td>
                <Button
                  data-testid={`mark-visited-${b.booking_no}`}
                  size="small"
                  onClick={() => void mark(b.booking_no, 'visited')}
                >
                  标记到访
                </Button>{' '}
                <Button
                  data-testid={`mark-no-show-${b.booking_no}`}
                  size="small"
                  onClick={() => void mark(b.booking_no, 'no_show')}
                >
                  标记未到
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showExportConfirm && (
        <div data-testid="export-confirm-dialog" role="alertdialog" aria-label="确认导出" style={{ border: '1px solid #ccc', padding: 16, marginTop: 16 }}>
          <h3>确认导出当日名单？</h3>
          <p>将导出当日全部预约名单（访客信息为打码形式）。</p>
          <Button
            data-testid="export-confirm-button"
            theme="primary"
            onClick={() => {
              setShowExportConfirm(false);
              setMessage('当日名单导出成功');
            }}
          >
            确认导出
          </Button>{' '}
          <Button onClick={() => setShowExportConfirm(false)}>取消</Button>
        </div>
      )}
    </div>
  );
}
