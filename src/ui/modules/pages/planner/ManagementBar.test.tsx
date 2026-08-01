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
vi.mock('@ui/hooks/useStoresReady', () => ({ useStoresReady: () => ({ areStoresReady: false }) }));
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
