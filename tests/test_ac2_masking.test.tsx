import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BookingListPage from '../src/pages/BookingListPage';
import { maskName, maskPhone } from '../src/lib/masking';

describe('AC2 预约名单访客打码', () => {
  it('maskName：三字姓名保留首尾', () => {
    expect(maskName('张小明')).toBe('张*明');
    expect(maskName('李红')).toBe('李*');
    expect(maskName('王')).toBe('*');
  });

  it('maskPhone：11 位手机号保留前 3 后 4', () => {
    expect(maskPhone('13812345678')).toBe('138****5678');
    expect(maskPhone('13987654321')).toBe('139****4321');
  });

  it('名单表格显示打码后的姓名与手机号，不出现完整手机号', async () => {
    render(<BookingListPage />);
    const table = await screen.findByTestId('booking-table');
    expect(table).toHaveTextContent('张*明');
    expect(table).toHaveTextContent('138****5678');
    expect(table).toHaveTextContent('李*红');
    expect(table).toHaveTextContent('139****4321');
    expect(table).not.toHaveTextContent('13812345678');
    expect(table).not.toHaveTextContent('13987654321');
    expect(table).not.toHaveTextContent('张小明');
  });

  it('按日期筛选后只剩当日预约', async () => {
    render(<BookingListPage />);
    await screen.findByTestId('booking-table');
    fireEvent.change(screen.getByPlaceholderText('选择日期'), { target: { value: '2026-12-02' } });
    const table = screen.getByTestId('booking-table');
    expect(table).toHaveTextContent('BK-20261202-001');
    expect(table).not.toHaveTextContent('BK-20261130-001');
  });

  it('标记到访后状态变为已到访', async () => {
    render(<BookingListPage />);
    await screen.findByTestId('booking-table');
    fireEvent.click(screen.getByTestId('mark-visited-BK-20261130-001'));
    expect(await screen.findByTestId('booking-message')).toHaveTextContent(
      'BK-20261130-001 已标记为已到访',
    );
  });

  it('导出当日名单须二次确认，确认后提示导出成功', async () => {
    render(<BookingListPage />);
    await screen.findByTestId('booking-table');
    fireEvent.click(screen.getByTestId('export-button'));
    const dialog = await screen.findByTestId('export-confirm-dialog');
    expect(dialog).toHaveTextContent('确认导出当日名单？');
    fireEvent.click(screen.getByTestId('export-confirm-button'));
    expect(await screen.findByTestId('booking-message')).toHaveTextContent('当日名单导出成功');
  });
});
