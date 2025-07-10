// hooks/usePermissions.ts
'use client';
import { useState, useEffect } from 'react';

interface Permissions {
  isAdmin: boolean;
  isManager: boolean;
  canCreateImport: boolean;
  canDeleteImport: boolean;
  canEditImport: boolean;
  canViewImport: boolean;
  canValidateImport: boolean;
  // Ajout minimal pour les signaux
  canViewSignals: boolean;
  canCreateSignals: boolean;
  canEditSignals: boolean;
  canDeleteSignals: boolean;
  userRole: string;
}

export function usePermissions(): Permissions {
  const [permissions, setPermissions] = useState<Permissions>({
    isAdmin: false,
    isManager: false,
    canCreateImport: false,
    canDeleteImport: false,
    canEditImport: false,
    canViewImport: false,
    canValidateImport: false,
    // Ajout minimal pour les signaux
    canViewSignals: false,
    canCreateSignals: false,
    canEditSignals: false,
    canDeleteSignals: false,
    userRole: ''
  });

  useEffect(() => {
    const checkUserPermissions = () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        return {
          isAdmin: false,
          isManager: false,
          canCreateImport: false,
          canDeleteImport: false,
          canEditImport: false,
          canViewImport: false,
          canValidateImport: false,
          // Ajout minimal pour les signaux
          canViewSignals: false,
          canCreateSignals: false,
          canEditSignals: false,
          canDeleteSignals: false,
          userRole: ''
        };
      }

      try {
        // Décodage du token JWT pour vérifier le rôle
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const userRole = tokenData.role?.toLowerCase() || '';

        const isAdmin = userRole === 'admin';
        const isManager = userRole === 'gestionnaire';
        const isCoordinator = userRole === 'coordinateur';
        const isAssistantCoordinator = userRole === 'assistant_coordinateur';
        
        // Définir les permissions selon le rôle
        const newPermissions: Permissions = {
          isAdmin,
          isManager,
          userRole,
          // Permissions Import existantes (ne pas changer)
          canViewImport: isAdmin || isManager,
          canCreateImport: isAdmin || isManager,
          canEditImport: isAdmin || isManager,
          canDeleteImport: isAdmin, // Seuls les admins peuvent supprimer
          canValidateImport: isAdmin || isManager,
          
          // Permissions Signaux (ajout minimal)
          canViewSignals: isAdmin  || isCoordinator || isAssistantCoordinator,
          canCreateSignals: isAdmin  || isCoordinator || isAssistantCoordinator,
          canEditSignals: isAdmin  || isCoordinator || isAssistantCoordinator,
          canDeleteSignals: isAdmin || isCoordinator || isAssistantCoordinator,
        };

        return newPermissions;
      } catch (err) {
        console.error('Error checking user permissions:', err);
        return {
          isAdmin: false,
          isManager: false,
          canCreateImport: false,
          canDeleteImport: false,
          canEditImport: false,
          canViewImport: false,
          canValidateImport: false,
          // Ajout minimal pour les signaux
          canViewSignals: false,
          canCreateSignals: false,
          canEditSignals: false,
          canDeleteSignals: false,
          userRole: ''
        };
      }
    };

    setPermissions(checkUserPermissions());
  }, []);

  return permissions;
}