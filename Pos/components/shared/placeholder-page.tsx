import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PlaceholderPageProps {
  title: string;
  description?: string;
  className?: string;
}

export function PlaceholderPage({
  title,
  description,
  className,
}: PlaceholderPageProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-muted-foreground">{description}</p>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Module scaffold</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This page is initialized and protected. Feature implementation is the
          next build phase.
        </CardContent>
      </Card>
    </div>
  );
}
