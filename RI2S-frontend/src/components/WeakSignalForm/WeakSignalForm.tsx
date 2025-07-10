// "use client";
// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import axios from "axios";
// import { Contact, WeakSignalFormData } from "@/types/models";
// import "./addsignal.css";
// import "@fortawesome/fontawesome-free/css/all.min.css";
// import Breadcrumbs from "@/components/Breadcrumbs/Breadcrumbs";
// import Notification, { NotificationType } from "@/components/Notification/Notification";
// import AuthGuard from "@/components/AuthGuard";

// const breadcrumbItems = [
//   { label: "Accueil", href: "/index" },
//   { label: "Signaux Faibles", href: "/signals" },
//   { label: "Ajouter", isCurrentPage: true },
// ];

// interface WeakSignalFormProps {
//   initialData?: Partial<WeakSignalFormData>;
//   isEdit?: boolean;
//   onCancel?: () => void;
// }

// export default function WeakSignalForm({
//   initialData = {},
//   isEdit = false,
//   onCancel = () => window.history.back()
// }: WeakSignalFormProps) {
//   const router = useRouter();
  
//   // État pour les notifications
//   const [notification, setNotification] = useState<{
//     type: NotificationType;
//     message: string;
//     isVisible: boolean;
//   }>({
//     type: 'info',
//     message: '',
//     isVisible: false
//   });

//   const [formData, setFormData] = useState<WeakSignalFormData>({
//     beneficiary: initialData.beneficiary || "",
//     receptionDate: initialData.receptionDate || new Date().toISOString().split("T")[0],
//     signalType: initialData.signalType || "",
//     description: initialData.description || "",
//     source: initialData.source || "",
//     notes: initialData.notes || "",
//     status: initialData.status || "Nouveau",
//     contacts: initialData.contacts || [],
//     coordinator: initialData.coordinator || ""
//   });

//   // État pour la gestion des contacts
//   const [showContactForm, setShowContactForm] = useState(false);
//   const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);
//   const [newContact, setNewContact] = useState<Contact>({
//     contactedPerson: {
//       name: '',
//       profession: ''
//     },
//     contactDate: new Date().toISOString().split('T')[0],
//     contactMethod: 'Téléphone',
//     contactSubject: '',
//     contactContent: '',
//     response: {
//       hasResponse: false
//     }
//   });

//   const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   // Ajout d'un state pour l'utilisateur connecté
//   const [currentUser, setCurrentUser] = useState<{
//     _id: string;
//     fullName: string;
//     email: string;
//   } | null>(null);

//   // État pour les erreurs
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [contactError, setContactError] = useState<string>('');

//   // Fonction pour afficher une notification
//   const showNotification = (type: NotificationType, message: string) => {
//     setNotification({
//       type,
//       message,
//       isVisible: true
//     });
//   };

//   // Réinitialiser le formulaire de contact
//   const resetContactForm = () => {
//     setNewContact({
//       contactedPerson: {
//         name: '',
//         profession: ''
//       },
//       contactDate: new Date().toISOString().split('T')[0],
//       contactMethod: 'Téléphone',
//       contactSubject: '',
//       contactContent: '',
//       response: {
//         hasResponse: false
//       }
//     });
//     setEditingContactIndex(null);
//     setShowContactForm(false);
//     setContactError('');
//   };

//   // Chargement de l'utilisateur connecté
//   useEffect(() => {
//     const fetchCurrentUser = async () => {
//       try {
//         const token =
//           localStorage.getItem("token") || sessionStorage.getItem("token");
//         if (!token) return;

//         const response = await axios.get("http://localhost:5000/api/auth/me", {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         console.log("Données de l'utilisateur connecté:", response.data);
//         setCurrentUser(response.data.user);
//         // Mettre à jour le coordinateur avec l'ID de l'utilisateur connecté
//         setFormData(prev => ({
//           ...prev,
//           coordinator: response.data.user._id
//         }));
//       } catch (err) {
//         console.error("Failed to fetch current user:", err);
//         showNotification('error', 'Erreur lors du chargement des données utilisateur');
//       }
//     };

//     fetchCurrentUser();
//   }, []);

