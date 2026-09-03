import styles from "./Sidebar.module.css";

const navigationItems = [
  "Components",
  "Renders",
  "Storage",
  "Console",
  "Network",
  "Performance",
  "Reports",
];

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav} aria-label="Main navigation">
        {navigationItems.map((item, index) => (
          <button
            key={item}
            className={`${styles.item} ${index === 0 ? styles.itemActive : ""}`}
            type="button"
          >
            {item}
          </button>
        ))}
      </nav>
    </aside>
  );
}
