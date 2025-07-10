// src/app/ActivityLog/page.tsx
import ActivityLogClient from '@/components/ActivityLog/ActivityLogClient';
import './ActivityLog.css';

export const metadata = {
  title: 'Journal d\'activité',
  description: 'Suivi des activités de l\'application',
};

export default function ActivityLogPage() {
  return <ActivityLogClient />;
}