//   // Chargement de la liste des bénéficiaires
//   useEffect(() => {
//     const fetchBeneficiaries = async () => {
//       try {
//         // Utiliser le même endpoint que dans l'ancien code fonctionnel
//         const token =
//           localStorage.getItem("token") || sessionStorage.getItem("token");
//         if (!token) throw new Error("Authentification requise");

//         const response = await axios.get(
//           "http://localhost:5000/api/beneficiaries",
//           { headers: { Authorization: `Bearer ${token}` } }
//         );

//         console.log("Réponse complète des bénéficiaires:", response);
//         console.log("Données des bénéficiaires:", response.data);
        
//         if (!response.data || response.data.length === 0) {
//           console.warn("Aucun bénéficiaire trouvé dans la réponse");
//           showNotification('warning', 'Aucun bénéficiaire disponible');
//         }

//         // Conserver la même structure de données que l'ancien code fonctionnel
//         setBeneficiaries(response.data || []);
//       } catch (err) {
//         console.error("Erreur lors du chargement des bénéficiaires:", err);
//         setErrors(prev => ({...prev, beneficiary: "Impossible de charger la liste des bénéficiaires"}));
//         showNotification('error', 'Erreur lors du chargement des bénéficiaires');
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchBeneficiaries();
//   }, []);

//   // Gestionnaire de changement pour les champs principaux
//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
    
//     if (name === "beneficiary") {
//       // Trouver le bénéficiaire sélectionné
//       const selectedBeneficiary = beneficiaries.find((b) => b.id === value);
//       console.log("Bénéficiaire sélectionné:", selectedBeneficiary);

//       // Essayer d'extraire le realBeneficiary._id
//       if (selectedBeneficiary && selectedBeneficiary.realBeneficiary) {
//         const realId = selectedBeneficiary.realBeneficiary._id;
//         console.log("ID réel extrait:", realId);
//         setFormData((prev) => ({ ...prev, beneficiary: realId }));
//       } else {
//         setFormData((prev) => ({ ...prev, beneficiary: value }));
//       }
//     } else {
//       setFormData(prev => ({ ...prev, [name]: value }));
//     }
    
//     // Effacer l'erreur pour ce champ
//     if (errors[name]) {
//       setErrors(prev => ({ ...prev, [name]: '' }));
//     }
//   };

//   // Gestionnaire de changement pour le nouveau contact
//   const handleNewContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
    
//     if (name.startsWith('contactedPerson.')) {
//       const field = name.split('.')[1];
//       setNewContact(prev => ({
//         ...prev,
//         contactedPerson: {
//           ...prev.contactedPerson,
//           [field]: value
//         }
//       }));
//     } else if (name.startsWith('response.')) {
//       const field = name.split('.')[1];
//       setNewContact(prev => ({
//         ...prev,
//         response: {
//           ...prev.response,
//           [field]: value,
//           hasResponse: field === 'content' ? !!value : prev.response?.hasResponse || false
//         }
//       }));
//     } else {
//       setNewContact(prev => ({ ...prev, [name]: value }));
//     }

//     // Effacer l'erreur de contact
//     if (contactError) {
//       setContactError('');
//     }
//   };

//   // Ajouter ou modifier un contact
//   const handleSaveContact = () => {
//     if (!newContact.contactedPerson.name.trim() || !newContact.contactSubject.trim()) {
//       setContactError('Veuillez remplir au minimum le nom de la personne et le sujet du contact');
//       return;
//     }

//     const contactToSave: Contact = {
//       ...newContact,
//       contactedBy: currentUser?._id || ''
//     };

//     if (editingContactIndex !== null) {
//       // Modification d'un contact existant
//       setFormData(prev => ({
//         ...prev,
//         contacts: prev.contacts?.map((contact, index) => 
//           index === editingContactIndex ? contactToSave : contact
//         ) || [contactToSave]
//       }));
//       showNotification('success', 'Contact modifié avec succès');
//     } else {
//       // Ajout d'un nouveau contact
//       setFormData(prev => ({
//         ...prev,
//         contacts: [...(prev.contacts || []), contactToSave]
//       }));
//       showNotification('success', 'Contact ajouté avec succès');
//     }

//     resetContactForm();
//   };

//   // Commencer l'édition d'un contact
//   const handleEditContact = (index: number) => {
//     const contact = formData.contacts?.[index];
//     if (contact) {
//       setNewContact(contact);
//       setEditingContactIndex(index);
//       setShowContactForm(true);
//     }
//   };

//   // Supprimer un contact
//   const handleDeleteContact = (index: number) => {
//     if (window.confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
//       setFormData(prev => ({
//         ...prev,
//         contacts: prev.contacts?.filter((_, i) => i !== index) || []
//       }));
//       showNotification('info', 'Contact supprimé');
//     }
//   };

//   // Validation du formulaire
//   const validateForm = () => {
//     const newErrors: Record<string, string> = {};

//     if (!formData.beneficiary.trim()) {
//       newErrors.beneficiary = 'Veuillez sélectionner un bénéficiaire';
//     }
//     if (!formData.signalType.trim()) {
//       newErrors.signalType = 'Le type de signal est obligatoire';
//     }
//     if (!formData.description.trim()) {
//       newErrors.description = 'La description est obligatoire';
//     }
//     if (!formData.source.trim()) {
//       newErrors.source = 'La source est obligatoire';
//     }
//     if (!formData.receptionDate) {
//       newErrors.receptionDate = 'La date de réception est obligatoire';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // Soumettre le formulaire
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!validateForm()) {
//       showNotification('error', 'Veuillez corriger les erreurs dans le formulaire');
//       return;
//     }

//     setIsSubmitting(true);

//     try {
//       const token = localStorage.getItem("token") || sessionStorage.getItem("token");
//       if (!token) throw new Error("Authentification requise");

//       // Préparer les données à envoyer
//       const dataToSubmit = {
//         ...formData,
//         coordinator: currentUser?._id // Utiliser l'ID de l'utilisateur connecté
//       };

//       // Utiliser l'URL appropriée selon qu'on est en mode édition ou création
//       const url = isEdit 
//         ? `http://localhost:5000/api/weak-signals/${initialData._id}`
//         : "http://localhost:5000/api/weak-signals";
      
//       // Utiliser la méthode HTTP appropriée
//       const method = isEdit ? 'put' : 'post';
      
//       // Faire l'appel API
//       const response = await axios({
//         method,
//         url,
//         data: dataToSubmit,
//         headers: { Authorization: `Bearer ${token}` }
//       });

//       console.log("Réponse de l'API:", response.data);
      
//       // Afficher un message de succès
//       const successMessage = isEdit ? "Signal modifié avec succès" : "Signal créé avec succès";
//       showNotification('success', successMessage);

//       // Attendre un peu pour que l'utilisateur puisse voir le message de succès
//       setTimeout(() => {
//         // Redirection vers la page de liste des signaux
//         router.push('/signals');
//       }, 1500);

//     } catch (err: any) {
//       console.error("Erreur lors de la soumission:", err);
//       const errorMessage = err.response?.data?.message || err.message || "Une erreur est survenue";
//       setErrors(prev => ({ ...prev, submit: errorMessage }));
//       showNotification('error', errorMessage);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Afficher un loader pendant le chargement initial
//   if (isLoading) {
//     return (
//       <AuthGuard>
//         <div className="addsignal-container">
//           <div className="page-header">
//             <div className="breadcrumbs-wrapper">
//               <Breadcrumbs items={breadcrumbItems} showBackButton={false} />
//             </div>
//           </div>
//           <div className="loading-container">
//             <div className="spinner"></div>
//             <p>Chargement des données...</p>
//           </div>
//         </div>
//       </AuthGuard>
//     );
//   }

//   return (
//     <AuthGuard>
//       <div className="addsignal-container">
//         <div className="page-header">
//           <div className="breadcrumbs-wrapper">
//             <Breadcrumbs items={breadcrumbItems} showBackButton={false} />
//           </div>
//         </div>

//         {/* Composant de notification */}
//         <Notification
//           type={notification.type}
//           message={notification.message}
//           isVisible={notification.isVisible}
//           onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
//           position="fixed"
//         />

//         <form onSubmit={handleSubmit} className="ws-form">
          
//           {/* Section informations principales */}
//           <div className="ws-form-section">
//             <h2 className="ws-form-section-title">
//               <i className="fas fa-info-circle"></i>
//               Informations principales
//             </h2>

//             <div className="ws-form-row">
//               <div className="ws-form-group">
//                 <label htmlFor="beneficiary" className="ws-form-label">
//                   <i className="fas fa-user"></i>
//                   Bénéficiaire <span className="ws-required">*</span>
//                 </label>
//                 <select
//                   id="beneficiary"
//                   name="beneficiary"
//                   value={formData.beneficiary}
//                   onChange={handleInputChange}
//                   className={`ws-form-select ${errors.beneficiary ? 'ws-form-error' : ''}`}
//                   required
//                   disabled={isSubmitting}
//                 >
//                   <option value="">Sélectionner un bénéficiaire</option>
//                   {beneficiaries.map((b) => (
//                     <option key={b.id || `beneficiary-${Math.random()}`} value={b.id}>
//                       {b.pseudonymizedName}
//                     </option>
//                   ))}
//                 </select>
//                 {errors.beneficiary && (
//                   <div className="ws-form-error-message">
//                     {errors.beneficiary}
//                   </div>
//                 )}
//               </div>

//               <div className="ws-form-group">
//                 <label htmlFor="receptionDate" className="ws-form-label">
//                   <i className="fas fa-calendar"></i>
//                   Date de réception <span className="ws-required">*</span>
//                 </label>
//                 <input
//                   type="date"
//                   id="receptionDate"
//                   name="receptionDate"
//                   value={formData.receptionDate}
//                   onChange={handleInputChange}
//                   className={`ws-form-input ${errors.receptionDate ? 'ws-form-error' : ''}`}
//                   required
//                   disabled={isSubmitting}
//                 />
//                 {errors.receptionDate && (
//                   <div className="ws-form-error-message">
//                     {errors.receptionDate}
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div className="ws-form-row">
//               <div className="ws-form-group">
//                 <label htmlFor="signalType" className="ws-form-label">
//                   <i className="fas fa-tag"></i>
//                   Type de signal <span className="ws-required">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   id="signalType"
//                   name="signalType"
//                   value={formData.signalType}
//                   onChange={handleInputChange}
//                   className={`ws-form-input ${errors.signalType ? 'ws-form-error' : ''}`}
//                   placeholder="Ex: Technique, Santé, Comportement, Isolement..."
//                   required
//                   disabled={isSubmitting}
//                 />
//                 <div className="ws-form-help-text">
//                   Décrivez librement le type de signal (technique, médical, comportemental, etc.)
//                 </div>
//                 {errors.signalType && (
//                   <div className="ws-form-error-message">
//                     {errors.signalType}
//                   </div>
//                 )}
//               </div>

//               <div className="ws-form-group">
//                 <label htmlFor="source" className="ws-form-label">
//                   <i className="fas fa-satellite"></i>
//                   Source du signal <span className="ws-required">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   id="source"
//                   name="source"
//                   value={formData.source}
//                   onChange={handleInputChange}
//                   className={`ws-form-input ${errors.source ? 'ws-form-error' : ''}`}
//                   placeholder="Ex: Capteur, Famille, Médecin, Appel d'urgence..."
//                   required
//                   disabled={isSubmitting}
//                 />
//                 {errors.source && (
//                   <div className="ws-form-error-message">
//                     {errors.source}
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div className="ws-form-group">
//               <label htmlFor="description" className="ws-form-label">
//                 <i className="fas fa-file-alt"></i>
//                 Description détaillée <span className="ws-required">*</span>
//               </label>
//               <textarea
//                 id="description"
//                 name="description"
//                 value={formData.description}
//                 onChange={handleInputChange}
//                 className={`ws-form-textarea ${errors.description ? 'ws-form-error' : ''}`}
//                 placeholder="Décrivez en détail le signal détecté, les circonstances, les éléments observés..."
//                 required
//                 disabled={isSubmitting}
//               />
//               {errors.description && (
//                 <div className="ws-form-error-message">
//                   {errors.description}
//                 </div>
//               )}
//             </div>

//             <div className="ws-form-row">
//               <div className="ws-form-group">
//                 <label htmlFor="status" className="ws-form-label">
//                   <i className="fas fa-flag"></i>
//                   Statut initial
//                 </label>
//                 <select
//                   id="status"
//                   name="status"
//                   value={formData.status}
//                   onChange={handleInputChange}
//                   className="ws-form-select"
//                   disabled={isSubmitting}
//                 >
//                   <option value="Nouveau">Nouveau</option>
//                   <option value="En cours">En cours</option>
//                   <option value="Clôturé">Clôturé</option>
//                 </select>
//               </div>

//               <div className="ws-form-group">
//                 <label htmlFor="notes" className="ws-form-label">
//                   <i className="fas fa-sticky-note"></i>
//                   Notes additionnelles
//                 </label>
//                 <input
//                   type="text"
//                   id="notes"
//                   name="notes"
//                   value={formData.notes}
//                   onChange={handleInputChange}
//                   className="ws-form-input"
//                   placeholder="Notes ou observations complémentaires..."
//                   disabled={isSubmitting}
//                 />
//               </div>
//             </div>
            
//             {/* Coordinateur */}
//             <div className="ws-form-group">
//               <label className="ws-form-label">
//                 <i className="fas fa-user-shield"></i>
//                 Coordinateur
//               </label>
//               <div className="ws-form-coordinator">
//                 {currentUser ? (
//                   <div className="ws-coordinator-info">
//                     <span className="ws-coordinator-name">{currentUser.fullName}</span>
//                     <span className="ws-coordinator-email">{currentUser.email}</span>
//                   </div>
//                 ) : (
//                   <div className="ws-coordinator-loading">Chargement des informations...</div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Section contacts */}
//           <div className="ws-form-section ws-contacts-section">
//             <div className="ws-contacts-header">
//               <h2 className="ws-form-section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
//                 <i className="fas fa-phone"></i>
//                 Contacts et suivi
//               </h2>
              
//               <button
//                 type="button"
//                 onClick={() => {
//                   resetContactForm();
//                   setShowContactForm(!showContactForm);
//                 }}
//                 className="ws-add-contact-btn"
//                 disabled={isSubmitting}
//               >
//                 <i className="fas fa-plus"></i>
//                 Ajouter un contact
//               </button>
//             </div>

//             {/* Liste des contacts existants */}
//             <div className="ws-contacts-list">
//               {formData.contacts && formData.contacts.length > 0 ? (
//                 formData.contacts.map((contact, index) => (
//                   <div key={index} className="ws-contact-item">
//                     <div className="ws-contact-header">
//                       <div className="ws-contact-info">
//                         <div className="ws-contact-person">
//                           {contact.contactedPerson.name}
//                         </div>
//                         {contact.contactedPerson.profession && (
//                           <div className="ws-contact-profession">
//                             {contact.contactedPerson.profession}
//                           </div>
//                         )}
//                         <div className="ws-contact-meta">
//                           <div className="ws-contact-date">
//                             <i className="fas fa-calendar"></i>
//                             {new Date(contact.contactDate).toLocaleDateString('fr-FR')}
//                           </div>
//                           <div className="ws-contact-method">
//                             <i className="fas fa-phone"></i>
//                             {contact.contactMethod}
//                           </div>
//                         </div>
//                       </div>
                      
//                       <div className="ws-contact-actions">
//                         <button
//                           type="button"
//                           onClick={() => handleEditContact(index)}
//                           className="ws-contact-edit-btn"
//                           disabled={isSubmitting}
//                           title="Modifier ce contact"
//                         >
//                           <i className="fas fa-edit"></i>
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => handleDeleteContact(index)}
//                           className="ws-contact-delete-btn"
//                           disabled={isSubmitting}
//                           title="Supprimer ce contact"
//                         >
//                           <i className="fas fa-trash"></i>
//                         </button>
//                       </div>
//                     </div>
                    
//                     <div className="ws-contact-subject">
//                       {contact.contactSubject}
//                     </div>
                    
//                     {contact.contactContent && (
//                       <div className="ws-contact-content">
//                         {contact.contactContent}
//                       </div>
//                     )}
                    
//                     {contact.response?.hasResponse && contact.response.content && (
//                       <div className="ws-contact-response">
//                         <div className="ws-response-header">
//                           <span className="ws-response-badge">
//                             <i className="fas fa-reply"></i>
//                             Réponse reçue
//                           </span>
//                           {contact.response.date && (
//                             <span className="ws-response-date">
//                               le {new Date(contact.response.date).toLocaleDateString('fr-FR')}
//                             </span>
//                           )}
//                         </div>
//                         <div className="ws-response-content">
//                           {contact.response.content}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ))
//               ) : (
//                 <div className="ws-no-contacts">
//                   <i className="fas fa-phone"></i>
//                   <div>Aucun contact ajouté pour ce signal</div>
//                 </div>
//               )}
//             </div>

//             {/* Formulaire de contact */}
//             {showContactForm && (
//               <div className="ws-contact-form">
//                 <div className="ws-contact-form-header">
//                   <h3 className="ws-contact-form-title">
//                     {editingContactIndex !== null ? 'Modifier le contact' : 'Nouveau contact'}
//                   </h3>
//                   <button
//                     type="button"
//                     onClick={resetContactForm}
//                     className="ws-contact-form-close"
//                   >
//                     ×
//                   </button>
//                 </div>

