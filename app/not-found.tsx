import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-4xl font-bold text-primary mb-4 font-mono uppercase tracking-tight">
          Page Not Found
        </h1>
        <p className="text-muted-foreground mb-6 font-medium">
          The page you are looking for does not exist within the Whisperr Vault.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/" passHref>
            <Button variant="ghost">Home</Button>
          </Link>
          <Link href="/dashboard" passHref>
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
