import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import VisitSchedulePage from '../src/pages/VisitSchedulePage';
import { closeConfirmText, countConfirmedBookings } from '../src/lib/schedule';
import { INITIAL_BOOKINGS } from '../src/lib/mockData';

describe('AC1 关闭含已确认预约的时段', () => {
  it('countConfirmedBookings：2026-11-30-s1 有 2 个已确认预约', () => {
    expect(countConfirmedBookings('2026-11-30-s1', INITIAL_BOOKINGS)).toBe(2);
    expect(countConfirmedBookings('2026-12-01-s3', INITIAL_BOOKINGS)).toBe(0);
    expect(closeConfirmText(2)).toBe('将取消 2 个预约并短信通知访客');
  });

  it('关闭含 2 个已确认预约的时段，确认框显示将取消的预约数量', async () => {
    render(<VisitSchedulePage />);
    const button = await screen.findByTestId('close-slot-2026-11-30-s1');
    fireEvent.click(button);
    const reason = await screen.findByPlaceholderText('请填写关闭原因');
    fireEvent.change(reason, { target: { value: '场地维修' } });
    fireEvent.click(screen.getByText('下一步'));
    const dialog = await screen.findByTestId('close-confirm-dialog');
    expect(within(dialog).getByTestId('close-confirm-text')).toHaveTextContent(
      '将取消 2 个预约并短信通知访客',
    );
  });

  it('关闭无已确认预约的时段，确认框显示将取消 0 个预约', async () => {
    render(<VisitSchedulePage />);
    const button = await screen.findByTestId('close-slot-2026-12-01-s3');
    fireEvent.click(button);
    const reason = await screen.findByPlaceholderText('请填写关闭原因');
    fireEvent.change(reason, { target: { value: '临时闭馆' } });
    fireEvent.click(screen.getByText('下一步'));
    const dialog = await screen.findByTestId('close-confirm-dialog');
    expect(within(dialog).getByTestId('close-confirm-text')).toHaveTextContent(
      '将取消 0 个预约并短信通知访客',
    );
  });

  it('确认关闭后时段变已关闭，消息报已取消 2 个预约', async () => {
    render(<VisitSchedulePage />);
    const button = await screen.findByTestId('close-slot-2026-11-30-s1');
    fireEvent.click(button);
    const reason = await screen.findByPlaceholderText('请填写关闭原因');
    fireEvent.change(reason, { target: { value: '场地维修' } });
    fireEvent.click(screen.getByText('下一步'));
    await screen.findByTestId('close-confirm-dialog');
    fireEvent.click(screen.getByTestId('confirm-close-button'));
    expect(await screen.findByTestId('schedule-message')).toHaveTextContent(
      '时段已关闭，已取消 2 个预约并短信通知访客',
    );
    expect(screen.queryByTestId('close-slot-2026-11-30-s1')).toBeNull();
  });

  it('关闭时段不填原因时不进入确认框', async () => {
    render(<VisitSchedulePage />);
    const button = await screen.findByTestId('close-slot-2026-11-30-s1');
    fireEvent.click(button);
    fireEvent.click(screen.getByText('下一步'));
    expect(await screen.findByTestId('schedule-message')).toHaveTextContent('关闭时段须填写原因');
    expect(screen.queryByTestId('close-confirm-dialog')).toBeNull();
  });
});
