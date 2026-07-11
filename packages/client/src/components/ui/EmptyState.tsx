import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-16 text-center animate-fade-in">
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/10 to-accent-500/10 text-brand-500">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
      {description && <p className="max-w-xs text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      {action}
    </div>
  );
}