//                 <div className="ws-contact-form-section">
//                   <h4 className="ws-contact-form-section-title">
//                     Informations de contact
//                   </h4>
                  
//                   <div className="ws-form-row">
//                     <div className="ws-form-group">
//                       <label className="ws-form-label">
//                         Nom de la personne contactée *
//                       </label>
//                       <input
//                         type="text"
//                         name="contactedPerson.name"
//                         value={newContact.contactedPerson.name}
//                         onChange={handleNewContactChange}
//                         className="ws-form-input"
//                         placeholder="Dr. Martin Dupont, Marie Dubois..."
//                         disabled={isSubmitting}
//                       />
//                     </div>
                    
//                     <div className="ws-form-group">
//                       <label className="ws-form-label">
//                         Profession / Relation
//                       </label>
//                       <input
//                         type="text"
//                         name="contactedPerson.profession"
//                         value={newContact.contactedPerson.profession}
//                         onChange={handleNewContactChange}
//                         className="ws-form-input"
//                         placeholder="Médecin traitant, Fille du patient..."
//                         disabled={isSubmitting}
//                       />
//                     </div>
//                   </div>

//                   <div className="ws-form-row">
//                     <div className="ws-form-group">
//                       <label className="ws-form-label">
//                         Date de contact
//                       </label>
//                       <input
//                         type="date"
//                         name="contactDate"
//                         value={newContact.contactDate}
//                         onChange={handleNewContactChange}
//                         className="ws-form-input"
//                         disabled={isSubmitting}
//                       />
//                     </div>
                    
