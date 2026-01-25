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
  pixelBasedPreset,
  Preview,
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

const BRAND_COLORS = {
  yellow: '#eab308',
  teal: '#14b8a6',
  orange: '#f97316',
  purple: '#a855f7',
};

export const ContactFormEmail = ({ email, name, subject, message, baseUrl }: ContactFormEmailProps) => {
  const previewText = `New contact from ${name}: ${subject}`;

  return (
    <Html>
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              colors: {
                brand: BRAND_COLORS,
              },
            },
          },
        }}
      >
        <Head />
        <Body className='mx-auto my-auto bg-linear-to-br from-gray-50 to-gray-100 px-2 font-sans'>
          <Preview>{previewText}</Preview>
          <Container className='mx-auto my-10 max-w-141.25 rounded-xl border border-gray-200 border-solid bg-white p-8 shadow-lg'>
            <Section className='mt-2 mb-6 text-center'>
              <Heading className='inline-block m-0 mr-2 text-[28px] font-bold align-middle'>Forever</Heading>
              <Img
                src={`${baseUrl}/static/logo/forever-pto-logo.png`}
                width='48'
                height='44'
                alt='Forever PTO Logo'
                className='inline-block align-middle m-0'
              />
            </Section>
            <Heading className='mx-0 my-0 mb-2 p-0 text-center font-bold text-[28px] text-gray-900 tracking-tight'>
              New Contact Message
            </Heading>
            <Text className='text-center text-[14px] text-gray-500 mt-0 mb-8'>
              {name} reached out through your Forever PTO website
            </Text>
            <Section className='bg-linear-to-br from-teal-50 to-orange-50 rounded-xl p-6 my-6 border border-brand-teal border-solid shadow-sm'>
              <div className='mb-2'>
                <Text className='text-[14px] text-gray-600 leading-5 m-0 inline-block mr-2'>
                  <strong className='text-gray-900'>From:</strong>
                </Text>
                <Text className='text-[14px] text-gray-900 leading-5 m-0 inline-block font-medium'>{name}</Text>
              </div>
              <div className='mb-2'>
                <Text className='text-[14px] text-gray-600 leading-5 m-0 inline-block mr-2'>
                  <strong className='text-gray-900'>Email:</strong>
                </Text>
                <Link
                  href={`mailto:${email}`}
                  className='text-[14px] text-brand-teal no-underline font-medium inline-block'
                >
                  {email}
                </Link>
              </div>
              <div>
                <Text className='text-[14px] text-gray-600 leading-5 m-0 inline-block mr-2'>
                  <strong className='text-gray-900'>Subject:</strong>
                </Text>
                <Text className='text-[14px] text-gray-900 leading-5 m-0 inline-block font-medium'>{subject}</Text>
              </div>
            </Section>
            <Section className='my-6'>
              <Text className='text-[14px] text-gray-700 leading-5 font-semibold mb-3 mt-0'>Message:</Text>
              <Section className='bg-gray-50 rounded-xl p-5 border-l-4 border-brand-teal border-solid shadow-sm'>
                <Text className='text-[15px] text-gray-800 leading-6 m-0 whitespace-pre-wrap font-normal'>
                  {message}
                </Text>
              </Section>
            </Section>
            <Section className='mt-8 mb-8 text-center'>
              <Button
                className='rounded-lg bg-brand-teal px-8 py-3.5 text-center font-semibold text-[15px] text-white no-underline shadow-md'
                href={`mailto:${email}?subject=Re: ${subject}`}
              >
                Reply to {name}
              </Button>
            </Section>
            <Hr className='mx-0 my-8 w-full border border-gray-200 border-solid' />
            <Text className='text-gray-500 text-[12px] leading-5.5 text-center'>
              This message was sent through the contact form on{' '}
              <Link href='https://forever-pto.com' className='text-brand-teal no-underline font-medium'>
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
