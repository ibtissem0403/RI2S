// Stepper.tsx - Version corrigée
import React from 'react';
import './stepper.css';

interface Step {
  id: string;
  title: string;
  description: string;
}

interface StepperProps {
  steps: Step[];
  activeStep: number;
  onChange: (step: number) => void;
  clickable?: boolean;
}

const Stepper: React.FC<StepperProps> = ({
  steps,
  activeStep,
  onChange,
  clickable = true
}) => {
  // Gérer le clic sur une étape
  const handleStepClick = (index: number) => {
    if (clickable) {
      onChange(index);
    }
  };

  return (
    <div className="stepper-container">
      <ol 
        className="stepper" 
        style={{ '--progress': activeStep / (steps.length - 1) } as React.CSSProperties}
      >
        {steps.map((step, index) => {
          // Déterminer si l'étape est avant, courante ou après l'étape active
          const isCompleted = index < activeStep;
          const isCurrent = index === activeStep;
          
          return (
            <li
              key={step.id}
              className="stepper-step"
              aria-current={isCurrent}
              data-completed={isCompleted}
              // Ne pas utiliser data-disabled ici car cela sera géré par le parent
              onClick={() => handleStepClick(index)}
              style={{ 
                cursor: clickable ? 'pointer' : 'default',
              }}
            >
              <div className="stepper-circle">
                {isCompleted ? (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className="stepper-content">
                <div className="stepper-title">{step.title}</div>
                <div className="stepper-description">{step.description}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default Stepper;