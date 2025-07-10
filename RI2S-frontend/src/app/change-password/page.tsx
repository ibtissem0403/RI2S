//@ts-ignore
//@ts-nocheck
"use client";
import { useState, useEffect } from "react";

import { useRouter, useSearchParams } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const [token, setToken] = useState<string>("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const urlToken = searchParams.get("token");

    if (urlToken) {
      const decodedToken = decodeURIComponent(urlToken);

      setToken(decodedToken);

      console.log("Token décodé:", decodedToken); // Pour débogage
    }
  }, [searchParams]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    setSuccess("");

    try {
      // Validation basique

      if (!API) throw new Error("Erreur de configuration");

      if (newPassword !== confirmPassword)
        throw new Error("Les mots de passe ne correspondent pas");

      let endpoint: string;

      let body: any;

      const headers: HeadersInit = { "Content-Type": "application/json" };

      if (token) {
        // Mode réinitialisation via lien

        endpoint = `${API}/api/auth/reset-password`;

        body = { token, newPassword };
      } else {
        // Mode changement classique (utilisateur connecté)

        endpoint = `${API}/api/auth/change-password`;

        const authToken =
          localStorage.getItem("token") || sessionStorage.getItem("token");

        if (!authToken) throw new Error("Authentification requise");

        headers["Authorization"] = `Bearer ${authToken}`;

        body = { newPassword };
      }

      const res = await fetch(endpoint, {
        method: "POST",

        headers,

        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Erreur de traitement");

      setSuccess(data.message || "Mot de passe modifié avec succès");

      setTimeout(() => router.push(token ? "/login" : "/"), 2000);
    } catch (err: any) {
      console.error("Full error:", err);

      setError(err.message || "Détails de l'erreur indisponibles");

      if (err.response) {
        console.error("Server response:", await err.response.text());
      }
    }
  };

  return (
    <div className="change-password-container">
      <div className="main-content">
        <div className="change-password-card">
          <div className="card-header">
            <h2>{token ? "Réinitialisation" : "Changement"} de mot de passe</h2>
          </div>

          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label htmlFor="newPassword">
                {token ? "Nouveau mot de passe" : "Mot de passe actuel"}
              </label>

              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={`Entrez votre ${
                  token ? "nouveau" : "actuel"
                } mot de passe`}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                {token
                  ? "Confirmez le nouveau mot de passe"
                  : "Nouveau mot de passe"}
              </label>

              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={`Entrez ${
                  token ? "à nouveau" : "votre nouveau"
                } mot de passe`}
                required
              />
            </div>

            <button type="submit" className="btn">
              {token ? "Réinitialiser" : "Changer"}
            </button>

            {error && <p className="error-message">{error}</p>}

            {success && <p className="success-message">{success}</p>}
          </form>
        </div>
      </div>

      <style jsx>{`
        .change-password-container {
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

        .change-password-card {
          background-color: white;

          border-radius: 8px;

          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

          width: 100%;

          max-width: 450px;

          padding: 2rem;
        }

        .card-header {
          border-bottom: 3px solid #ffd700;

          margin-bottom: 2rem;

          padding-bottom: 1rem;
        }

        .card-header h2 {
          color: #13423b;

          font-size: 1.5rem;

          text-align: center;
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

        input[type="password"] {
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
