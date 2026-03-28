export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuth();

  if (!auth.loaded.value || !auth.user.value) {
    await auth.refresh();
  }

  if (!auth.user.value) {
    return navigateTo("/login");
  }

  if (auth.user.value.role !== "ADMIN") {
    return navigateTo("/");
  }
});
