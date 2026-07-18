import { redirect } from 'next/navigation';

export default function SignUpPage() {
  redirect('/api/auth/register');
}
