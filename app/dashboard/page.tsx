import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const role = session.user.role;
  if (role === 'ADMIN') {
    redirect('/admin/dashboard');
  } else if (role === 'PROJECT_MANAGER') {
    redirect('/manager/dashboard');
  } else {
    redirect('/member/dashboard');
  }
}

