import DashboardLayout from '../(dashboard)/layout';

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
} 