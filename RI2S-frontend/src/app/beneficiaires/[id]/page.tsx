'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BeneficiaireDetail from '@/components/BeneficiaireDetail/BeneficiaireDetail';
import DashboardLayout from '@/components/DashboardLayout';

interface BeneficiaireDetailPageProps {
  params: {
    id: string;
  };
}

export default function BeneficiaireDetailPage({ params }: BeneficiaireDetailPageProps) {
  const router = useRouter();
  
  // Utilisation de React.use pour déballer params si c'est une Promise
  // Mais comme nous sommes dans un 'use client' component, params est déjà un objet
  const resolvedParams = React.use ? 
    (params instanceof Promise ? React.use(params) : params) : 
    params;
  
  const id = resolvedParams?.id;
  
  // Force l'ID à être une chaîne de caractères et supprime les espaces
  const cleanId = id ? String(id).trim() : '';
  
  useEffect(() => {
    if (!cleanId || cleanId === 'undefined') {
      console.error("ID du bénéficiaire invalide dans les paramètres:", id);
      router.push('/beneficiaires');
    }
  }, [cleanId, id, router]);

  // Retirer le DashboardLayout car il est probablement déjà inclus dans le layout parent
  return cleanId && cleanId !== 'undefined' ? (
    <BeneficiaireDetail beneficiaireId={cleanId} />
  ) : (
    <div className="benef-detail-loading">
      <div className="benef-detail-spinner"></div>
      <p>Chargement des données...</p>
    </div>
  );
}