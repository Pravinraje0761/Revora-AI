"use client";

import { Fragment } from "react";

function inlineBold(part: string, keyBase: number) {
  const parts = part.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) {
      return (
        <strong key={`${keyBase}-${i}`} className="font-semibold text-gray-900">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={`${keyBase}-${i}`}>{p}</Fragment>;
  });
}

export default function NlMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1 text-[13px] leading-snug text-gray-800">
      {lines.map((line, i) =>
        line.trim() === "" ? (
          <div key={i} className="h-2 shrink-0" aria-hidden />
        ) : (
          <div key={i} className="min-h-[1.25rem]">
            {inlineBold(line, i)}
          </div>
        ),
      )}
    </div>
  );
}
