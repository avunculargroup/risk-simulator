import React from "react";
import { AlertTriangle } from "lucide-react";
import type { NarrativeOutput, NarrativeParagraph } from "@/engine/types";
import { cn } from "@/lib/utils";

interface SmartSummaryProps {
  narrative: NarrativeOutput;
}

const colorHintClasses: Record<string, string> = {
  gain: "text-bts-gain",
  loss: "text-bts-loss",
  warning: "text-bts-warning",
  gold: "text-bts-gold",
};

function renderParagraph(para: NarrativeParagraph, idx: number) {
  return (
    <p key={idx} className="text-body text-bts-secondary leading-relaxed">
      {para.segments.map((seg, si) => {
        if (seg.type === "text") {
          return <span key={si}>{seg.content}</span>;
        }
        if (seg.type === "number") {
          return (
            <span
              key={si}
              className={cn(
                "font-mono font-bold",
                seg.colorHint ? colorHintClasses[seg.colorHint] : "text-bts-primary"
              )}
            >
              {seg.content}
            </span>
          );
        }
        if (seg.type === "regime") {
          return (
            <span key={si} className="font-bold text-bts-warning">
              {seg.content}
            </span>
          );
        }
        return <span key={si}>{seg.content}</span>;
      })}
    </p>
  );
}

export function SmartSummary({ narrative }: SmartSummaryProps) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-display text-section-title text-bts-primary">
        {narrative.headline}
      </h3>

      <div className="flex flex-col gap-3">
        {narrative.paragraphs.map((para, i) => renderParagraph(para, i))}
      </div>

      {narrative.keyInsights.length > 0 && (
        <div className="rounded-lg border border-bts-warning-dim bg-bts-warning-dim p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle
              size={16}
              strokeWidth={1.5}
              className="mt-0.5 flex-shrink-0 text-bts-warning"
            />
            <div className="flex flex-col gap-1">
              <p className="text-caption font-semibold uppercase tracking-wider text-bts-warning">
                Key Insights
              </p>
              <ul className="flex flex-col gap-1">
                {narrative.keyInsights.map((insight, i) => (
                  <li key={i} className="text-body-sm text-bts-secondary">
                    • {insight}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
