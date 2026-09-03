import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.title}>Frontend Inspector</div>

      <div className={styles.status}>
        <span className={styles.framework}>React</span>
        <span className={styles.connected}>✓ Connected</span>
      </div>
    </header>
  );
}