"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Notification from "@/components/Notification/Notification";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("coordinateur");
  const [isLoading, setIsLoading] = useState(false);
  
  // Form validation errors
  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Notification state
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
    isVisible: boolean;
  }>({
    type: 'info',
    message: '',
    isVisible: false
  });

  const API = process.env.NEXT_PUBLIC_API_URL;

  // Validation functions
  const validateFullName = (value: string) => {
    if (!value.trim()) {
      setFullNameError("Nom complet est requis");
      return false;
    } else if (value.trim().length < 3) {
      setFullNameError("Nom complet doit contenir au moins 3 caractères");
      return false;
    } else {
      setFullNameError("");
      return true;
    }
  };

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError("Email est requis");
      return false;
    } else if (!emailRegex.test(value)) {
      setEmailError("Format d'email invalide");
      return false;
    } else {
      setEmailError("");
      return true;
    }
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError("Mot de passe est requis");
      return false;
    } else if (value.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères");
      return false;
    } else {
      setPasswordError("");
      return true;
    }
  };

  // Close notification
  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  // Show notification
  const showNotification = (type: NotificationType, message: string) => {
    setNotification({
      type,
      message,
      isVisible: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const isFullNameValid = validateFullName(fullName);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isFullNameValid || !isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);
    closeNotification();

    if (!API) {
      showNotification('error', "Erreur de configuration : API URL est manquant.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage = data.message.includes("already")
          ? "Cet email est déjà utilisé"
          : data.message || "Erreur lors de l'inscription";

        throw new Error(errorMessage);
      }

      showNotification('success', "Inscription réussie ! Vous pouvez maintenant vous connecter.");

      setTimeout(() => router.push("/"), 1500);
    } catch (err: any) {
      showNotification('error', err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="card-left">
          <img src="/logo_transparent.png" alt="RI2S Logo" />
        </div>

        <div className="card-right">
          <div className="card-header">
            <h2>Créer un compte</h2>
            <div className="header-underline"></div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="fullName">Nom Complet</label>
              <input 
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fullNameError) validateFullName(e.target.value);
                }}
                onBlur={(e) => validateFullName(e.target.value)}
                placeholder="Entrez votre nom complet"
                className={`form-input ${fullNameError ? 'input-error' : ''}`}
                required
              />
              {fullNameError && <div className="field-error">{fullNameError}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Adresse email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                onBlur={(e) => validateEmail(e.target.value)}
                placeholder="Entrez votre email"
                className={`form-input ${emailError ? 'input-error' : ''}`}
                required
              />
              {emailError && <div className="field-error">{emailError}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) validatePassword(e.target.value);
                }}
                onBlur={(e) => validatePassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                className={`form-input ${passwordError ? 'input-error' : ''}`}
                required
              />
              {passwordError && <div className="field-error">{passwordError}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="role">Rôle</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="form-input"
              >
                <option value="coordinateur">Coordinateur</option>
                <option value="assistant_coordinateur">
                  Assistant Coordinateur
                </option>
                <option value="gestionnaire">Gestionnaire</option>
                <option value="infirmier de coordination">infirmier de coordination</option>
                <option value="admin">Admin</option>

              </select>
            </div>

            <button type="submit" className={`btn ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
              {isLoading ? "Traitement en cours..." : "S'inscrire"}
            </button>

            <Notification
              type={notification.type}
              message={notification.message}
              isVisible={notification.isVisible}
              onClose={closeNotification}
            />

            <p className="mt-4 text-center">
              <Link href="/" className="login-link">
                Déjà un compte ? Connectez-vous
              </Link>
            </p>
          </form>
        </div>
      </div>

      <style jsx>{`
        .register-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #ffffff;
          padding: 1rem;
        }

        .register-card {
          display: flex;
          width: 100%;
          max-width: 900px;
          background-color: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          overflow: hidden;
        }

        .card-left {
          width: 50%;
          background: #fff;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
        }

        .card-left img {
          max-width: 240px;
          width: 100%;
        }

        .card-right {
          width: 50%;
          padding: 2rem 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .card-header {
          margin-bottom: 2rem;
        }

        .card-header h2 {
          text-align: center;
          color: #13423b;
          font-size: 1.5rem;
        }

        .header-underline {
          height: 4px;
          width: 60px;
          background: #4caf50;
          margin: 0 auto 1.5rem;
          border-radius: 2px;
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

        .form-input {
          width: 100%;
          padding: 0.8rem 1rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: #6ebe71;
          box-shadow: 0 0 0 2px rgba(110, 190, 113, 0.2);
        }

        .input-error {
          border-color: #c00;
        }

        .field-error {
          color: #c00;
          font-size: 0.8rem;
          margin-top: 0.3rem;
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

        .btn.loading {
          background-color: #8bc34a;
          cursor: wait;
          opacity: 0.8;
        }

        .mt-4 {
          margin-top: 1rem;
        }

        .text-center {
          text-align: center;
        }

        .login-link {
          color: #6ebe71;
          text-decoration: none;
          transition: text-decoration 0.2s;
        }

        .login-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .register-card {
            flex-direction: column;
          }

          .card-left,
          .card-right {
            width: 100%;
          }

          .card-left {
            padding: 1.5rem;
          }

          .card-right {
            padding: 2rem;
          }
        }
      `}</style>
    </div>
  );
}