"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { experimentationService } from "@/services/experimentationServices";
import Breadcrumbs from "@/components/Breadcrumbs/Breadcrumbs";
import "./associate.css";
import Stepper from "./components/Stepper";
import { set } from "mongoose";

// Types pour les modèles
interface Beneficiaire {
  _id: string;
  fullName: string;
  firstName: string;
  dossierNumber?: string;
}

// Interface pour les bénéficiaires pseudonymisés
interface PseudonymizedBeneficiary {
  id: string;
  pseudoId: string;
}

interface Champ {
  _id: string;
  nom_champ: string;
  description?: string;

  type_champ: string; // text, number, date, select, etc.
  options?: string[]; // Pour les champs de type select
  obligatoire: boolean;
}

interface Statut {
  _id: string;
  nom_statut: string;
  champs: Champ[];
  champs_communs: Champ[];
}

interface Cible {
  _id: string;
  nom_cible: string;
  statuts: Statut[];
}

interface ExperimentationData {
  champsCommuns: Champ[];
  experimentation: {
    _id: string;
    name: string;
  };
  cibles: Cible[];
}

// Classe d'aide pour l'authentification
class AuthHelper {
  static getToken(): string | null {
    // Chercher le token dans différents emplacements possibles
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken") ||
      document.cookie.replace(
        /(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/,
        "$1"
      )
    );
  }

  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    if (!token) return { "Content-Type": "application/json" };

    // S'assurer que le token a le préfixe "Bearer" s'il n'est pas déjà présent
    const authToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

