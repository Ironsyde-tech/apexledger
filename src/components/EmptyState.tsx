import { ReactNode } from "react";
import { AlertCircle, BookOpen, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export type EmptyStateVariant = "error" | "empty" | "not-found";

export function EmptyState({
  variant = "empty",
  title,
  description,
  action,
  onRetry,
}: {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  action?: ReactNode;
  onRetry?: () => void;
}) {
  const defaults: Record<EmptyStateVariant, { title: string; description: string; icon: ReactNode }> = {
    error: {
      title: "Something went wrong",
      description: "We couldn't load the data. Please try again.",
      icon: <AlertCircle className="h-10 w-10 text-destructive" />,
    },
    empty: {
      title: "No courses yet",
      description: "Check back soon — new courses are added regularly.",
      icon: <BookOpen className="h-10 w-10 text-muted-foreground" />,
    },
    "not-found": {
      title: "Not found",
      description: "The page or item you're looking for doesn't exist.",
      icon: <SearchX className="h-10 w-10 text-muted-foreground" />,
    },
  };

  const config = defaults[variant];
  const displayTitle = title ?? config.title;
  const displayDesc = description ?? config.description;

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-5">{config.icon}</div>
      <h3 className="font-display text-2xl mb-2">{displayTitle}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{displayDesc}</p>
      {action ?? (onRetry ? (
        <Button variant="outline" onClick={onRetry}>Try again</Button>
      ) : null)}
    </div>
  );
}
