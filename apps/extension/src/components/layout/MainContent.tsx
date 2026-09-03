import type { ReactNode } from "react";

import styles from "./MainContent.module.css";

interface MainContentProps {
  children: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  return <main className={styles.main}>{children}</main>;
}