    return {
      Authorization: authToken,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  static async refreshToken(): Promise<string | null> {
    try {
      // Exemple de code pour rafraîchir le token - à adapter selon votre système
      // const response = await axios.post('/api/auth/refresh', {}, {
      //   withCredentials: true
      // });
      // const newToken = response.data.token;
      // localStorage.setItem('token', newToken);
      // return newToken;

      // Pour l'instant, on simule juste un rafraîchissement
      console.log("Tentative de rafraîchissement du token...");
      return this.getToken();
    } catch (error) {
      console.error("Échec du rafraîchissement du token:", error);
      return null;
    }
  }

  static isTokenExpired(token: string): boolean {
    if (!token) return true;

    try {
      // Pour un token JWT
      const base64Url = token.split(" ")[1] || token;
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64.split(".")[1])
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );

      const { exp } = JSON.parse(jsonPayload);
      const expired = Date.now() >= exp * 1000;

      if (expired) {
        console.warn("Token expiré:", new Date(exp * 1000).toLocaleString());
      }

      return expired;
    } catch (e) {
      console.warn("Impossible de vérifier l'expiration du token:", e);
      return false; // En cas de doute, supposons que le token est valide
    }
  }
}
interface UsagerRI2S {
  _id: string;
  fullName: string;
  firstName: string;
  email: string;
  phone: string;
  type_usager: "pro" | "non_pro";
  role: string;
  specialite?: string;
  notes?: string;
  codePostal?: string;
  dateNaissance?: string;
  lien_avec_senior?: string;
  createdAt?: string;
  pseudo?: {
    pseudoId: string;
    pseudoName: string;
    dossierNumber: string;
    inclusionDate: string;
    status: "Actif" | "Sorti" | "Suspendu";
  };
  experimentations?: Array<{
    nom: string;
    code: string;
    statut: string;
    cible: string;
  }>;
}
const AssociatePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const experimentationId = searchParams?.get("experimentationId");
  const [usagers, setUsagers] = useState<UsagerRI2S[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<string | null>(null);
  const [experimentation, setExperimentation] =
    useState<ExperimentationData | null>(null);
  const [pseudonymizedBeneficiaries, setPseudonymizedBeneficiaries] = useState<
    PseudonymizedBeneficiary[]
  >([]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>("");
  const [selectedCible, setSelectedCible] = useState<string>("");
  const [selectedStatut, setSelectedStatut] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // État pour les valeurs des champs dynamiques
  const [champValues, setChampValues] = useState<Record<string, any>>({});
  const [champCommunValues, setChampCommunValues] = useState<
    Record<string, any>
  >({});
  const [champCommunVal, setChampCommunVal] = useState({});

  const fetchUsagers = async () => {
    try {
      setError(null);
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) throw new Error("Authentification requise");
      const response = await axios.get<UsagerRI2S[]>(
        "http://localhost:5000/api/usagers-ri2s",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsagers(response.data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
    }
  };
  // Fonction de débogage pour analyser le token
  useEffect(() => {
    const analyzeToken = () => {
      const token = AuthHelper.getToken();
      if (!token) {
        setTokenInfo("Aucun token trouvé. Veuillez vous connecter.");
        return;
      }

      // Afficher une partie du token pour débogage
      const tokenPart = token.substring(0, 20) + "...";
      setTokenInfo(`Token trouvé: ${tokenPart}`);

      // Vérifier si le token est expiré
      if (AuthHelper.isTokenExpired(token)) {
        setTokenInfo(`Token expiré. Veuillez vous reconnecter.`);
      }
    };

    analyzeToken();
    fetchUsagers()
      .then(() => {})
      .catch((err) => {
        console.error("Erreur lors de la récupération des usagers:", err);
      });
  }, []);

  // Récupérer les détails de l'expérimentation
  useEffect(() => {
    const fetchData = async () => {
      if (!experimentationId) return;

      try {
        setIsLoading(true);
        console.log("Récupération des données de l'expérimentation...");

        // Vérifier et rafraîchir le token si nécessaire
        const token = AuthHelper.getToken();
        if (!token) {
          setError(
            "Aucun token d'authentification trouvé. Veuillez vous connecter."
          );
          setIsLoading(false);
          return;
        }

        // Récupérer les données de l'expérimentation
        const expData = await experimentationService.getComplete(
          experimentationId
        );
        console.log("Données expérimentation reçues:", expData);
        setExperimentation(expData);
        console.log(experimentation);
        // Récupérer les bénéficiaires disponibles en utilisant directement axios
        console.log("Récupération des bénéficiaires pseudonymisés...");

        try {
          // Obtenir les en-têtes d'authentification
          const headers = AuthHelper.getAuthHeaders();
          console.log("En-têtes utilisés:", headers);

          const response = await axios.get(
            "http://localhost:5000/api/usagers-ri2s",
            {
              headers,
              withCredentials: true, // Important pour les cookies de session
            }
          );

          console.log("Données des bénéficiaires:", response.data);
          setPseudonymizedBeneficiaries(response.data);
        } catch (benefErr: any) {
          console.error(
            "Erreur lors du chargement des bénéficiaires:",
            benefErr
          );

          if (benefErr.response && benefErr.response.status === 401) {
            setError(
              "Erreur d'authentification lors du chargement des bénéficiaires. Votre session a peut-être expiré."
            );
          } else {
            setError("Impossible de charger la liste des bénéficiaires");
          }
        }
      } catch (err: any) {
        console.error("Erreur lors du chargement des données:", err);
        setError(
          "Erreur lors du chargement des données: " +
            (err.message || "Erreur inconnue")
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [experimentationId]);

  // Obtenir les statuts pour une cible
  const getStatutsForCible = (cibleId: string): Statut[] => {
    if (!experimentation) return [];
    const cible = experimentation.cibles.find((c) => c._id === cibleId);
    return cible?.statuts || [];
  };

  // Obtenir les champs pour un statut
  const getChamps = (
    statutId: string
  ): { champs: Champ[]; champs_communs: Champ[] } => {
    if (!selectedCible || !experimentation)
      return { champs: [], champs_communs: [] };

    const cible = experimentation.cibles.find((c) => c._id === selectedCible);
    if (!cible) return { champs: [], champs_communs: [] };

    const statut = cible.statuts.find((s) => s._id === statutId);
    if (!statut) return { champs: [], champs_communs: [] };

    return {
      champs: statut.champs || [],
      champs_communs: statut.champs_communs || [],
    };
  };

  const handleCibleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCible(e.target.value);
    console.log("Cible sélectionnée:", e.target.value);
    const x = experimentation?.cibles.find((x) => x._id === e.target.value);
    if (x) {
      if (x.statuts.length !== 0) {
        setSelectedStatut(x.statuts[0]._id);
        console.log("Statut par défaut sélectionné:", x.statuts[0]);
      } else {
        setSelectedStatut("");
      }
    } else {
      setSelectedStatut("");
    }

    // Réinitialiser le statut
    setChampValues({}); // Réinitialiser les valeurs des champs
    setChampCommunValues({});
    // Réinitialiser les valeurs des champs communs
  };

  // Gérer le changement de statut
  const handleStatutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatut(e.target.value);
    setChampValues({}); // Réinitialiser les valeurs des champs
    setChampCommunValues({}); // Réinitialiser les valeurs des champs communs
  };

  // Gérer le changement de valeur d'un champ
  const handleChampChange = (champId: string, value: any) => {
    setChampValues((prev) => ({
      ...prev,
      [champId]: value,
    }));
  };

  // Gérer le changement de valeur d'un champ commun
  const handleChampCommunChange = (champId: string, value: any) => {
    setChampCommunValues((prev) => ({
      ...prev,
      [champId]: value,
    }));
  };

  // Fonction pour rediriger vers la page de connexion
  const handleReconnect = () => {
    // Stocker l'URL actuelle pour y revenir après la connexion
    sessionStorage.setItem(
      "redirectAfterLogin",
      window.location.pathname + window.location.search
    );
    router.push("/"); // Adaptez le chemin selon votre application
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    console.log("Soumission du formulaire...");
    if (!selectedBeneficiary || !selectedCible || !selectedStatut) {
      console.log("error", selectedBeneficiary, selectedCible, selectedStatut);
      setError(
        "Veuillez sélectionner un bénéficiaire, une cible et un statut."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Soumission du formulaire avec les données:", {
        beneficiaireId: selectedBeneficiary,
        experimentationId,
        cibleId: selectedCible,
        statutId: selectedStatut,
        valeurs_champs: champValues,
        valeurs_champs_communs: champCommunValues,
      });

      // Vérifier et rafraîchir le token si nécessaire
      const token = AuthHelper.getToken();
      if (!token) {
        setError(
          "Aucun token d'authentification trouvé. Veuillez vous connecter."
        );
        setIsSubmitting(false);
        return;
      }

      // Si le token est expiré, tenter de le rafraîchir
      if (AuthHelper.isTokenExpired(token)) {
        const newToken = await AuthHelper.refreshToken();
        if (!newToken) {
          setError("Votre session a expiré. Veuillez vous reconnecter.");
          setIsSubmitting(false);
          return;
        }
      }

      // Obtenir les en-têtes d'authentification
      const headers = AuthHelper.getAuthHeaders();
      console.log("En-têtes utilisés pour l'association:", headers);
      console.log("data", {
        experimentationId: experimentationId!,
        cibleId: selectedCible,
        statutId: selectedStatut,
        valeurs_champs: champValues,
        valeurs_champs_communs: champCommunValues,
      });
      // Utiliser directement axios pour l'association
      const response = await axios.post(
        `http://localhost:5000/api/beneficiaries/pseudo/${selectedBeneficiary}/associate`,
        {
          experimentationId: experimentationId!,
          cibleId: selectedCible,
          statutId: selectedStatut,
          valeurs_champs: champValues,
          valeurs_champs_communs: champCommunValues,
        },
        {
          headers,
          withCredentials: true,
        }
      );

      console.log("Réponse de l'association:", response.data);

      // Rediriger vers la page des bénéficiaires de l'expérimentation
      router.push(`/experimentations/${experimentationId}`);
    } catch (err: any) {
      console.error("Erreur lors de l'association:", err);

      // Message d'erreur détaillé
      let errorMessage = "Erreur lors de l'association: ";

      if (err.response) {
        const data = err.response.data;
        console.error("Réponse d'erreur:", {
          status: err.response.status,
          statusText: err.response.statusText,
          data: data,
        });

        if (err.response.status === 401) {
          errorMessage =
            "Votre session a expiré ou vous n'avez pas les droits nécessaires. Veuillez vous reconnecter.";
        } else if (err.response.status === 404) {
          errorMessage =
            "Bénéficiaire introuvable. Veuillez vérifier votre sélection.";
        } else {
          errorMessage += data?.message || `Erreur ${err.response.status}`;
        }
      } else if (err.request) {
        // La requête a été faite mais pas de réponse reçue
        console.error("Aucune réponse reçue:", err.request);
        errorMessage += "Aucune réponse du serveur";
      } else {
        // Quelque chose s'est passé lors de la configuration de la requête
        errorMessage += err.message || "Erreur inconnue";
      }

      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  // Rendu d'un champ dynamique
  const renderChamp = (champ: Champ, isCommun: boolean = false) => {
    const value = isCommun
      ? champCommunValues[champ._id] || ""
      : champValues[champ._id] || "";

    const handleChange = (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      if (isCommun) {
        handleChampCommunChange(champ._id, e.target.value);
      } else {
        handleChampChange(champ._id, e.target.value);
      }
    };

    switch (champ.type) {
      case "text":
        return (
          <input
            type="text"
            className="exp-input"
            value={value}
            onChange={handleChange}
            required={champ.obligatoire}
            placeholder={champ.description || ""}
          />
        );

      case "number":
        return (
          <input
            type="number"
            className="exp-input"
            value={value}
            onChange={handleChange}
            required={champ.obligatoire}
            placeholder={champ.description || ""}
          />
        );

      case "date":
        return (
          <input
            type="date"
            className="exp-input"
            value={value}
            onChange={handleChange}
            required={champ.obligatoire}
          />
        );

      case "select":
        return (
          <div className="filter-select-wrapper">
            <select
              className="filter-select"
              value={value}
              onChange={handleChange}
              required={champ.obligatoire}
            >
              <option key={`${champ._id}-default`} value="">
                Sélectionner une option
              </option>
              {champ.options?.map((option, index) => (
                <option key={`${champ._id}-option-${index}`} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <div className="filter-select-icon">
              <i className="fas fa-chevron-down"></i>
            </div>
          </div>
        );

      case "textarea":
        return (
          <textarea
            className="exp-textarea"
            value={value}
            onChange={handleChange}
            required={champ.obligatoire}
            placeholder={champ.description || ""}
            rows={4}
          />
        );

      default:
        return (
          <input
            type="text"
            className="exp-input"
            value={value}
            onChange={handleChange}
            required={champ.obligatoire}
            placeholder={champ.description || ""}
          />
        );
    }
  };

  // Breadcrumb
  const getBreadcrumbItems = () => {
    return [
      { label: "Accueil", href: "/index" },
      { label: "Expérimentations", href: "/index" },
      {
        label: experimentation?.experimentation?.name || "Expérimentation",
        href: `/experimentations/${experimentationId}`,
      },
      { label: "Associer un bénéficiaire", isCurrentPage: true },
    ];
  };

  if (isLoading) {
    return (
      <div className="exp-loading">
        <div className="exp-spinner"></div>
        <p>Chargement des données...</p>
      </div>
    );
  }

  if (!experimentationId || !experimentation) {
    return (
      <div className="exp-alert exp-alert-error">
        <div className="exp-alert-icon">
          <i className="fas fa-exclamation-circle"></i>
        </div>
        <div>
          <div className="exp-alert-title">Erreur</div>
          <div>Expérimentation introuvable ou paramètre manquant.</div>
        </div>
      </div>
    );
  }

  // Récupérer les champs pour le statut sélectionné
  const { champs, champs_communs } = selectedStatut
    ? getChamps(selectedStatut)
    : { champs: [], champs_communs: [] };

  const Steps0 = () => {
    return (
      <div className="exp-card">
        <div className="exp-card-header">
          <div className="exp-card-title" style={{ color: "#2A7D4F" }}>
            <i
              className="fas fa-bullseye"
              color="#2A7D4F"
              style={{ color: "#2A7D4F" }}
            ></i>
            Sélection du cible
          </div>
        </div>
        <div className="exp-card-content">
          <form className="associate-form">
            <div className="exp-field-group">
              <div className="exp-field-label">
                <i
                  className="fas fa-bullseye"
                  color="#2A7D4F"
                  style={{ color: "#2A7D4F" }}
                ></i>
                Cible
              </div>
              <div className="filter-select-wrapper">
                <select
                  className="filter-select"
                  value={selectedCible}
                  onChange={handleCibleChange}
                  required
                >
                  <option key="default-cible" value="">
                    Sélectionner une cible
                  </option>
                  {experimentation.cibles.map((cible) => (
                    <option key={`cible-${cible._id}`} value={cible._id}>
                      {cible.nom_cible}
                    </option>
                  ))}
                </select>
                <div className="filter-select-icon">
                  <i className="fas fa-chevron-down"></i>
                </div>
              </div>
            </div>
          </form>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "end",
              marginTop: "100px",
            }}
          >
            <button
              className="exp-btn exp-btn-primary"
              disabled={!selectedCible}
              style={
                selectedCible
                  ? {
                      backgroundColor: "#2A7D4F",
                      color: "white",
                      borderColor: "#2A7D4F",
                    }
                  : {
                      backgroundColor: "grey",
                      color: "white",
                      borderColor: "grey",
                    }
              }
              onClick={() => setCurrentStep(1)}
            >
              <i className="fas fa-angle-right"></i>
              suivant
            </button>
          </div>
        </div>
      </div>
    );
  };
  const getCibleName = (cibleId: string): string => {
    const cible = experimentation?.cibles.find((c) => c._id === cibleId);
    return cible ? cible.nom_cible : "Cible inconnue";
  };
  const Steps1 = () => {
    return (
      <div className="exp-card">
        <div className="exp-card-header">
          <div className="exp-card-title" style={{ color: "#2A7D4F" }}>
            <i
              className="fas fa-users"
              color="#2A7D4F"
              style={{ color: "#2A7D4F" }}
            ></i>
            Sélection du bénéficiaire
          </div>
        </div>
        <div className="exp-card-content">
          <form className="associate-form">
            <div className="exp-field-group">
              <div className="exp-field-label">
                <i
                  className="fas fa-user"
                  color="#2A7D4F"
                  style={{ color: "#2A7D4F" }}
                ></i>
                Bénéficiaire
              </div>
              <div className="filter-select-wrapper">
                <select
                  className="filter-select"
                  value={selectedBeneficiary}
                  onChange={(e) => setSelectedBeneficiary(e.target.value)}
                  required
                >
                  <option key="default-beneficiary" value="">
                    Sélectionner un bénéficiaire
                  </option>
                  {pseudonymizedBeneficiaries
                    .filter((b: any) => {
                      console.log(
                        "Bénéficiaire:",
                        b,
                        b.role.indexOf(getCibleName(selectedCible)),
                        getCibleName(selectedCible)
                      );
                      if (b.role.indexOf(getCibleName(selectedCible))) {
                        return true;
                      }
                      return false;
                    })
                    .map((b, index) => (
                      <option key={b.id || `ben-index-${index}`} value={b.id}>
                        {b.pseudoId}
                      </option>
                    ))}
                </select>
                <div className="filter-select-icon">
                  <i className="fas fa-chevron-down"></i>
                </div>
              </div>
            </div>
          </form>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "end",
              marginTop: "100px",
            }}
          >
            <button
              className="exp-btn exp-btn-primary"
              disabled={!selectedBeneficiary}
              style={
                selectedBeneficiary
                  ? {
                      backgroundColor: "#2A7D4F",
                      color: "white",
                      borderColor: "#2A7D4F",
                    }
                  : {
                      backgroundColor: "grey",
                      color: "white",
                      borderColor: "grey",
                    }
              }
              onClick={() => setCurrentStep(2)}
            >
              <i className="fas fa-angle-right"></i>
              suivant
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Steps2 = () => {
    const [champCommunValuesx, setChampCommunValuesx] = useState({});
    console.log("Steps2 is rendering");
    return (
      <div className="exp-card">
        <div className="exp-card-header">
          <div className="exp-card-title" style={{ color: "#2A7D4F" }}>
            <i
              className="fas fa-layer-group"
              color="#2A7D4F"
              style={{ color: "#2A7D4F" }}
            ></i>
            Champs communs
          </div>
        </div>
        <div className="exp-card-content">
          <form className="associate-form">
            {experimentation.champsCommuns.map((champ) => (
              <div className="exp-field-group" key={champ._id}>
                <div className="exp-field-label">{champ.nom_champ}</div>
                <div className="exp-field-input">
                  {champ.type_champ === "texte" ? (
                    <input
                      className="modern-input"
                      onChange={(e) => {
                        setChampCommunValuesx({
                          ...champCommunValuesx,
                          [champ._id]: e.target.value,
                        });
                      }}
                      value={champCommunValuesx[champ._id] || ""}
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </form>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "end",
              marginTop: "100px",
            }}
          >
            <button
              className="exp-btn exp-btn-primary"
              disabled={!selectedBeneficiary}
              style={
                selectedBeneficiary
                  ? {
                      backgroundColor: "#2A7D4F",
                      color: "white",
                      borderColor: "#2A7D4F",
                    }
                  : {
                      backgroundColor: "grey",
                      color: "white",
                      borderColor: "grey",
                    }
              }
              onClick={() => {
                setChampCommunValues(champCommunValuesx);
                setCurrentStep(3);
              }}
            >
              <i className="fas fa-angle-right"></i>
              suivant
            </button>
          </div>
        </div>
      </div>
    );
  };
  const Steps3 = () => {
    return (
      <div className="exp-card">
        <div className="exp-card-header">
          <div className="exp-card-title" style={{ color: "#2A7D4F" }}>
            <i
              className="fa fa-check-circle"
              style={{ marginRight: "10px" }}
            ></i>
            Validation
          </div>
        </div>

        <div className="exp-card-content">
          <form className="associate-form">
            <div className="exp-field-group">
              <div
                className="exp-field-label"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <i
                  className="fas fa-check-circle"
                  style={{ color: "#2A7D4F" }}
                ></i>
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#2A7D4F",
                  }}
                >
                  Confirmer l'association
                </span>
              </div>

              <div
                style={{
                  fontSize: "18px",
                  lineHeight: "1.8",
                  marginTop: "20px",
                  color: "#374151",
                }}
              >
                <p>
                  <strong>Cible :</strong>{" "}
                  {getCibleName(selectedCible) || "N/A"}
                </p>
                <p>
                  <strong>Bénéficiaire :</strong> {selectedBeneficiary || "N/A"}
                </p>
                <p>
                  <strong>Champs communs :</strong>
                </p>
                <div style={{ paddingLeft: "20px" }}>
                  {Object.entries(champCommunValues).map(([champId, value]) => {
                    const champ = experimentation.champsCommuns.find(
                      (c) => c._id === champId
                    );
                    return (
                      <p key={champId} style={{ marginBottom: "8px" }}>
                        <strong>{champ?.nom_champ ?? champId} :</strong>{" "}
                        {value || "N/A"}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          </form>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "60px",
            }}
          >
            <button
              className="exp-btn exp-btn-primary"
              disabled={!selectedBeneficiary}
              style={{
                backgroundColor: selectedBeneficiary ? "#2A7D4F" : "grey",
                color: "white",
                borderColor: selectedBeneficiary ? "#2A7D4F" : "grey",
                padding: "10px 20px",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderRadius: "6px",
              }}
              onClick={handleSubmit}
            >
              <span>Enregistrer</span>
              <i className="fas fa-angle-right"></i>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="exp-container">
      {/* Breadcrumb */}
      <div className="breadcrumbs-container">
        <Breadcrumbs items={getBreadcrumbItems()} />
      </div>

      <h1 className="exp-title">
        <i
          className="fas fa-link"
          color="#2A7D4F"
          style={{ color: "#2A7D4F" }}
        ></i>
        Associer un bénéficiaire à {experimentation.experimentation.name}
      </h1>
      <Stepper currentStep={currentStep} />
      {currentStep == 0 ? <Steps0 /> : null}
      {currentStep == 1 ? <Steps1 /> : null}
      {currentStep == 2 ? <Steps2 /> : null}
      {currentStep == 3 ? <Steps3 /> : null}

      {
        //ici
      }
    </div>
  );
};

export default AssociatePage;
