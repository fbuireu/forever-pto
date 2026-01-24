import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  pixelBasedPreset,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

interface ContactFormEmailProps {
  email: string;
  name: string;
  subject: string;
  message: string;
  baseUrl: string;
}

export const ContactFormEmail = ({ email, name, subject, message, baseUrl }: ContactFormEmailProps) => {
  const previewText = `New contact from ${name}: ${subject}`;

  return (
    <Html>
      <Head />
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
        }}
      >
        <Body className='mx-auto my-auto bg-gradient-to-br from-gray-50 to-gray-100 px-2 font-sans'>
          <Preview>{previewText}</Preview>
          <Container className='mx-auto my-10 max-w-141.25 rounded-xl border border-gray-200 border-solid bg-white p-8 shadow-lg'>
            <Section className='mt-2 mb-6'>
              <Img
                src={`${baseUrl}/static/forever-pto-logo.png`}
                width='48'
                height='44'
                alt='Forever PTO Logo'
                className='mx-auto my-0'
              />
            </Section>
            <Heading className='mx-0 my-0 mb-2 p-0 text-center font-bold text-[28px] text-gray-900 tracking-tight'>
              New Contact Message
            </Heading>
            <Text className='text-center text-[14px] text-gray-500 mt-0 mb-8'>
              📧 Someone reached out through your Forever PTO website
            </Text>
            <Section className='bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 my-6 border border-emerald-200 border-solid shadow-sm'>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tr>
                  <td style={{ padding: '8px 0' }}>
                    <Text className='text-[14px] text-gray-600 leading-5 margin-0'>
                      <strong className='text-gray-900'>From:</strong>
                    </Text>
                  </td>
                  <td style={{ padding: '8px 0' }}>
                    <Text className='text-[14px] text-gray-900 leading-5 margin-0 font-medium'>{name}</Text>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0' }}>
                    <Text className='text-[14px] text-gray-600 leading-5 margin-0'>
                      <strong className='text-gray-900'>Email:</strong>
                    </Text>
                  </td>
                  <td style={{ padding: '8px 0' }}>
                    <Link
                      href={`mailto:${email}`}
                      className='text-[14px] text-emerald-600 no-underline font-medium hover:text-emerald-700'
                    >
                      {email}
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0' }}>
                    <Text className='text-[14px] text-gray-600 leading-5 margin-0'>
                      <strong className='text-gray-900'>Subject:</strong>
                    </Text>
                  </td>
                  <td style={{ padding: '8px 0' }}>
                    <Text className='text-[14px] text-gray-900 leading-5 margin-0 font-medium'>{subject}</Text>
                  </td>
                </tr>
              </table>
            </Section>
            <Section className='my-6'>
              <Text className='text-[14px] text-gray-700 leading-5 font-semibold mb-3 mt-0'>Message:</Text>
              <Section className='bg-gray-50 rounded-xl p-5 border-l-4 border-emerald-500 border-solid shadow-sm'>
                <Text className='text-[15px] text-gray-800 leading-6 margin-0 whitespace-pre-wrap font-normal'>
                  {message}
                </Text>
              </Section>
            </Section>
            <Section className='mt-8 mb-8 text-center'>
              <Button
                className='rounded-lg bg-emerald-600 px-8 py-3.5 text-center font-semibold text-[15px] text-white no-underline shadow-md hover:bg-emerald-700 transition-colors'
                href={`mailto:${email}?subject=Re: ${subject}`}
              >
                ↩️ Reply to {name}
              </Button>
            </Section>
            <Hr className='mx-0 my-8 w-full border border-gray-200 border-solid' />
            <Text className='text-gray-500 text-[12px] leading-5.5 text-center'>
              This message was sent through the contact form on{' '}
              <Link href='https://forever-pto.com' className='text-emerald-600 no-underline font-medium'>
                forever-pto.com
              </Link>
              <br />
              <span className='text-gray-400'>If this looks like spam, you can safely ignore this email.</span>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
