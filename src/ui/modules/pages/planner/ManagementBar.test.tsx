import deMessages from '@i18n/messages/de.json';
import esMessages from '@i18n/messages/es.json';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

const holidaysState = {
  alternatives: [],
  suggestion: null,
  currentSelection: null,
  setPreviewAlternativeSelection: vi.fn(),
  setCurrentAlternativeSelection: vi.fn(),
  previewAlternativeIndex: 0,
  currentSelectionIndex: 0,
};

vi.mock('@application/stores/holidays', () => ({
  useHolidaysStore: (selector: (state: typeof holidaysState) => unknown) => selector(holidaysState),
}));
vi.mock('@ui/hooks/useMobile', () => ({ useIsMobile: () => true }));
const readyState = { areStoresReady: false };
vi.mock('@ui/hooks/useStoresReady', () => ({ useStoresReady: () => readyState }));
vi.mock('@ui/modules/core/animate/base/Sidebar', () => ({ useSidebar: () => ({ openMobile: false }) }));
vi.mock('@ui/modules/core/animate/base/Drawer', () => ({
  Drawer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DrawerContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DrawerTitle: ({ children }: { children: ReactNode }) => <h2 data-testid='drawer-title'>{children}</h2>,
}));
vi.mock('boneyard-js/react', () => ({ Skeleton: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));
vi.mock('./Legend', () => ({ LegendItems: () => null }));
vi.mock('./PlannerPanel', () => ({ PlannerPanel: () => null }));
vi.mock('./PlannerPanelFixture', () => ({ PlannerPanelFixture: () => null }));

import { ManagementBar } from './ManagementBar';

const renderBar = (locale: string, messages: object) =>
  render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ManagementBar />
    </NextIntlClientProvider>
  );

describe('ManagementBar mobile drawer', () => {
  it('announces the localised planner heading in German', () => {
    const { getByTestId } = renderBar('de', deMessages);
    expect(getByTestId('drawer-title').textContent).toBe(deMessages.planner.heading);
  });

  it('announces the localised planner heading in Spanish', () => {
    const { getByTestId } = renderBar('es', esMessages);
    expect(getByTestId('drawer-title').textContent).toBe('Planificador');
  });
});

describe('ManagementBar drawer header', () => {
  const makeSuggestion = (effectiveDays: number, efficiency: number) => ({
    days: [new Date(2026, 0, 5)],
    bridges: [],
    metrics: { totalEffectiveDays: effectiveDays, averageEfficiency: efficiency },
  });

  const applied = makeSuggestion(4, 2);
  const previewed = makeSuggestion(9, 4.5);

  it('numbers the option the metrics beside it belong to, not the applied one', () => {
    readyState.areStoresReady = true;
    holidaysState.suggestion = applied as never;
    holidaysState.currentSelection = applied as never;
    holidaysState.alternatives = [previewed] as never;
    holidaysState.currentSelectionIndex = 0;
    holidaysState.previewAlternativeIndex = 1;

    const { container } = renderBar('es', esMessages);
    const text = container.textContent ?? '';

    expect(text).toContain(`${esMessages.alternativesManager.option} 2`);
    expect(text).toContain('9');
    expect(text).toContain('4.5x');

    readyState.areStoresReady = false;
    holidaysState.suggestion = null;
    holidaysState.currentSelection = null;
    holidaysState.alternatives = [];
    holidaysState.previewAlternativeIndex = 0;
  });
});
