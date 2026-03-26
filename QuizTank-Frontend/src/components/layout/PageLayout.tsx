import { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function PageLayout({ children, title, subtitle }: PageLayoutProps) {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </main>
  );
}
