// import React from 'react';






// type Props = {


//   formData: any;


//   handleChange: (e: React.ChangeEvent<any>) => void;


// };





// export default function FormSectionCaregiver({ formData, handleChange }: Props) {


//   return (


//     <div className="card-e">


//       <div className="card-header-e">


//         <h2>Responsable légal</h2>


//       </div>


//       <div className="card-body-e">


//         <div className="form-group-e">


//           <div>


//             <label htmlFor="caregiver.name">Nom</label>


//             <input type="text" id="caregiver.name" name="caregiver.name" value={formData.caregiver.name} onChange={handleChange} />


//           </div>


//           <div>


//             <label htmlFor="caregiver.firstName">Prénom</label>


//             <input type="text" id="caregiver.firstName" name="caregiver.firstName" value={formData.caregiver.firstName} onChange={handleChange} />


//           </div>


//         </div>


//         <div className="form-group-e">


//           <div>


//             <label htmlFor="caregiver.relation">Lien de parenté</label>


//             <input type="text" id="caregiver.relation" name="caregiver.relation" value={formData.caregiver.relation} onChange={handleChange} />


//           </div>


//           <div>


//             <label htmlFor="caregiver.phone">Téléphone</label>


//             <input type="tel" id="caregiver.phone" name="caregiver.phone" value={formData.caregiver.phone} onChange={handleChange} />


//           </div>


//         </div>


//       </div>


//     </div>


//   );


// }