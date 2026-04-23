import MiaApp from "@/components/MiaApp";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function Home() {
  return (
    <ErrorBoundary>
      <MiaApp />
    </ErrorBoundary>
  );
}
