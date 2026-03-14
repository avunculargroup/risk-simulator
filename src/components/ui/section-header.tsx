import React from "react";
import { cn } from "@/lib/utils";

type HeaderLevel = "page" | "section" | "subsection";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  level?: HeaderLevel;
  action?: React.ReactNode;
  className?: string;
}

const levelClasses: Record<HeaderLevel, string> = {
  page: "font-display text-page-title text-bts-primary",
  section: "font-display text-section-title text-bts-primary",
  subsection: "font-sans text-subsection font-semibold text-bts-primary",
};

export function SectionHeader({
  title,
  subtitle,
  level = "section",
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <h2 className={levelClasses[level]}>{title}</h2>
        {subtitle && (
          <p className="mt-1 text-body-sm text-bts-secondary">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
