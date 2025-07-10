'use client';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import WidgetCard from './components/WidgetCard';
import ExperimentationList from '@/components/experimentation/ExperimentationList';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { useRouter } from 'next/navigation';
import './globals.css';
import './dashboard.css';
import AuthGuard from '@/components/AuthGuard';

export default function IndexPage() {
  const router = useRouter();
  
  return (
    <AuthGuard>
    <SidebarProvider>
      <div className="dashboard-wrapper">
        <Sidebar />
        <div className="content-area">
          <Header />
          <main className="dashboard-main">
            {/* Section 1 : Expérimentations avec la liste dynamique */}
            <ExperimentationList />
            
            {/* Section 2 : Gestion */}
            <section className="dashboard-section">
              <h2><i className="fas fa-tasks"></i> Gestion du projet</h2>
              <div className="widget-grid">
                <WidgetCard
                  title="Recrutement"
                  description="Recueil des données des bénéficiaires"
                  iconClass="fas fa-user-check"
                  variant="success"
                  onClick={() => router.push('/beneficiaires')}
                />
                <WidgetCard
                  title="Formulaires"
                  description="Création et gestion des formulaires"
                  iconClass="fas fa-file-alt"
                  variant="warning"
                  onClick={() => router.push('/formulaires')}
                />
                <WidgetCard
                  title="Utilisateurs"
                  description="Gestion des utilisateurs et des droits"
                  iconClass="fas fa-user-cog"
                  variant="danger"
                  onClick={() => router.push('/utilisateurs')}
                />
                <WidgetCard
                  title="Rapports"
                  description="Génération de rapports et analyses"
                  iconClass="fas fa-chart-pie"
                  variant="primary"
                  onClick={() => router.push('/rapports')}
                />
              </div>
            </section>
          </main>
          
          <footer className="dashboard-footer">
            <p>© 2025 RI2S - Système de gestion de projet</p>
          </footer>
        </div>
      </div>
    </SidebarProvider>
    </AuthGuard>
  );
}