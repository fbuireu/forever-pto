import { render } from '@react-email/render';
import { describe, expect, it } from 'vitest';
import { ContactFormEmail } from './Contact';

const BASE_PROPS = {
  email: 'alice@example.com',
  name: 'Alice Smith',
  subject: 'Hello there',
  message: 'This is my message.',
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL,
};

const getHtml = (props = BASE_PROPS) => render(ContactFormEmail(props));

describe('ContactFormEmail', () => {
  it('renders without throwing', async () => {
    await expect(getHtml()).resolves.toBeDefined();
  });

  it('includes the preview text with name and subject', async () => {
    const html = await getHtml();
    expect(html).toContain('Alice Smith');
    expect(html).toContain('Hello there');
  });

  it('renders the sender name', async () => {
    const html = await getHtml();
    expect(html).toContain('Alice Smith');
  });

  it('renders a mailto link for the sender email', async () => {
    const html = await getHtml();
    expect(html).toContain('mailto:alice@example.com');
  });

  it('renders the subject', async () => {
    const html = await getHtml();
    expect(html).toContain('Hello there');
  });

  it('renders the message body', async () => {
    const html = await getHtml();
    expect(html).toContain('This is my message.');
  });

  it('reply button links to mailto with subject prefixed Re:', async () => {
    const html = await getHtml();
    expect(html).toContain('mailto:alice@example.com?subject=Re: Hello there');
  });

  it('logo src uses baseUrl', async () => {
    const html = await getHtml();
    expect(html).toContain(`${process.env.NEXT_PUBLIC_SITE_URL}/static/logo/forever-pto-logo.png`);
  });

  it('logo src updates when baseUrl changes', async () => {
    const html = await getHtml({ ...BASE_PROPS, baseUrl: 'https://staging.example.com' });
    expect(html).toContain('https://staging.example.com/static/logo/forever-pto-logo.png');
  });
});
