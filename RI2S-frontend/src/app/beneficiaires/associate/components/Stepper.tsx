import React from "react";
import "./stepper.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

interface StepperProps {
  currentStep: number;
}

const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  const steps = [
    {
      id: "cibles",
      title: "Cible",
      description: "Sélectionner la cible",
      icon: "fas fa-bullseye"
    },
    {
      id: "beneficiaire",
      title: "Bénéficiaire",
      description: "Sélectionner le bénéficiaire",
      icon: "fas fa-user"
    },
    {
      id: "champs-communs",
      title: "Champs communs",
      description: "Champs pour tous les bénéficiaires",
      icon: "fas fa-layer-group"
    },
    {
      id: "statut-champs",
      title: "Statuts",
      description: "Statuts et champs spécifiques",
      icon: "fas fa-flag"
    },
    {
      id: "validation",
      title: "Validation",
      description: "Vérifier et enregistrer",
      icon: "fas fa-check-circle"
    }
  ];

  // Calculer la largeur de la barre de progression
  const progressWidth = `${(currentStep / (steps.length - 1)) * 100}%`;

  return (
    <div className="stepper-container">
      <ul
        className="stepper"
        style={
          {
            "--progress": currentStep / (steps.length - 1)
          } as React.CSSProperties
        }
      >
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`stepper-step ${
              index === currentStep ? "stepper-step-active" : ""
            } ${index < currentStep ? "stepper-step-completed" : ""}`}
          >
            <div className="stepper-step-circle">
              {index < currentStep ? (
                <i className="fas fa-check"></i>
              ) : (
                <i className={step.icon}></i>
              )}
            </div>
            <div>
              <div className="stepper-step-title">{step.title}</div>
              <div className="stepper-step-description">
                {step.description}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Stepper;