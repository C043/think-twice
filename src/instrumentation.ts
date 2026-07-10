export async function register() {
  const { startTestTimer } = await import("./lib/scheduled-worker");
  startTestTimer();
}
