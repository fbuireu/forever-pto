import { EMAIL_PALETTE } from "@application/email/palette";
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
} from "react-email";

interface ContactFormEmailProps {
	email: string;
	name: string;
	subject: string;
	message: string;
	baseUrl: string;
}

export const ContactFormEmail = ({ email, name, subject, message, baseUrl }: ContactFormEmailProps) => {
	const previewText = `New contact form submission from ${name}: ${subject}`;

	return (
		<Html>
			<Tailwind
				config={{
					presets: [pixelBasedPreset],
					theme: { extend: { colors: EMAIL_PALETTE } },
				}}
			>
				<Head />
				<Body className="mx-auto my-auto bg-linear-to-br from-email-page-from to-email-page-to px-2 font-sans">
					<Preview>{previewText}</Preview>
					<Container className="mx-auto my-10 max-w-141.25 rounded-xl border border-email-line border-solid bg-email-card p-8 shadow-lg">
						<Section className="mt-2 mb-6 text-center">
							<Heading className="inline-block m-0 mr-2 text-[28px] font-bold align-middle">Forever</Heading>
							<Img
								src={`${baseUrl}/static/images/forever-pto-logo.png`}
								width="48"
								height="44"
								alt="Forever PTO Logo"
								className="inline-block align-middle m-0"
							/>
						</Section>
						<Heading className="mx-0 my-0 mb-2 p-0 text-center font-bold text-[28px] text-email-ink tracking-tight">
							New Contact Message
						</Heading>
						<Text className="text-center text-[14px] text-email-muted mt-0 mb-8">
							{name} reached out through your Forever PTO website
						</Text>
						<Section className="bg-linear-to-br from-email-wash-from to-email-wash-to rounded-xl p-6 my-6 border border-brand-teal border-solid shadow-sm">
							<div className="mb-2">
								<Text className="text-[14px] text-email-label leading-5 m-0 inline-block mr-2">
									<strong className="text-email-ink">From:</strong>
								</Text>
								<Text className="text-[14px] text-email-ink leading-5 m-0 inline-block font-medium">{name}</Text>
							</div>
							<div className="mb-2">
								<Text className="text-[14px] text-email-label leading-5 m-0 inline-block mr-2">
									<strong className="text-email-ink">Email:</strong>
								</Text>
								<Link
									href={`mailto:${encodeURIComponent(email)}`}
									className="text-[14px] text-brand-teal no-underline font-medium inline-block"
								>
									{email}
								</Link>
							</div>
							<div>
								<Text className="text-[14px] text-email-label leading-5 m-0 inline-block mr-2">
									<strong className="text-email-ink">Subject:</strong>
								</Text>
								<Text className="text-[14px] text-email-ink leading-5 m-0 inline-block font-medium">{subject}</Text>
							</div>
						</Section>
						<Section className="my-6">
							<Text className="text-[14px] text-email-strong leading-5 font-semibold mb-3 mt-0">Message:</Text>
							<Section className="bg-email-well rounded-xl p-5 border border-email-line border-solid shadow-sm">
								<Text className="text-[15px] text-email-body leading-6 m-0 whitespace-pre-wrap font-normal">
									{message}
								</Text>
							</Section>
						</Section>
						<Section className="mt-8 mb-8 text-center">
							<Button
								className="rounded-lg bg-brand-teal px-8 py-3.5 text-center font-semibold text-[15px] text-email-inverse no-underline shadow-md"
								href={`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Re: ${subject}`)}`}
							>
								Reply to {name}
							</Button>
						</Section>
						<Hr className="mx-0 my-8 w-full border border-email-line border-t-email-line border-solid" />
						<Text className="text-email-muted text-[12px] leading-5.5 text-center">
							This message was sent through the contact form on{" "}
							<Link href={baseUrl} className="text-brand-teal no-underline font-medium">
								{new URL(baseUrl).hostname}
							</Link>
							<br />
							<span className="text-email-faint">If this looks like spam, you can safely ignore this email.</span>
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};
