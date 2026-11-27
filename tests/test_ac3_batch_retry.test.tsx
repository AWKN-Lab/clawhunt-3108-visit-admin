import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SyncErrorsPage from '../src/pages/SyncErrorsPage';
import { getRetryRequests } from '../src/mocks/handlers';

describe('AC3 同步异常批量重试', () => {
  it('勾选 3 条并点击批量重试后，mock 收到 3 次重试请求', async () => {
    render(<SyncErrorsPage />);
    await screen.findByTestId('sync-table');
    fireEvent.click(screen.getByTestId('select-SYNC-001'));
    fireEvent.click(screen.getByTestId('select-SYNC-002'));
    fireEvent.click(screen.getByTestId('select-SYNC-003'));
    fireEvent.click(screen.getByTestId('batch-retry-button'));
    expect(await screen.findByTestId('retry-message')).toHaveTextContent('批量重试完成：成功 3 条');
    expect(getRetryRequests()).toEqual(['SYNC-001', 'SYNC-002', 'SYNC-003']);
  });

  it('单条重试只发一次请求，重试次数 +1', async () => {
    render(<SyncErrorsPage />);
    await screen.findByTestId('sync-table');
    fireEvent.click(screen.getByTestId('retry-SYNC-004'));
    expect(await screen.findByTestId('retry-message')).toHaveTextContent('重试成功：SYNC-004');
    expect(getRetryRequests()).toEqual(['SYNC-004']);
  });

  it('未勾选时批量重试按钮不可点，点击也不发请求', async () => {
    render(<SyncErrorsPage />);
    const button = await screen.findByTestId('batch-retry-button');
    expect(button).toHaveClass('t-is-disabled');
    fireEvent.click(button);
    expect(getRetryRequests()).toEqual([]);
  });
});
