'use client';
import { ReactNode } from 'react';
import Header from '@/app/index/components/Header';
import Sidebar from '@/app/index/components/Sidebar';  
import { SidebarProvider } from '@/contexts/SidebarContext';
import { UserProvider } from '@/contexts/UserContext';
import AuthGuard from '@/components/AuthGuard';




interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthGuard>
    <UserProvider>
    <SidebarProvider>
      <div className="dashboard-wrapper">
        <Sidebar />
        <div className="content-area">
          <Header />
          <div className="page-content">
            {children}
          </div>
        </div>
      </div>
      <style jsx>{`
        .page-content {
          padding: 80px 20px 20px 20px; /* Ajuster selon la hauteur de votre header */
        }
      `}</style>
    </SidebarProvider>
    </UserProvider>
    </AuthGuard>


  );
}