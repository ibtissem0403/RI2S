'use client';






import { useState } from 'react';


import { useRouter } from 'next/navigation';





export default function SendPasswordResetEmailPage() {


  const router = useRouter();


  const [email, setEmail] = useState('');


  const [error, setError] = useState('');


  const [success, setSuccess] = useState('');





  const API = process.env.NEXT_PUBLIC_API_URL;





  const handleSendResetEmail = async (e: React.FormEvent) => {


    e.preventDefault();


    setError('');


    setSuccess('');





    if (!API) {


      setError('Erreur de configuration : API URL est manquant.');


      return;


    }





    try {


     // Modifier l'URL de la requête POST :


      const res = await fetch(`${API}/api/auth/forgot-password`, { 


      method: 'POST',


      headers: { 'Content-Type': 'application/json' },


      body: JSON.stringify({ email }),


    });





      let data: any;


      const contentType = res.headers.get('content-type') || '';


      if (contentType.includes('application/json')) {


        data = await res.json();


      } else {


        const text = await res.text();


        throw new Error(text || 'Réponse inattendue du serveur');


      }





      if (!res.ok) {


        throw new Error(data.message || 'Erreur lors de l\'envoi de l\'email.');


      }





      setSuccess('Un email a été envoyé pour réinitialiser votre mot de passe.');


      setEmail('');





      setTimeout(() => {


        router.push('/');


      }, 2000);





    } catch (err: any) {


      setError(err.message);


    }


  };





  return (


    <div className="reset-email-container">


      <div className="main-content">


        <div className="reset-email-card">


          <div className="card-header">


            <h2>Réinitialiser votre mot de passe</h2>


          </div>





          <form onSubmit={handleSendResetEmail}>


            <div className="form-group">


              <label htmlFor="email">Adresse email</label>


              <input


                type="email"


                id="email"


                value={email}


                onChange={(e) => setEmail(e.target.value)}


                placeholder="Entrez votre adresse email"


                required


              />


            </div>





            <button type="submit" className="btn">


              Envoyer l'email


            </button>





            {error && <p className="error-message">{error}</p>}


            {success && <p className="success-message">{success}</p>}


          </form>


        </div>


      </div>





      <style jsx>{`


        .reset-email-container {


          display: flex;


          min-height: 100vh;


          background-color: #f5f5f5;


        }





        .main-content {


          flex: 1;


          padding: 2rem;


          display: flex;


          align-items: center;


          justify-content: center;


        }





        .reset-email-card {


          background-color: white;


          border-radius: 8px;


          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);


          width: 100%;


          max-width: 450px;


          padding: 2rem;


        }





        .card-header {


          border-bottom: 3px solid #4caf50;


          margin-bottom: 2rem;


          padding-bottom: 1rem;


        }





        .card-header h2 {


          color: #13423b;


          font-size: 1.5rem;


        }





        .form-group {


          margin-bottom: 1.5rem;


        }





        label {


          display: block;


          margin-bottom: 0.5rem;


          color: #333;


          font-weight: 500;


        }





        input[type="email"] {


          width: 100%;


          padding: 0.8rem;


          border: 1px solid #ddd;


          border-radius: 4px;


          font-size: 1rem;


        }





        input:focus {


          outline: none;


          border-color: #6ebe71;


          box-shadow: 0 0 0 2px rgba(110, 190, 113, 0.2);


        }





        .btn {


          background-color: #6ebe71;


          color: white;


          border: none;


          padding: 0.8rem 1.5rem;


          border-radius: 4px;


          font-size: 1rem;


          cursor: pointer;


          transition: background-color 0.2s;


          width: 100%;


          font-weight: bold;


        }





        .btn:hover {


          background-color: #13423b;


        }





        .error-message {


          color: #c53030;


          margin-top: 1rem;


          text-align: center;


        }





        .success-message {


          color: #2ecc71;


          margin-top: 1rem;


          text-align: center;


        }


      `}</style>


    </div>


  );


}