//                     <div className="ws-form-group">
//                       <label className="ws-form-label">
//                         Méthode de contact
//                       </label>
//                       <select
//                         name="contactMethod"
//                         value={newContact.contactMethod}
//                         onChange={handleNewContactChange}
//                         className="ws-form-select"
//                         disabled={isSubmitting}
//                       >
//                         <option value="Téléphone">Téléphone</option>
//                         <option value="Email">Email</option>
//                         <option value="SMS">SMS</option>
//                         <option value="Visite">Visite</option>
//                         <option value="Courrier">Courrier</option>
//                         <option value="Autre">Autre</option>
//                       </select>
//                     </div>
//                   </div>

//                   <div className="ws-form-group">
//                     <label className="ws-form-label">
//                       Sujet du contact *
//                     </label>
//                     <input
//                       type="text"
//                       name="contactSubject"
//                       value={newContact.contactSubject}
//                       onChange={handleNewContactChange}
//                       className="ws-form-input"
//                       placeholder="Information sur l'état de santé, demande d'intervention..."
//                       disabled={isSubmitting}
//                     />
//                   </div>

//                   <div className="ws-form-group">
//                     <label className="ws-form-label">
//                       Contenu du contact
//                     </label>
//                     <textarea
//                       name="contactContent"
//                       value={newContact.contactContent}
//                       onChange={handleNewContactChange}
//                       className="ws-form-textarea"
//                       placeholder="Détails de l'échange, informations communiquées..."
//                       style={{ minHeight: '80px' }}
//                       disabled={isSubmitting}
//                     />
//                   </div>
//                 </div>

