import { useEffect, useState } from 'react';
import { Button, Checkbox } from 'tdesign-react';
import { batchRetrySyncErrors, getSyncErrors, retrySyncError } from '../lib/api';
import type { SyncError } from '../lib/mockData';

/**
 * 同步异常：列出写入招商线索池失败的记录（编号、来源、最后错误、
 * 重试次数、最后尝试时间），支持单条重试与勾选后批量重试，
 * 结果以消息提示。批量重试对每条勾选记录各发一次重试请求（AC3）。
 */
export default function SyncErrorsPage() {
  const [errors, setErrors] = useState<SyncError[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void getSyncErrors().then(setErrors);
  }, []);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function retryOne(id: string) {
    await retrySyncError(id);
    setErrors((prev) => prev.map((e) => (e.id === id ? { ...e, retryCount: e.retryCount + 1 } : e)));
    setMessage(`重试成功：${id}`);
  }

  async function retryBatch() {
    const ids = [...selected];
    await batchRetrySyncErrors(ids);
    setErrors((prev) =>
      prev.map((e) => (ids.includes(e.id) ? { ...e, retryCount: e.retryCount + 1 } : e)),
    );
    setSelected([]);
    setMessage(`批量重试完成：成功 ${ids.length} 条`);
  }

  return (
    <div>
      <h2>同步异常</h2>
      <Button
        data-testid="batch-retry-button"
        theme="primary"
        disabled={selected.length === 0}
        onClick={() => void retryBatch()}
      >
        批量重试（已选 {selected.length} 条）
      </Button>
      {message && <p data-testid="retry-message">{message}</p>}
      <table data-testid="sync-table" style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>选择</th>
            <th>编号</th>
            <th>来源</th>
            <th>最后错误</th>
            <th>重试次数</th>
            <th>最后尝试时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {errors.map((e) => (
            <tr key={e.id}>
              <td>
                <Checkbox
                  data-testid={`select-${e.id}`}
                  checked={selected.includes(e.id)}
                  onChange={() => toggle(e.id)}
                />
              </td>
              <td>{e.id}</td>
              <td>{e.source}</td>
              <td>{e.lastError}</td>
              <td>{e.retryCount}</td>
              <td>{e.lastAttempt}</td>
              <td>
                <Button data-testid={`retry-${e.id}`} size="small" onClick={() => void retryOne(e.id)}>
                  重试
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
