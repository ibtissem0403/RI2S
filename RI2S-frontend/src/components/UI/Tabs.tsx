import React, { useState } from 'react';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTabId?: string;
  variant?: 'default' | 'pills' | 'underline';
  onChange?: (tabId: string) => void;
  className?: string;
  tabsClassName?: string;
  contentClassName?: string;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTabId,
  variant = 'default',
  onChange,
  className = '',
  tabsClassName = '',
  contentClassName = ''
}) => {
  // Utiliser le premier onglet si aucun onglet par défaut n'est spécifié
  const firstEnabledTab = tabs.find(tab => !tab.disabled);
  const initialTabId = defaultTabId || (firstEnabledTab ? firstEnabledTab.id : '');
  
  const [activeTabId, setActiveTabId] = useState(initialTabId);

  // Gérer le changement d'onglet
  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId);
    if (onChange) {
      onChange(tabId);
    }
  };

  // Obtenir les classes pour un onglet basé sur la variante
  const getTabClasses = (tab: TabItem, isActive: boolean) => {
    const baseClasses = 'flex items-center px-4 py-2 text-sm font-medium transition-colors duration-200';
    const disabledClasses = tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
    
    // Classes spécifiques à la variante
    let variantClasses = '';
    
    switch (variant) {
      case 'pills':
        variantClasses = isActive
          ? 'bg-primary-color text-white rounded-md shadow-sm'
          : 'bg-transparent text-gray-600 hover:bg-gray-100 rounded-md';
        break;
      case 'underline':
        variantClasses = isActive
          ? 'text-primary-color border-b-2 border-primary-color'
          : 'text-gray-600 hover:text-primary-color border-b-2 border-transparent';
        break;
      default: // 'default'
        variantClasses = isActive
          ? 'text-primary-color border-b-2 border-primary-color'
          : 'text-gray-600 hover:text-gray-800 border-b-2 border-transparent';
        break;
    }

    return `${baseClasses} ${variantClasses} ${disabledClasses}`;
  };

  // Classes pour le conteneur d'onglets
  const getTabsContainerClasses = () => {
    const baseClasses = 'flex';
    
    switch (variant) {
      case 'pills':
        return `${baseClasses} p-1 space-x-1 bg-gray-100 rounded-lg ${tabsClassName}`;
      case 'underline':
        return `${baseClasses} border-b border-gray-200 ${tabsClassName}`;
      default: // 'default'
        return `${baseClasses} border-b border-gray-200 ${tabsClassName}`;
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Onglets */}
      <div className={getTabsContainerClasses()}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={getTabClasses(tab, activeTabId === tab.id)}
            onClick={() => !tab.disabled && handleTabClick(tab.id)}
            disabled={tab.disabled}
            role="tab"
            aria-selected={activeTabId === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu des onglets */}
      <div className={`mt-4 ${contentClassName}`}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`tabpanel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            className={activeTabId === tab.id ? 'block' : 'hidden'}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tabs;