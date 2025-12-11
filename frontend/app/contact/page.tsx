'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { ContactForm } from '@/features/contact/components';
import { MessageSquare } from 'lucide-react';

export default function Page() {
  return (
    <AppTemplate
      title="お問い合わせ"
      description="ご質問やご要望をお気軽にお寄せください"
      icon={<MessageSquare className="h-8 w-8 text-black" />}
      maxWidth="4xl"
    >
      <ContactForm />
    </AppTemplate>
  );
}

