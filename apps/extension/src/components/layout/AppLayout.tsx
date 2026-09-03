import type { ReactNode } from "react";

import { Header } from "./Header";
import { MainContent } from "./MainContent";
import { Sidebar } from "./Sidebar";
import styles from "./AppLayout.module.css";

interface AppLayoutProps {
  children: ReactNode;
  isReactDetected: boolean;
}

export function AppLayout({ children, isReactDetected }: AppLayoutProps) {
  return (
    <div className={styles.layout}>
      <Header isReactDetected={isReactDetected} />

      <div className={styles.content}>
        <Sidebar />

        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
}
