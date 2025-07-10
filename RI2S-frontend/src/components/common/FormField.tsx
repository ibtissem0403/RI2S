import React, { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, useState } from 'react';
import './formField.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Type des props de base pour un champ
interface FieldBaseProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  icon?: string; // Nouvelle prop pour les icônes Font Awesome (ex: "fas fa-user")
}

// Type des props pour un champ de texte
interface InputFieldProps extends FieldBaseProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'tel' | 'url' | 'time' | 'file';
}

// Type des props pour un textarea
interface TextareaFieldProps extends FieldBaseProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  type: 'textarea';
}

// Type des props pour un select
interface SelectFieldProps extends FieldBaseProps, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  type: 'select';
  options: Array<{ value: string; label: string }>;
}

// Type des props pour un groupe de radio buttons
interface RadioGroupFieldProps extends FieldBaseProps {
  type: 'radio';
  options: Array<{ value: string; label: string }>;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
}

// Type des props pour un groupe de checkboxes
interface CheckboxGroupFieldProps extends FieldBaseProps {
  type: 'checkbox-group';
  options: Array<{ value: string; label: string }>;
  value?: string[];
  onChange?: (values: string[]) => void;
  name: string;
}

// Type des props pour un checkbox simple
interface CheckboxFieldProps extends FieldBaseProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> {
  type: 'checkbox';
}

// Union de tous les types de props
type FormFieldProps = 
  | InputFieldProps 
  | TextareaFieldProps 
  | SelectFieldProps 
  | RadioGroupFieldProps 
  | CheckboxGroupFieldProps
  | CheckboxFieldProps;

const FormField: React.FC<FormFieldProps> = (props) => {
  const { label, error, hint, required, className = '', icon, ...rest } = props;
  
  // ID unique pour le champ
  const id = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  // Classes de base pour les champs
  const baseInputClasses = `
    w-full px-3 py-2 border rounded-md
    focus:outline-none focus:ring-2 focus:ring-primary-color/50
    ${error ? 'border-danger-color' : 'border-gray-300'}
  `;

  // Classes pour le conteneur
  const containerClasses = `mb-4 ${className} form-field`;

  // Rendu conditionnel selon le type de champ
  const renderField = () => {
    switch (props.type) {
      case 'textarea':
        return (
          <textarea
            id={id}
            className={`${baseInputClasses} min-h-[100px]`}
            required={required}
            {...rest as TextareaFieldProps}
          />
        );
        
      case 'select':
        const { options, ...selectRest } = props as SelectFieldProps;
        return (
          <div className="relative">
            <select
              id={id}
              className={baseInputClasses}
              required={required}
              {...selectRest}
            >
              <option value="">Sélectionner...</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="form-field-select-arrow">
              <i className="fas fa-chevron-down"></i>
            </div>
          </div>
        );

      case 'radio':
        const { options: radioOptions, value: radioValue, onChange: radioOnChange, name: radioName } = props as RadioGroupFieldProps;
        return (
          <div className="space-y-2 mt-1">
            {radioOptions.map((option) => (
              <div key={option.value} className="flex items-center form-field-radio">
                <input
                  type="radio"
                  id={`${id}-${option.value}`}
                  name={radioName}
                  value={option.value}
                  checked={radioValue === option.value}
                  onChange={radioOnChange}
                  className="w-4 h-4 text-primary-color focus:ring-primary-color"
                />
                <label htmlFor={`${id}-${option.value}`} className="ml-2 text-sm text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      case 'checkbox-group':
        const { options: checkboxOptions, value: checkboxValues = [], onChange: checkboxOnChange, name: checkboxName } = props as CheckboxGroupFieldProps;
        
        const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const value = e.target.value;
          if (checkboxOnChange) {
            if (e.target.checked) {
              checkboxOnChange([...checkboxValues, value]);
            } else {
              checkboxOnChange(checkboxValues.filter(v => v !== value));
            }
          }
        };
        
        return (
          <div className="space-y-2 mt-1">
            {checkboxOptions.map((option) => (
              <div key={option.value} className="flex items-center form-field-checkbox">
                <input
                  type="checkbox"
                  id={`${id}-${option.value}`}
                  name={checkboxName}
                  value={option.value}
                  checked={checkboxValues.includes(option.value)}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 text-primary-color focus:ring-primary-color"
                />
                <label htmlFor={`${id}-${option.value}`} className="ml-2 text-sm text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center mt-1 form-field-checkbox">
            <input
              id={id}
              type="checkbox"
              className="w-4 h-4 text-primary-color focus:ring-primary-color"
              {...rest as CheckboxFieldProps}
            />
            <label htmlFor={id} className="ml-2 text-sm text-gray-700">
              {label}
            </label>
          </div>
        );
        
      case 'file':
        return (
          <input
            id={id}
            type="file"
            className={`block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0
                       file:text-sm file:font-semibold
                       file:bg-primary-light file:text-primary-color
                       hover:file:bg-primary-light/90`}
            required={required}
            {...rest as InputFieldProps}
          />
        );

      default:
        return (
          <input
            id={id}
            type={props.type || 'text'}
            className={baseInputClasses}
            required={required}
            {...rest as InputFieldProps}
          />
        );
    }
  };

  // Si c'est un checkbox simple, on modifie le rendu du conteneur
  if (props.type === 'checkbox') {
    return (
      <div className={containerClasses}>
        {renderField()}
        {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        {error && <p className="mt-1 text-xs text-danger-color">{error}</p>}
      </div>
    );
  }

  // Rendu standard avec label au-dessus et icône dans le label
  return (
    <div className={containerClasses}>
      <label htmlFor={id} className="block mb-1 text-sm font-medium text-gray-700 form-field-label">
        {icon && <i className={`${icon} mr-2 form-field-label-icon`}></i>}
        {label}
        {required && <span className="text-danger-color ml-1">*</span>}
      </label>
      {renderField()}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-danger-color">{error}</p>}
    </div>
  );
};

export default FormField;