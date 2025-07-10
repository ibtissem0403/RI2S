import styles from '@/app/beneficiary/[id]/style.module.css';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'Actif':
        return '#28a745';
      case 'Sorti':
        return '#6c757d';
      case 'Suspendu':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  return (
    <span 
      className={styles.statusBadge}
      style={{ backgroundColor: getStatusColor() }}
    >
      {status}
    </span>
  );
}