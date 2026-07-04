import * as React from "react";
import { cn } from "@/lib/utils";

interface MainContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function MainContent({
  className,
  children,
  ...props
}: MainContentProps) {
  return (
    <main
      className={cn("flex-1 overflow-auto p-4 lg:p-6", className)}
      {...props}
    >
      {children}
    </main>
  );
}
