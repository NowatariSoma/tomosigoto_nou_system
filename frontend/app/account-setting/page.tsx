import { redirect } from 'next/navigation';

export default function AccountSettingRedirect() {
  redirect('/settings');
}