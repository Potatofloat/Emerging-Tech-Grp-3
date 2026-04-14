
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="h-12 w-12" />
      </div>
      <h1 className="text-4xl font-headline font-bold mb-2">404 - Area Restricted</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        The page you are looking for does not exist or you do not have the required clearance to access it.
      </p>
      <Button asChild>
        <Link href="/">Return to Dashboard</Link>
      </Button>
    </div>
  );
}
