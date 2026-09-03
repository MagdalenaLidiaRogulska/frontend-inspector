import styles from "./Header.module.css";

interface HeaderProps {
  isReactDetected: boolean;
}

export function Header({ isReactDetected }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.title}>Frontend Inspector</div>

      <div className={styles.status}>
        <span className={styles.framework}>React</span>

        <span
          className={isReactDetected ? styles.connected : styles.disconnected}
        >
          {isReactDetected ? "✓ Connected" : "✕ Not detected"}
        </span>
      </div>
    </header>
  );
}
