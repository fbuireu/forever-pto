import { HolidayRefusal, type HolidayOutcome } from '@application/stores/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import en from '@i18n/messages/en.json';

const { mockToastError, mockToastSuccess } = vi.hoisted(() => ({
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock('sonner', () => ({ toast: { error: mockToastError, success: mockToastSuccess } }));

vi.mock('@application/stores/holidays', () => ({
  useHolidaysStore: (selector: (state: unknown) => unknown) =>
    selector({ holidays: [], currentSelection: null, alternatives: [], suggestion: null }),
}));

vi.mock('@ui/modules/pages/planner/calendar/Calendar', () => ({
  Calendar: () => null,
  CalendarSelectionMode: { SINGLE: 'single' },
}));

const { HolidayFormModal, HolidayFormMode } = await import('./HolidayFormModal');

const DATE = new Date(2026, 4, 1);

type Commit = (data: { name: string; date: Date }) => HolidayOutcome | null;

const renderModal = (onCommit: Commit) =>
  render(
    <NextIntlClientProvider locale='en' messages={en}>
      <HolidayFormModal
        open
        onClose={vi.fn()}
        locale='en'
        mode={HolidayFormMode.ADD}
        icon={null}
        defaultValues={{ name: 'Company shutdown', date: DATE }}
        onCommit={onCommit}
        successDescription={() => 'saved'}
      />
    </NextIntlClientProvider>
  );

beforeEach(() => vi.clearAllMocks());

describe('HolidayFormModal', () => {
  it('reports the store outcome as a success toast when the commit lands', async () => {
    const onCommit = vi.fn(() => ({ applied: true as const }));
    renderModal(onCommit);

    await userEvent.click(screen.getByRole('button', { name: en.modals.addHoliday.submit }));

    expect(onCommit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Company shutdown' }));
    expect(mockToastSuccess).toHaveBeenCalledWith(en.modals.addHoliday.successTitle, { description: 'saved' });
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('renders the refusal the store gave, not a guess of its own', async () => {
    const onCommit = vi.fn(() => ({ applied: false as const, reason: HolidayRefusal.DATE_HELD_BY_HOLIDAY }));
    renderModal(onCommit);

    await userEvent.click(screen.getByRole('button', { name: en.modals.addHoliday.submit }));

    expect(mockToastError).toHaveBeenCalledOnce();
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it('falls back to its own error copy for a refusal with no message of its own', async () => {
    const onCommit = vi.fn(() => ({ applied: false as const, reason: 'unmapped' as never }));
    renderModal(onCommit);

    await userEvent.click(screen.getByRole('button', { name: en.modals.addHoliday.submit }));

    expect(mockToastError).toHaveBeenCalledWith(en.modals.addHoliday.errorTitle, {
      description: en.modals.addHoliday.errorDescription,
    });
  });

  it('stays silent when the caller answers null, which is how Edit says nothing changed', async () => {
    const onCommit = vi.fn(() => null);
    renderModal(onCommit);

    await userEvent.click(screen.getByRole('button', { name: en.modals.addHoliday.submit }));

    expect(onCommit).toHaveBeenCalledOnce();
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(mockToastError).not.toHaveBeenCalled();
  });
});
