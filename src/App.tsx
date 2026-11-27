import { useEffect, useState } from 'react';
import VisitSchedulePage from './pages/VisitSchedulePage';
import BookingListPage from './pages/BookingListPage';
import SyncErrorsPage from './pages/SyncErrorsPage';

const NAV = [
  { hash: '#/schedule', label: '参观排班' },
  { hash: '#/bookings', label: '预约名单' },
  { hash: '#/sync-errors', label: '同步异常' },
];

function route(): string {
  const hash = window.location.hash || '#/schedule';
  return hash.split('?')[0];
}

export default function App() {
  const [current, setCurrent] = useState(route());
  useEffect(() => {
    const onHash = () => setCurrent(route());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <h1>官网运营后台 · 参观排班、预约名单与同步异常</h1>
      <p style={{ color: '#666' }}>样品：React + TypeScript + TDesign，接口先用 MSW mock，数据均为虚构。</p>
      <nav style={{ marginBottom: 24 }}>
        {NAV.map((item) => (
          <a key={item.hash} href={item.hash} style={{ marginRight: 12 }}>
            {item.label}
          </a>
        ))}
      </nav>
      {current === '#/schedule' && <VisitSchedulePage />}
      {current === '#/bookings' && <BookingListPage />}
      {current === '#/sync-errors' && <SyncErrorsPage />}
    </div>
  );
}
