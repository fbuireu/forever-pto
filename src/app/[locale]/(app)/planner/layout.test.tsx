import { EN, ES } from '@infrastructure/i18n/locales';
import { Fragment, Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSetRequestLocale = vi.fn();

const MockToaster = vi.fn().mockReturnValue(null);
const MockSiteSubtitle = vi.fn().mockReturnValue(null);
const MockSiteTitle = vi.fn().mockReturnValue(null);
const MockDonateClient = vi.fn().mockReturnValue(null);
const MockFooter = vi.fn().mockReturnValue(null);
const MockAppSidebar = vi.fn().mockReturnValue(null);
const MockStoresInitializer = vi.fn().mockReturnValue(null);

vi.mock('next-intl/server', () => ({ setRequestLocale: mockSetRequestLocale }));

vi.mock('next/dynamic', () => ({
  default: vi.fn().mockReturnValue(vi.fn().mockReturnValue(null)),
}));

vi.mock('@ui/modules/core/primitives/Sonner', () => ({ Toaster: MockToaster }));
vi.mock('@ui/modules/pages/planner/SiteSubtitle', () => ({ SiteSubtitle: MockSiteSubtitle }));
vi.mock('@ui/modules/pages/planner/SiteTitle', () => ({ SiteTitle: MockSiteTitle }));
vi.mock('@ui/modules/shared/donate/DonateClient', () => ({ DonateClient: MockDonateClient }));
vi.mock('@ui/modules/shared/footer/Footer', () => ({ Footer: MockFooter }));
vi.mock('@ui/modules/sidebar/AppSidebar', () => ({ AppSidebar: MockAppSidebar }));
vi.mock('@ui/modules/stores/StoresInitializer', () => ({ StoresInitializer: MockStoresInitializer }));

const { default: AppLayout } = await import('./layout');

const makeParams = (locale = EN) => ({
  children: 'planner-content',
  params: Promise.resolve({ locale: locale as never }),
});

const getAppSidebarEl = (element: { props: { children: unknown } }) => {
  const rootChildren = [element.props.children].flat();
  const suspenseEl = rootChildren.find((c: unknown) => (c as { type?: unknown })?.type === Suspense);
  const suspenseChildren = [(suspenseEl as { props: { children: unknown } })?.props.children].flat();
  return suspenseChildren.find((c: unknown) => (c as { type?: unknown })?.type === MockAppSidebar);
};

describe('planner/layout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls setRequestLocale with the resolved locale', async () => {
    await AppLayout(makeParams());
    expect(mockSetRequestLocale).toHaveBeenCalledWith(EN);
  });

  it('calls setRequestLocale with a different locale', async () => {
    await AppLayout(makeParams(ES));
    expect(mockSetRequestLocale).toHaveBeenCalledWith(ES);
  });

  it('renders a fragment as root element', async () => {
    const element = await AppLayout(makeParams());
    expect(element.type).toBe(Fragment);
  });

  it('renders AppSidebar with the resolved locale', async () => {
    const element = await AppLayout(makeParams(ES));
    const appSidebarEl = getAppSidebarEl(element);
    expect(appSidebarEl).toBeDefined();
    expect((appSidebarEl as { props: { locale: string } }).props.locale).toBe(ES);
  });

  it('renders SiteTitle inside AppSidebar', async () => {
    const element = await AppLayout(makeParams());
    const appSidebarEl = getAppSidebarEl(element);
    const innerChildren = [(appSidebarEl as { props: { children: unknown } }).props.children].flat();
    const types = innerChildren.map((c: unknown) => (c as { type?: unknown })?.type);
    expect(types).toContain(MockSiteTitle);
  });

  it('renders SiteSubtitle inside AppSidebar', async () => {
    const element = await AppLayout(makeParams());
    const appSidebarEl = getAppSidebarEl(element);
    const innerChildren = [(appSidebarEl as { props: { children: unknown } }).props.children].flat();
    const types = innerChildren.map((c: unknown) => (c as { type?: unknown })?.type);
    expect(types).toContain(MockSiteSubtitle);
  });

  it('renders Footer inside AppSidebar', async () => {
    const element = await AppLayout(makeParams());
    const appSidebarEl = getAppSidebarEl(element);
    const innerChildren = [(appSidebarEl as { props: { children: unknown } }).props.children].flat();
    const types = innerChildren.map((c: unknown) => (c as { type?: unknown })?.type);
    expect(types).toContain(MockFooter);
  });

  it('passes children inside AppSidebar', async () => {
    const child = 'planner-content';
    const element = await AppLayout({ children: child, params: Promise.resolve({ locale: EN as never }) });
    const appSidebarEl = getAppSidebarEl(element);
    const innerChildren = [(appSidebarEl as { props: { children: unknown } }).props.children].flat();
    expect(innerChildren).toContain(child);
  });
});
