'use client';

import { blueskyIcon } from '@ui/assets/icons/bluesky';
import { buyMeACoffeeIcon } from '@ui/assets/icons/buymeacoffee';
import { githubIcon } from '@ui/assets/icons/github';
import { linkedinIcon } from '@ui/assets/icons/linkedin';
import { RotatingTextContainer } from '@ui/components/animate/primitives/texts/rotating';
import { RotatingText } from '@ui/components/animate/text/rotating';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../core/Icon';

export const CONTACT_DETAILS = {
  NAME: 'Ferran Buireu',
} as const;

export const EMOJIS: string[] = ['☕', '🍺', '❤️', '🚀', '⚡', '🔥', '💻', '🌮', '🍕', '🎵', '🎮', '😴', '🤯', '💡'];

export const SOCIAL_NETWORKS = {
  GITHUB: {
    USERNAME: 'fbuireu',
    BASE_URL: 'https://github.com',
    ICON: githubIcon,
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
    ICON: blueskyIcon,
    COLOR: '#0085FF',
  },
  BUY_ME_A_COFFEE: {
    USERNAME: 'ferranbuireu',
    BASE_URL: 'https://www.buymeacoffee.com',
    ICON: buyMeACoffeeIcon,
    COLOR: '#FFDD00',
  },
} as const;

const getRandomEmoji = () => EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

export const DevFooter = () => {
  const t = useTranslations('devFooter');
  const [currentEmoji, setCurrentEmoji] = useState(EMOJIS[0]);
  const intervalRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    setCurrentEmoji(getRandomEmoji());
    intervalRef.current = setInterval(() => {
      setCurrentEmoji(getRandomEmoji());
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className='container max-w-4xl px-4 py-4 flex flex-col items-center justify-center space-y-2 gap-4'>
      <div className='text-sm flex items-baseline gap-1.5 text-muted-foreground text-center'>
        {t('madeWith')}
        <RotatingTextContainer text={EMOJIS}>
          <RotatingText text={currentEmoji} transition={{ type: 'spring', bounce: 0.5, stiffness: 300, duration: 2 }} />
        </RotatingTextContainer>
        {t('by')}
        <span className='font-medium text-foreground hover:text-primary p-0 h-auto min-w-0'>
          {CONTACT_DETAILS.NAME}
        </span>
      </div>
      <p className='text-sm text-muted-foreground text-center'>{t('findMeOn')}</p>
      <div className='flex gap-5 items-center space-x-1 text-xs text-muted-foreground/70'>
        {Object.entries(SOCIAL_NETWORKS).map(([key, network]) => (
          <a
            key={key}
            href={`${network.BASE_URL}/${network.USERNAME}`}
            target='_blank'
            rel='noopener noreferrer'
            aria-label={`Visit my ${key.toLowerCase().replace('_', ' ')} profile`}
            className='inline-flex items-center justify-center min-w-11 min-h-11 transition-all duration-200 hover:scale-110 hover:text-opacity-100'
            style={{ '--hover-color': network.COLOR } as React.CSSProperties & { '--hover-color': string }}
          >
            <Icon icon={network.ICON} size={24} className='transition-colors duration-200 hover:text-(--hover-color)' />
          </a>
        ))}
      </div>
    </div>
  );
};
