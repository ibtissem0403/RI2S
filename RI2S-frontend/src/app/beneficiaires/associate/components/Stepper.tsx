import React, { useState } from "react";
import "./exper.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import { Steps1 } from "./Steps";
const steps = [
  {
    id: "cibles",
    title: "Cibles",
    description: "Définir les profils cibles",
    icon: "fas fa-bullseye",
    step: <Steps1 />,
  },
  {
    id: "Bénéficiaire",
    title: "Bénéficiaire",
    description: "Sélectionner le bénéficiaire",
    icon: "fas fa-info-circle",
    step: <Steps1 />,
  },
  {
    id: "champs-communs",
    title: "Champs communs",
    description: "Champs pour tous les bénéficiaires",
    icon: "fas fa-layer-group",
    step: <Steps1 />,
  },

  {
    id: "validation",
    title: "Validation",
    description: "Vérifier et enregistrer",
    icon: "fas fa-check-circle",
    step: <Steps1 />,
  },
];

const Stepper: React.FC = ({ currentStep }: { currentStep: number }) => {
  const progressWidth = `${(currentStep / (steps.length - 1)) * 100}%`;

  return (
    <div>
      <div className="stepper-container">
        <ul
          className="stepper"
          style={
            {
              "--progress": currentStep / (steps.length - 1),
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
        {/* Barre de progression */}
      </div>
      {steps[currentStep].step}
      <style jsx>{`
        .stepperx::after {
          width: ${progressWidth};
        }
      `}</style>
    </div>
  );
};

export default Stepper;
