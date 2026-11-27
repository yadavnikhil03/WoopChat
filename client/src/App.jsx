import { useEffect } from "react";
import { useAuth } from "./hooks/use-auth";
import AppRoutes from "./routes";
import { Spinner } from "./components/ui/spinner";
import Logo from "./components/logo";
import { useLocation } from "react-router-dom";
import { isAuthRoute } from "./routes/routes";

function App() {
  const { pathname } = useLocation();
  const { user, isAuthStatus, isAuthStatusLoading } = useAuth();
  const isAuth = isAuthRoute(pathname);

  useEffect(() => {
    if (isAuth) return;
    isAuthStatus();
  }, [isAuthStatus, isAuth]);

  if (isAuthStatusLoading && !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-[var(--color-base-bg)] text-[var(--color-base-text)]">
        <Logo imgClass="w-16 h-16" showText={false} />
        <Spinner className="w-5 h-5 text-[var(--color-accent-signal)]" />
      </div>
    );
  }

  return <AppRoutes />;
}

export default App;
