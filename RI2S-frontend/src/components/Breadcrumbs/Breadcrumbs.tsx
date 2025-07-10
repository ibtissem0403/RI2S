// components/Breadcrumbs/Breadcrumbs.tsx
'use client';

import { useRouter } from 'next/navigation';
import styles from './Breadcrumbs.module.css';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showBackButton?: boolean;
}

export default function Breadcrumbs({ items, showBackButton = true }: BreadcrumbsProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  return (
    <div className={styles.breadcrumbContainer}>
      <div className={styles.breadcrumb}>
        {showBackButton && (
          <button onClick={handleBack} className={styles.backLink}>
            <i className="fas fa-arrow-left"></i>
            Retour /
          </button>
        )}
        
        <div className={styles.breadcrumbPath}>
          {items.map((item, index) => (
            <div key={index} className={styles.breadcrumbItem}>
              {index > 0 && <span className={styles.separator}>/</span>}
              
              {item.href && !item.isCurrentPage ? (
                <button 
                  onClick={() => handleNavigate(item.href!)}
                  className={styles.breadcrumbLink}
                >
                  {item.label}
                </button>
              ) : (
                <span 
                  className={item.isCurrentPage ? styles.currentPage : styles.breadcrumbText}
                >
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}