import type { AuthUser } from "~/types/models";

export const useAuth = () => {
  const user = useState<AuthUser | null>("auth:user", () => null);
  const loaded = useState<boolean>("auth:loaded", () => false);

  const fetchMe = () => {
    if (import.meta.server) {
      return $fetch<{ user: AuthUser | null }>("/api/auth/me", {
        headers: useRequestHeaders(["cookie"])
      });
    }

    return $fetch<{ user: AuthUser | null }>("/api/auth/me");
  };

  const getErrorStatus = (error: any): number | null => {
    const status =
      error?.statusCode ?? error?.status ?? error?.response?.status ?? error?.data?.statusCode;
    return typeof status === "number" ? status : null;
  };

  const refresh = async () => {
    const hadUser = Boolean(user.value);
    const wasLoaded = loaded.value;

    try {
      const result = await fetchMe();
      user.value = result.user;
    } catch (error: any) {
      const status = getErrorStatus(error);

      // Session opravdu neplatí.
      if (status === 401) {
        user.value = null;
      } else if (!wasLoaded && !hadUser) {
        // První načtení bez uživatele a bez odpovědi serveru.
        user.value = null;
      }
      // Při dočasné chybě/HMR výpadku necháme existující user state beze změny.
    } finally {
      loaded.value = true;
    }

    return user.value;
  };

  const logout = async () => {
    await $fetch("/api/auth/logout", { method: "POST" });
    user.value = null;
    loaded.value = true;
  };

  return {
    user,
    loaded,
    refresh,
    logout
  };
};
