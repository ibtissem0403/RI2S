// import React from 'react';

// type Props = {
//   formData: any;
//   handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
// };

// export default function FormSectionPersonal({ formData, handleChange }: Props) {
//   return (
//     <div className="card-e">
//       <div className="card-header-e">
//         <h2>Informations personnelles</h2>
//       </div>
//       <div className="card-body-e">
//         <div className="form-group-e">
//           <div>
//             <label htmlFor="fullName" className="required-e">Nom complet</label>
//             <input
//               type="text"
//               id="fullName"
//               name="fullName"
//               required
//               value={formData.fullName}
//               onChange={handleChange}
//             />
//           </div>
//           <div>
//             <label htmlFor="firstName" className="required-e">Prénom</label>
//             <input
//               type="text"
//               id="firstName"
//               name="firstName"
//               required
//               value={formData.firstName}
//               onChange={handleChange}
//             />
//           </div>
//         </div>

//         <div className="form-group-e">
//           <div>
//             <label htmlFor="birthDate" className="required-e">Date de naissance</label>
//             <input
//               type="date"
//               id="birthDate"
//               name="birthDate"
//               required
//               value={formData.birthDate}
//               onChange={handleChange}
//             />
//           </div>
//           <div>
//             <label htmlFor="sex" className="required-e">Sexe</label>
//             <select
//               id="sex"
//               name="sex"
//               required
//               value={formData.sex}
//               onChange={handleChange}
//             >
//               <option value="M">Masculin</option>
//               <option value="F">Féminin</option>
//               <option value="Other">Autre</option>
//             </select>
//           </div>
//         </div>

//         <div className="form-group-e">
//           <div>
//             <label htmlFor="address" className="required-e">Adresse</label>
//             <input
//               type="text"
//               id="address"
//               name="address"
//               required
//               value={formData.address}
//               onChange={handleChange}
//             />
//           </div>
//           <div>
//             <label htmlFor="phone" className="required-e">Téléphone</label>
//             <input
//               type="tel"
//               id="phone"
//               name="phone"
//               required
//               value={formData.phone}
//               onChange={handleChange}
//             />
//           </div>
//         </div>

//         <div className="form-grou-e">
//           <div>
//             <label htmlFor="status" className="required-e">Statut</label>
//             <select
//               id="status"
//               name="status"
//               value={formData.status}
//               onChange={handleChange}
//               required
//             >
//               <option value="Actif">Actif</option>
//               <option value="Sorti">Sorti</option>
//               <option value="Suspendu">Suspendu</option>
//             </select>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }