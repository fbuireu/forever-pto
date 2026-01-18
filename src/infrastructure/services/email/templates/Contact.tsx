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
        <Body className='mx-auto my-auto bg-white px-2 font-sans'>
          <Preview>{previewText}</Preview>
          <Container className='mx-auto my-10 max-w-141.25 rounded border border-[#eaeaea] border-solid p-5'>
            <Section className='mt-8'>
              <Img
                src={`${baseUrl}/static/forever-pto-logo.png`}
                width='40'
                height='37'
                alt='Forever PTO Logo'
                className='mx-auto my-0'
              />
            </Section>

            <Heading className='mx-0 my-7.5 p-0 text-center font-normal text-[24px] text-black'>
              📧 New Contact Form Submission
            </Heading>

            <Text className='text-[16px] text-black leading-6 font-semibold'>
              Someone reached out through your Forever PTO contact form:
            </Text>

            <Section className='bg-[#f0fdf4] rounded-lg p-5 my-5 border border-[#dcfce7] border-solid'>
              <Text className='text-[14px] text-black leading-5 margin-0'>
                <strong>From:</strong> {name}
              </Text>
              <Text className='text-[14px] text-black leading-5 margin-0'>
                <strong>Email:</strong>
                <Link href={`mailto:${email}`} className='text-[#059669] no-underline font-medium'>
                  {email}
                </Link>
              </Text>
              <Text className='text-[14px] text-black leading-5 margin-0'>
                <strong>Subject:</strong> {subject}
              </Text>
            </Section>

            <Text className='text-[14px] text-black leading-5 font-semibold'>Message:</Text>
            <Section className='bg-[#f9f9f9] rounded-lg p-4 border-l-4 border-[#059669] border-solid'>
              <Text className='text-[14px] text-black leading-5.5 margin-0 whitespace-pre-wrap'>{message}</Text>
            </Section>

            <Section className='mt-8 mb-8 text-center'>
              <Button
                className='rounded bg-[#059669] px-6 py-3 text-center font-semibold text-[14px] text-white no-underline'
                href={`mailto:${email}?subject=Re: ${subject}`}
              >
                Reply to {name}
              </Button>
            </Section>

            <Hr className='mx-0 my-6.5 w-full border border-[#eaeaea] border-solid' />

            <Text className='text-[#666666] text-[12px] leading-5'>
              This message was sent through the contact form on{' '}
              <Link href='https://forever-pto.com' className='text-[#059669] no-underline'>
                forever-pto.com
              </Link>
              . If this looks like spam, you can safely ignore this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
