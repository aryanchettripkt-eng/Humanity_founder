import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-3xl font-semibold text-foreground">404</h1>
      <p className="mt-2 text-sm text-muted-foreground">This page could not be found.</p>
      <Button asChild className="mt-4">
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}

