export async function register() {
  const { checkReviewsJob: startTestTimer } =
    await import("./lib/scheduled-worker");
  startTestTimer();
}
