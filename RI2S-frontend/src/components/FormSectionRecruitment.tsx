// import React from 'react';

// interface Cohort {
//   _id: string;
//   name: string;
//   experimentation?: {
//     name?: string;
//     _id?: string;
//   };
// }

// interface User {
//   _id: string;
//   fullName: string;
//   email: string;
// }

// type Props = {
//     formData: any;
//     handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
//     recruiters: User[];
//     cohorts: Cohort[];
//   };

//   export default function FormSectionRecruitment({ 
//     formData, 
//     handleChange, 
//     recruiters = [], 
//     cohorts = [] 
//   }: Props) {
//   return (
//     <div className="card-e">
//       <div className="card-header-e">
//         <h2>Informations de recrutement</h2>
//       </div>
      
//       <div className="card-body-e">
//         <div className="form-group-e">
//           <div>
//             <label htmlFor="recruiter" className="required-e">Coordinateur</label>
//             <select
//               id="recruiter"
//               name="recruiter"
//               required
//               value={formData.recruiter}
//               onChange={handleChange}
//             >
//               <option value="">Sélectionner un coordinateur</option>
//               {Array.isArray(recruiters) && recruiters.map((r) => (
//                 <option key={r._id} value={r._id}>
//                   {r.fullName} ({r.email})
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label htmlFor="cohort" className="required-e">Cohorte</label>
//             <select
//               id="cohort"
//               name="cohort"
//               required
//               value={formData.cohort}
//               onChange={handleChange}
//             >
//               <option value="">Sélectionner une cohorte</option>
//               {Array.isArray(cohorts) && cohorts.map((c) => (
//                 <option key={c._id} value={c._id}>
//                   {c.name} {c.experimentation?.name && `(${c.experimentation.name})`}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>

//         <div className="form-group-e">
//           <div>
//             <label htmlFor="recruitmentMethod" className="required-e">Méthode de recrutement</label>
//             <select
//               id="recruitmentMethod"
//               name="recruitmentMethod"
//               required
//               value={formData.recruitmentMethod}
//               onChange={handleChange}
//             >
//               <option value="Domicile">Domicile</option>
//               <option value="Partenaire">Partenaire</option>
//               <option value="Spontané">Spontané</option>
//               <option value="Autre">Autre</option>
//             </select>
//           </div>

//           <div>
//             <label htmlFor="inclusionDate" className="required-e">Date d'inclusion</label>
//             <input
//               type="date"
//               id="inclusionDate"
//               name="inclusionDate"
//               required
//               value={formData.inclusionDate}
//               onChange={handleChange}
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }