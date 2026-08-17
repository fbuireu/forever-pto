import { describe, expect, it, vi } from 'vitest';

const MockErrorContent = vi.fn().mockReturnValue(null);

vi.mock('@ui/modules/pages/error/ErrorContent', () => ({
  ErrorContent: MockErrorContent,
}));

const { default: ErrorPage } = await import('./error');

const mockError = Object.assign(new Error('test error'), { digest: 'abc123' });
const mockReset = vi.fn();

describe('(marketing)/error', () => {
  it('renders ErrorContent directly without a wrapper', () => {
    const element = ErrorPage({ error: mockError, reset: mockReset });
    expect(element.type).toBe(MockErrorContent);
  });

  it('forwards error to ErrorContent', () => {
    const element = ErrorPage({ error: mockError, reset: mockReset });
    expect(element.props.error).toBe(mockError);
  });

  it('forwards reset to ErrorContent', () => {
    const element = ErrorPage({ error: mockError, reset: mockReset });
    expect(element.props.reset).toBe(mockReset);
  });
});
