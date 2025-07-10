// import React, { useRef, useState } from 'react';
// import './FormSectionClinical.css';

// type Props = {
//   handleFileChange: (files: File[]) => void;
// };

// export default function FormSectionClinical({ handleFileChange }: Props) {
//   const fileInputRef = useRef<HTMLInputElement | null>(null);
//   const [files, setFiles] = useState<File[]>([]);

//   const openFileDialog = () => {
//     fileInputRef.current?.click();
//   };

//   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files.length > 0) {
//       const newFiles = Array.from(e.target.files);
//       const updatedFiles = [...files, ...newFiles];
//       setFiles(updatedFiles);
//       handleFileChange(updatedFiles);
//     }
//   };

//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     if (e.dataTransfer.files.length > 0) {
//       const newFiles = Array.from(e.dataTransfer.files);
//       const updatedFiles = [...files, ...newFiles];
//       setFiles(updatedFiles);
//       handleFileChange(updatedFiles);
//     }
//   };

//   const handleRemoveFile = (index: number) => {
//     const updatedFiles = files.filter((_, i) => i !== index);
//     setFiles(updatedFiles);
//     handleFileChange(updatedFiles);
//   };

//   return (
//     <div className="card mb-4 border-0 shadow-sm">
//       <div className="card-header">
//         <h2>Les données cliniques</h2>
//       </div>

//       <div className="card-body">
//         <div
//           className="dropzone"
//           onClick={openFileDialog}
//           onDrop={handleDrop}
//           onDragOver={e => e.preventDefault()}
//         >
//           <div className="icon">📎</div>
//           <p className="text">
//             <strong>Glissez-déposez vos fichiers ici</strong><br />
//             ou cliquez pour en sélectionner
//           </p>
//           <input
//             type="file"
//             ref={fileInputRef}
//             onChange={handleFileSelect}
//             className="d-none"
//             multiple
//           />
//         </div>
        
//         {files.length > 0 && (
//           <ul className="file-list mt-3">
//             {files.map((file, index) => (
//               <li key={index} className="file-item">
//                 <div className="file-info">
//                   <span className="file-icon">📄</span> 
//                   <span className="file-name">{file.name}</span>
//                 </div>
//                 <button 
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     handleRemoveFile(index);
//                   }}
//                   className="remove-btn"
//                   title="Supprimer le fichier"
//                 >
//                   ×
//                 </button>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>
//     </div>
//   );
// }