import { Link } from "@tanstack/react-router";

type NotFoundPageProps = {
  title?: string;
  heading?: string;
  description?: string;
  homeLabel?: string;
};

export function NotFoundPage({
  title = "404",
  heading = "Page not found",
  description = "The page you're looking for doesn't exist or has been moved.",
  homeLabel = "Back to home",
}: NotFoundPageProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-foreground">{title}</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{heading}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-gold px-4 py-2 text-sm font-medium text-gold-foreground transition-colors hover:brightness-110"
          >
            {homeLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
