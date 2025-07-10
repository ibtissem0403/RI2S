import type { ReactNode } from 'react';
//import AuthGuard from '@/components/AuthGuard';
import './globals.css';

interface LoginLayoutProps {
  children: ReactNode;
}

export default function LoginLayout({ children }: LoginLayoutProps) {
  return (
    <div className="login-page">
      <section className="login-container">
        {children}
      </section>
    </div>
  );
}