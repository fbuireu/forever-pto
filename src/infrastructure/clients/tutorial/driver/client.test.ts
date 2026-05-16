import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDrive, mockSetSteps, mockDestroy, mockDriverInstance, mockDriverFn } = vi.hoisted(() => {
  const mockDrive = vi.fn();
  const mockSetSteps = vi.fn();
  const mockDestroy = vi.fn();
  const mockDriverInstance = { drive: mockDrive, setSteps: mockSetSteps, destroy: mockDestroy };
  const mockDriverFn = vi.fn().mockReturnValue(mockDriverInstance);
  return { mockDrive, mockSetSteps, mockDestroy, mockDriverInstance, mockDriverFn };
});

vi.mock('driver.js', () => ({ driver: mockDriverFn }));
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn().mockReturnValue({ render: vi.fn(), unmount: vi.fn() }),
}));
vi.mock('@ui/modules/core/animate/icons/Icon', () => ({ AnimateIcon: () => null }));
vi.mock('@ui/modules/core/animate/icons/X', () => ({ X: () => null }));

const { DriverClient, getDriverClientInstance } = await import('./client');

beforeEach(() => {
  vi.clearAllMocks();
  mockDriverFn.mockReturnValue(mockDriverInstance);
});

describe('getDriverClientInstance', () => {
  it('returns the same instance on repeated calls', () => {
    const a = getDriverClientInstance();
    const b = getDriverClientInstance();
    expect(a).toBe(b);
  });

  it('returns a DriverClient', () => {
    expect(getDriverClientInstance()).toBeInstanceOf(DriverClient);
  });
});

describe('DriverClient.start', () => {
  it('calls drive() on the underlying driver', () => {
    const client = new DriverClient({});
    client.start();
    expect(mockDrive).toHaveBeenCalledOnce();
  });

  it('calls setSteps when steps are provided', () => {
    const steps = [{ element: '#foo', popover: { title: 'Step 1' } }];
    const client = new DriverClient({});
    client.start(steps);
    expect(mockSetSteps).toHaveBeenCalledWith(steps);
    expect(mockDrive).toHaveBeenCalledOnce();
  });

  it('destroys existing driver before starting a new one', () => {
    const client = new DriverClient({});
    client.start();
    client.start();
    expect(mockDestroy).toHaveBeenCalledOnce();
    expect(mockDrive).toHaveBeenCalledTimes(2);
  });

  it('applies overrides to config', () => {
    const client = new DriverClient({ showProgress: false });
    client.start(undefined, { showProgress: true });
    expect(mockDriverFn).toHaveBeenCalledWith(expect.objectContaining({ showProgress: true }));
  });
});

describe('DriverClient.destroy', () => {
  it('calls destroy() on the underlying driver', () => {
    const client = new DriverClient({});
    client.start();
    client.destroy();
    expect(mockDestroy).toHaveBeenCalledOnce();
  });

  it('does nothing when no driver has been initialised', () => {
    const client = new DriverClient({});
    client.destroy();
    expect(mockDestroy).not.toHaveBeenCalled();
  });
});
