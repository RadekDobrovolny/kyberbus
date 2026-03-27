export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuth();

  if (!auth.loaded.value || !auth.user.value) {
    await auth.refresh();
  }

  if (!auth.user.value) {
    return navigateTo("/login");
  }
});
