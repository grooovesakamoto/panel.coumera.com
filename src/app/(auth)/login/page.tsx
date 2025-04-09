'use client';

import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#E6FBFF] to-white p-4">
      <LoginForm />
    </div>
  );
} 