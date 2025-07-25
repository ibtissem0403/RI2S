import { ClinicalDocument } from '@/types/models';
import styles from '@/app/beneficiary/[id]/style.module.css';

export default function DocumentItem({ document }: { document: ClinicalDocument }) {
  return (
    <li className={styles.documentItem}>
      <div className={styles.documentIcon}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      </div>
      <div className={styles.documentInfo}>
        <div className={styles.documentName}>{document.name}</div>
        <div className={styles.documentDate}>Ajouté le {document.date}</div>
      </div>
      <div className={styles.documentActions}>
        
    
      </div>
    </li>
  );
}