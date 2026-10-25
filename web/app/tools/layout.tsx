import type { ReactNode } from "react";
import { ToolNavigation } from "@/components/tool-navigation";

export default function ToolsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="tool-layout">
      <ToolNavigation />
      <div className="tool-layout__content">{children}</div>
    </div>
  );
}
