import type { ReactNode } from 'react';

type FaqItem = {
  id: string;
  question: string;
  answer: string | ReactNode;
};

type FaqSection = {
  id: string;
  title: string;
  items: FaqItem[];
};

export type FaqData = FaqSection[];
