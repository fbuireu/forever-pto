import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDrive, mockSetSteps, mockDestroy, mockDriverInstance, mockDriverFn, mockUnmount, mockRender, mockRoot, mockCreateRoot } = vi.hoisted(() => {
  const mockDrive = vi.fn();
  const mockSetSteps = vi.fn();
  const mockDestroy = vi.fn();
  const mockDriverInstance = { drive: mockDrive, setSteps: mockSetSteps, destroy: mockDestroy };
  const mockDriverFn = vi.fn().mockReturnValue(mockDriverInstance);
  const mockUnmount = vi.fn();
  const mockRender = vi.fn();
  const mockRoot = { render: mockRender, unmount: mockUnmount };
  const mockCreateRoot = vi.fn().mockReturnValue(mockRoot);
  return { mockDrive, mockSetSteps, mockDestroy, mockDriverInstance, mockDriverFn, mockUnmount, mockRender, mockRoot, mockCreateRoot };
});

vi.mock('driver.js', () => ({ driver: mockDriverFn }));
vi.mock('react-dom/client', () => ({ createRoot: mockCreateRoot }));
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

const mockIconContainer = { style: {} as CSSStyleDeclaration, appendChild: vi.fn() };

function getCallbacks() {
  const client = new DriverClient({});
  client.start();
  const config = mockDriverFn.mock.calls[0][0] as {
    onPopoverRender: (popover: unknown, options: unknown) => void;
    onDestroyStarted: (el: unknown, step: unknown, opts: unknown) => void;
  };
  return { client, onPopoverRender: config.onPopoverRender, onDestroyStarted: config.onDestroyStarted };
}

function makePopover(closeButton: unknown = null, nextButton: unknown = null) {
  return { wrapper: { querySelector: vi.fn().mockReturnValue(closeButton) }, nextButton };
}

describe('DriverClient - onPopoverRender', () => {
  beforeEach(() => {
    vi.stubGlobal('document', { createElement: vi.fn().mockReturnValue(mockIconContainer) });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('forwards to config.onPopoverRender when provided', () => {
    const userCallback = vi.fn();
    const client = new DriverClient({ onPopoverRender: userCallback });
    client.start();
    const { onPopoverRender } = mockDriverFn.mock.calls[0][0] as { onPopoverRender: (p: unknown, o: unknown) => void };
    const popover = makePopover();
    const options = { state: { activeIndex: 0 }, config: {} };
    onPopoverRender(popover, options);
    expect(userCallback).toHaveBeenCalledWith(popover, options);
  });

  it('renders close icon into button when close button exists', () => {
    const { onPopoverRender } = getCallbacks();
    const mockCloseButton = { innerHTML: '', appendChild: vi.fn() };
    onPopoverRender(makePopover(mockCloseButton), { state: { activeIndex: 0 }, config: { steps: [{}, {}] } });
    expect(mockCreateRoot).toHaveBeenCalled();
    expect(mockRender).toHaveBeenCalled();
  });

  it('does not call createRoot when close button is absent', () => {
    const { onPopoverRender } = getCallbacks();
    onPopoverRender(makePopover(null), { state: { activeIndex: 0 }, config: {} });
    expect(mockCreateRoot).not.toHaveBeenCalled();
  });

  it('adds driver-popover-done-btn class on the last step', () => {
    const { onPopoverRender } = getCallbacks();
    const steps = [{}, {}];
    const mockNextButton = { classList: { add: vi.fn() } };
    onPopoverRender(makePopover(null, mockNextButton), { state: { activeIndex: 1 }, config: { steps } });
    expect(mockNextButton.classList.add).toHaveBeenCalledWith('driver-popover-done-btn');
  });

  it('does not add done-btn class when not on last step', () => {
    const { onPopoverRender } = getCallbacks();
    const steps = [{}, {}];
    const mockNextButton = { classList: { add: vi.fn() } };
    onPopoverRender(makePopover(null, mockNextButton), { state: { activeIndex: 0 }, config: { steps } });
    expect(mockNextButton.classList.add).not.toHaveBeenCalled();
  });
});

describe('DriverClient - onDestroyStarted', () => {
  beforeEach(() => {
    vi.stubGlobal('document', { createElement: vi.fn().mockReturnValue(mockIconContainer) });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('forwards to config.onDestroyStarted when provided', () => {
    const userCallback = vi.fn();
    const client = new DriverClient({ onDestroyStarted: userCallback });
    client.start();
    const { onDestroyStarted } = mockDriverFn.mock.calls[0][0] as { onDestroyStarted: (a: unknown, b: unknown, c: unknown) => void };
    onDestroyStarted(null, null, null);
    expect(userCallback).toHaveBeenCalledWith(null, null, null);
  });

  it('unmounts all tracked close button roots', () => {
    const { onPopoverRender, onDestroyStarted } = getCallbacks();
    const mockCloseButton = { innerHTML: '', appendChild: vi.fn() };
    onPopoverRender(makePopover(mockCloseButton), { state: { activeIndex: 0 }, config: {} });
    onDestroyStarted(null, null, null);
    expect(mockUnmount).toHaveBeenCalledOnce();
  });

  it('destroys the underlying driver instance', () => {
    const { onDestroyStarted } = getCallbacks();
    onDestroyStarted(null, null, null);
    expect(mockDestroy).toHaveBeenCalledOnce();
  });
});
