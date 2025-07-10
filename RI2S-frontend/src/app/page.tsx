'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff } from 'react-feather';
import Link from 'next/link';
import Notification, { NotificationType } from '../components/Notification/Notification';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
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

  // Form validation
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const API = process.env.NEXT_PUBLIC_API_URL;

  // Email validation
  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError('Email est requis');
      return false;
    } else if (!emailRegex.test(value)) {
      setEmailError('Format d\'email invalide');
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };

  // Password validation
  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('Mot de passe est requis');
      return false;
    } else if (value.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    } else {
      setPasswordError('');
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
    
    // Validate form
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);
    closeNotification();

    if (!API) {
      showNotification('error', 'Erreur de configuration : API URL est manquant.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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
        throw new Error(data.message || 'Erreur de connexion');
      }

      if (rememberMe) {
        localStorage.setItem('token', data.token);
      } else {
        sessionStorage.setItem('token', data.token);
      }

      showNotification('success', 'Connexion réussie ! Redirection...');
      
      // Short delay before redirect for notification to be visible
      setTimeout(() => {
        router.push('/index');
      }, 1000);
      
    } catch (err: any) {
      showNotification('error', err.message);
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!API) {
      showNotification('error', 'Erreur de configuration : API URL est manquant.');
      return;
    }
  
    const oldPassword = prompt('Entrez votre ancien mot de passe :');
    if (!oldPassword) {
      showNotification('error', 'L\'ancien mot de passe est requis.');
      return;
    }
  
    const newPassword = prompt('Entrez votre nouveau mot de passe :');
    if (!newPassword) {
      showNotification('error', 'Le nouveau mot de passe est requis.');
      return;
    }
  
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Vous devez être connecté pour réinitialiser votre mot de passe.');
      }
        
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
  
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur lors du changement de mot de passe.');
      }
  
      showNotification('success', 'Mot de passe changé avec succès.');
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="card-left">
          <img src="/logo_transparent.png" alt="RI2S Logo" />
        </div>
        <div className="card-right">
          <h2>Connexion à votre compte</h2>
          <div className="header-underline"></div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">
                <Mail size={16} className="input-icon" />
                <span className="label-text">Email</span>
              </label>
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
                required
                className={`input-field ${emailError ? 'input-error' : ''}`}
              />
              {emailError && <div className="field-error">{emailError}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <Lock size={16} className="input-icon" />
                <span className="label-text">Mot de passe</span>
              </label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) validatePassword(e.target.value);
                  }}
                  onBlur={(e) => validatePassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  required
                  className={`input-field ${passwordError ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {passwordError && <div className="field-error">{passwordError}</div>}
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkmark"></span>
                Se souvenir de moi
              </label>

              <Link href="/send-password-reset-email" className="forgot-password">
                Mot de passe oublié?
              </Link>
            </div>

            <button type="submit" className={`btn ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
              {isLoading ? 'Connexion en cours...' : 'Se connecter'}
            </button>

            <Notification
              type={notification.type}
              message={notification.message}
              isVisible={notification.isVisible}
              onClose={closeNotification}
            />
          </form>

          <div className="register-link">
            <p>Vous n'avez pas de compte? <Link href="/register">Inscrivez-vous</Link></p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          width: 100%;
          padding: 20px;
          background-color: #FFFFFF;
          margin: 0;
        }

        .login-card {
          display: flex;
          max-width: 900px;
          width: 100%;
          background-color: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          margin: 20px;
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
          width: 100%;
          max-width: 240px;
        }

        .card-right {
          width: 50%;
          padding: 2rem 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .card-right h2 {
          text-align: center;
          margin-bottom: 1rem;
        }

        .header-underline {
          height: 4px;
          width: 60px;
          background: #4caf50;
          margin: 0 auto 2rem;
          border-radius: 2px;
        }

        .form-group {
          margin-bottom: 1.2rem;
        }

        label {
          display: flex;
          align-items: center;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .label-text {
          margin-left: 0.5rem;
        }

        .input-field {
          width: 100%;
          padding: 0.9rem 1rem;
          border-radius: 8px;
          border: 1px solid #ccc;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .input-field:focus {
          border-color: #4caf50;
          outline: none;
        }

        .input-error {
          border-color: #c00;
        }

        .field-error {
          color: #c00;
          font-size: 0.8rem;
          margin-top: 0.3rem;
        }

        .password-input-container {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          cursor: pointer;
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .remember-me {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn {
          background-color: #4caf50;
          color: white;
          padding: 1rem;
          border: none;
          width: 100%;
          max-width: 300px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 1rem;
          cursor: pointer;
          display: block;
          margin: 0 auto 1rem;
          transition: background-color 0.3s;
        }

        .btn:hover {
          background-color: #3d8b40;
        }

        .btn.loading {
          background-color: #8bc34a;
          cursor: wait;
        }

        .register-link {
          text-align: center;
          margin-top: 1rem;
        }

        @media (max-width: 768px) {
          .login-card {
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

        @media (max-width: 480px) {
          .login-container {
            padding: 0;
          }
          .login-card {
            margin: 0;
            border-radius: 0;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}