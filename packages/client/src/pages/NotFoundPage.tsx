import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-50 text-center dark:bg-surface-dark">
      <h1 className="bg-gradient-to-br from-brand-500 to-accent-500 bg-clip-text text-7xl font-black text-transparent">404</h1>
      <p className="text-gray-500 dark:text-gray-400">This page drifted off into the void.</p>
      <Link to="/people">
        <Button>Back to NexusChat</Button>
      </Link>
    </div>
  );
}