//                 {/* Section réponse */}
//                 <div className="ws-contact-form-section">
//                   <div className="ws-response-toggle">
//                     <input
//                       type="checkbox"
//                       id="hasResponse"
//                       className="ws-response-checkbox"
//                       checked={newContact.response?.hasResponse || false}
//                       onChange={(e) => setNewContact(prev => ({
//                         ...prev,
//                         response: {
//                           ...prev.response,
//                           hasResponse: e.target.checked
//                         }
//                       }))}
//                       disabled={isSubmitting}
//                     />
//                     <label htmlFor="hasResponse" className="ws-form-label" style={{ margin: 0 }}>
//                       Une réponse a été reçue
//                     </label>
//                   </div>

//                   {newContact.response?.hasResponse && (
//                     <div className="ws-response-fields">
//                       <div className="ws-form-row">
//                         <div className="ws-form-group">
//                           <label className="ws-form-label">
//                             Date de la réponse
//                           </label>
//                           <input
//                             type="date"
//                             name="response.date"
//                             value={newContact.response?.date || ''}
//                             onChange={handleNewContactChange}
//                             className="ws-form-input"
//                             disabled={isSubmitting}
//                           />
//                         </div>
                        
//                         <div className="ws-form-group">
//                           <label className="ws-form-label">
//                             Méthode de réponse
//                           </label>
//                           <select
//                             name="response.responseMethod"
//                             value={newContact.response?.responseMethod || 'Téléphone'}
//                             onChange={handleNewContactChange}
//                             className="ws-form-select"
//                             disabled={isSubmitting}
//                           >
//                             <option value="Téléphone">Téléphone</option>
//                             <option value="Email">Email</option>
//                             <option value="SMS">SMS</option>
//                             <option value="Visite">Visite</option>
//                             <option value="Courrier">Courrier</option>
//                             <option value="Autre">Autre</option>
//                           </select>
//                         </div>
//                       </div>

//                       <div className="ws-form-group">
//                         <label className="ws-form-label">
//                           Contenu de la réponse
//                         </label>
//                         <textarea
//                           name="response.content"
//                           value={newContact.response?.content || ''}
//                           onChange={handleNewContactChange}
//                           className="ws-form-textarea"
//                           placeholder="Détails de la réponse reçue..."
//                           style={{ minHeight: '80px' }}
//                           disabled={isSubmitting}
//                         />
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 {contactError && (
//                   <div className="ws-form-error-box">
//                     <i className="fas fa-exclamation-triangle"></i>
//                     {contactError}
//                   </div>
//                 )}

//                 <div className="ws-contact-form-actions">
//                   <button
//                     type="button"
//                     onClick={resetContactForm}
//                     className="ws-contact-form-cancel"
//                     disabled={isSubmitting}
//                   >
//                     Annuler
//                   </button>
//                   <button
//                     type="button"
//                     onClick={handleSaveContact}
//                     className="ws-contact-form-submit"
//                     disabled={isSubmitting}
//                   >
//                     <i className="fas fa-save"></i>
//                     {editingContactIndex !== null ? 'Modifier' : 'Ajouter'}
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Erreur de soumission */}
//           {errors.submit && (
//             <div className="ws-form-error-box">
//               <i className="fas fa-exclamation-triangle"></i>
//               {errors.submit}
//             </div>
//           )}

//           {/* Actions du formulaire */}
//           <div className="ws-form-actions">
//             <button
//               type="button"
//               onClick={onCancel}
//               className="ws-form-cancel"
//               disabled={isSubmitting}
//             >
//               <i className="fas fa-times"></i>
//               Annuler
//             </button>
            
//             <button
//               type="submit"
//               className="ws-form-submit"
//               disabled={isSubmitting || !currentUser}
//             >
//               {isSubmitting ? (
//                 <div className="ws-form-loading">
//                   <div className="ws-form-spinner"></div>
//                   Enregistrement...
//                 </div>
//               ) : (
//                 <>
//                   <i className="fas fa-save"></i>
//                   {isEdit ? 'Modifier le signal' : 'Créer le signal'}
//                 </>
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </AuthGuard>
//   );
// }