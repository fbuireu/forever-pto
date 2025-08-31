import type React from 'react';

export type FaqItem = {
  id: string;
  question: string;
  answer: string | React.ReactNode;
};

export type FaqSection = {
  id: string;
  title: string;
  items: FaqItem[];
};

export type FaqData = FaqSection[];
