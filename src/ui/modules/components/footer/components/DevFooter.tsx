'use client';

import { linkedinIcon } from '@ui/assets/icons/linkedin';
import { useEffect, useState } from 'react';
import { siBluesky as Bluesky, siBuymeacoffee as BuyMeCoffee, siGithub as Github } from 'simple-icons';
import { RotatingTextContainer } from 'src/components/animate-ui/primitives/texts/rotating';
import { RotatingText } from 'src/components/animate-ui/text/rotating';
import { Icon } from '../../core/Icon';

export const CONTACT_DETAILS = {
  NAME: 'Ferran Buireu',
  EMAIL_SUBJECT: 'Web contact submission - Forever PTO',
  ENCODED_EMAIL_SELF: btoa(process.env.NEXT_PUBLIC_EMAIL_SELF ?? ''),
} as const;

export const EMOJIS: string[] = ['☕', '🍺', '❤️', '🚀', '⚡', '🔥', '💻', '🌮', '🍕', '🎵', '🎮', '😴', '🤯', '💡'];

export const SOCIAL_NETWORKS = {
  GITHUB: {
    USERNAME: 'fbuireu',
    BASE_URL: 'https://github.com',
    ICON: Github,
    COLOR: 'light-dark(#24292f, #f0f6fc)',
  },
  LINKEDIN: {
    USERNAME: 'ferran-buireu',
    BASE_URL: 'https://linkedin.com/in',
    ICON: linkedinIcon,
    COLOR: '#0077B5',
  },
  BLUESKY: {
    USERNAME: 'fbuireu.bsky.social',
    BASE_URL: 'https://bsky.app/profile',
    ICON: Bluesky,
    COLOR: '#0085FF',
  },
  BUY_ME_A_COFFEE: {
    USERNAME: 'ferranbuireu',
    BASE_URL: 'https://www.buymeacoffee.com',
    ICON: BuyMeCoffee,
    COLOR: '#FFDD00',
  },
} as const;

export const DevFooter = () => {
  const [currentEmoji, setCurrentEmoji] = useState(EMOJIS[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className='container max-w-4xl px-4 py-4 flex flex-col items-center justify-center space-y-2 gap-4'>
      <div className='text-sm flex items-baseline gap-1.5 text-muted-foreground text-center'>
        Made with
        <RotatingTextContainer text={EMOJIS}>
          <RotatingText text={currentEmoji} transition={{ type: 'spring', bounce: 0.5, stiffness: 300, duration: 2 }} />
        </RotatingTextContainer>
        by
        <span className='font-medium text-foreground hover:text-primary p-0 h-auto min-w-0'>
          {CONTACT_DETAILS.NAME}
        </span>
      </div>
      <p className='text-sm text-muted-foreground text-center'>You can also find me</p>
      <div className='flex gap-5 items-center space-x-1 text-xs text-muted-foreground/70'>
        {Object.values(SOCIAL_NETWORKS).map((network) => (
          <a
            key={network.BASE_URL}
            href={`${network.BASE_URL}/${network.USERNAME}`}
            target='_blank'
            rel='noopener noreferrer'
            className='transition-all duration-200 hover:scale-110 hover:text-opacity-100'
            style={{ '--hover-color': network.COLOR } as React.CSSProperties & { '--hover-color': string }}
          >
            <Icon
              icon={network.ICON}
              size={24}
              className='transition-colors duration-200 hover:[color:var(--hover-color)]'
            />
          </a>
        ))}
      </div>
    </div>
  );
};
