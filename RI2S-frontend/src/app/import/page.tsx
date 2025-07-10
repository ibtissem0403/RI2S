// app/import/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import ImportFileList from '@/components/ImportFileList/ImportFileList';
import ImportUploadForm from '@/components/ImportUploadForm/ImportUploadForm';
import Modal from '@/components/Modal/Modal';
import { usePermissions } from '@/hooks/usePermissions';
import AuthGuard from '@/components/AuthGuard';
import './import.css';

const breadcrumbItems = [
  { label: 'Accueil', href: '/index' },
  { label: 'Importation de données', href: '/imports' }
];

export default function ImportPage() {
  const router = useRouter();
  const permissions = usePermissions();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [experimentationFilter, setExperimentationFilter] = useState('all');

  // Vérifier les permissions d'accès à la page
  useEffect(() => {
    if (!permissions.canViewImport && permissions.userRole) {
      // L'utilisateur n'a pas les permissions pour accéder à cette page
      router.push('/index');
      return;
    }
  }, [permissions, router]);

  // Fetch files on component mount and when filters change
  useEffect(() => {
    if (permissions.canViewImport) {
      fetchFiles();
    }
  }, [statusFilter, experimentationFilter, permissions.canViewImport]);
  
  const fetchFiles = async () => {
    try {
      setIsLoading(!isRefreshing);
      setError(null);
      
      // Build query params
      let queryParams = new URLSearchParams();
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);
      if (experimentationFilter !== 'all') queryParams.append('experimentation', experimentationFilter);
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) throw new Error('Authentification requise');
      
      const response = await axios.get(
        `http://localhost:5000/api/import?${queryParams.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setFiles(response.data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFiles();
  };
  
  const handleFileUpload = async (formData) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) throw new Error('Authentification requise');
      
      await axios.post(
        'http://localhost:5000/api/import',
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      
      setShowUploadModal(false);
      handleRefresh();
      return { success: true };
    } catch (err) {
      console.error("Upload error:", err);
      return { 
        success: false, 
        error: err.response?.data?.message || err.message || "Erreur lors de l'importation" 
      };
    }
  };
  
  const handleDeleteFile = async (fileId) => {
    try {
      // Vérifier à nouveau si l'utilisateur peut supprimer
      if (!permissions.canDeleteImport) {
        setError("Vous n'avez pas les droits pour supprimer des fichiers");
        return false;
      }
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) throw new Error('Authentification requise');
      
      await axios.delete(
        `http://localhost:5000/api/import/${fileId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      handleRefresh();
      return true;
    } catch (err) {
      console.error("Delete error:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
      return false;
    }
  };

  // Si l'utilisateur n'a pas les permissions, ne pas afficher la page
  if (!permissions.canViewImport && permissions.userRole) {
    return null;
  }
  
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="import-container">
          <div className="breadcrumbs-container">
            <Breadcrumbs items={breadcrumbItems} showBackButton={false} />
          </div>
          
          <div className="import-header">
            <h1 className="import-title">Importation de données</h1>
            <div className="import-actions">
              <button 
                className="import-refresh-btn"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <i className={`fas fa-sync ${isRefreshing ? "fa-spin" : ""}`}></i>
                {isRefreshing ? "Actualisation..." : "Actualiser"}
              </button>
              
              {/* N'afficher le bouton d'import que pour les utilisateurs autorisés */}
              {permissions.canCreateImport && (
                <button 
                  className="import-upload-btn"
                  onClick={() => setShowUploadModal(true)}
                >
                  <i className="fas fa-file-upload"></i>
                  Importer un fichier
                </button>
              )}
            </div>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError(null)} className="error-close">×</button>
            </div>
          )}
          
          <ImportFileList 
            files={files}
            isLoading={isLoading}
            error={error}
            onRefresh={handleRefresh}
            onPreview={(id) => router.push(`/imports/${id}`)}
            onDelete={handleDeleteFile}
            canDelete={permissions.canDeleteImport}
            canEdit={permissions.canEditImport}
          />
          
          {/* Modal d'upload - visible seulement si l'utilisateur peut créer des imports */}
          {permissions.canCreateImport && (
            <Modal
              isOpen={showUploadModal}
              onClose={() => setShowUploadModal(false)}
              title="Importer un fichier"
              size="medium"
            >
              <ImportUploadForm 
                onSubmit={handleFileUpload} 
                isAdmin={permissions.isAdmin}
                onClose={() => setShowUploadModal(false)}
              />
            </Modal>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}