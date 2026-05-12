import type React from 'react';

type FaqItem = {
  id: string;
  question: string;
  answer: string | React.ReactNode;
};

type FaqSection = {
  id: string;
  title: string;
  items: FaqItem[];
};

export type FaqData = FaqSection[];
