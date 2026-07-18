import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { LandingPage } from '@/components/landing-page';

export default async function HomePage() {
  const { isAuthenticated } = getKindeServerSession();
  const signedIn = Boolean(await isAuthenticated());
  return <LandingPage signedIn={signedIn} />;
}
