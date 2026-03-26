import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  stepInfo?: string;
}

export function SectionHeader({ title, stepInfo }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between bg-primary text-primary-foreground px-6 py-6 rounded-t-xl">
      <h2 className="text-xl font-semibold">{title}</h2>
      {stepInfo && <span className="text-sm opacity-90">{stepInfo}</span>}
    </div>
  );
}

interface FormFieldProps {
  label: string;
  children: ReactNode;
  hint?: string;
}

export function FormField({ label, children, hint }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-foreground">
        {label}
        {hint && <span className="ml-1 text-xs font-normal text-muted-foreground">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

interface ReadOnlyFieldProps {
  label: string;
  value: string | ReactNode;
}

export function ReadOnlyField({ label, value }: ReadOnlyFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-foreground">{label}</label>
      <div className="bg-muted rounded-lg px-4 py-3 text-sm text-foreground">
        {value}
      </div>
    </div>
  );
}
