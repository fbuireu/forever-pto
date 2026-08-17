import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockAcceptedService = vi.hoisted(() => vi.fn());

vi.mock('vanilla-cookieconsent', () => ({ acceptedService: mockAcceptedService }));

const {
  ANALYTICS_CATEGORY,
  ANALYTICS_SERVICE_IDS,
  BETTER_STACK_SERVICE_ID,
  GOOGLE_ANALYTICS_SERVICE_ID,
  allAnalyticsServices,
  consentedAnalyticsServices,
  isServiceConsented,
} = await import('./consent');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('the analytics service ids', () => {
  it('are read from the dialog config, so a new service cannot be missed here', () => {
    expect(ANALYTICS_SERVICE_IDS).toContain(GOOGLE_ANALYTICS_SERVICE_ID);
    expect(ANALYTICS_SERVICE_IDS).toContain(BETTER_STACK_SERVICE_ID);
  });
});

describe('isServiceConsented', () => {
  it('asks per service, never per category', () => {
    mockAcceptedService.mockReturnValue(true);

    isServiceConsented(GOOGLE_ANALYTICS_SERVICE_ID);

    expect(mockAcceptedService).toHaveBeenCalledWith(GOOGLE_ANALYTICS_SERVICE_ID, ANALYTICS_CATEGORY);
  });
});

describe('consentedAnalyticsServices', () => {
  it('reports one service off while the other is on, which asking the category could not', () => {
    mockAcceptedService.mockImplementation((id: string) => id === BETTER_STACK_SERVICE_ID);

    const consented = consentedAnalyticsServices();

    expect(consented[GOOGLE_ANALYTICS_SERVICE_ID]).toBe(false);
    expect(consented[BETTER_STACK_SERVICE_ID]).toBe(true);
  });

  it('covers every declared service, so a gate can never read undefined for one', () => {
    mockAcceptedService.mockReturnValue(false);

    expect(Object.keys(consentedAnalyticsServices()).toSorted()).toEqual([...ANALYTICS_SERVICE_IDS].toSorted());
  });
});

describe('allAnalyticsServices', () => {
  it('sets every service the same way, which is what accept-all and reject-all mean', () => {
    expect(Object.values(allAnalyticsServices(true)).every(Boolean)).toBe(true);
    expect(Object.values(allAnalyticsServices(false)).some(Boolean)).toBe(false);
    expect(Object.keys(allAnalyticsServices(true))).toHaveLength(ANALYTICS_SERVICE_IDS.length);
  });
});
