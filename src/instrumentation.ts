export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    setTimeout(async () => {
      try {
        const { startScheduledWorker } = await import("./lib/scheduled-worker");
        await startScheduledWorker();
      } catch (error) {
        console.error("Failed to start worker from instrumentation:", error);
      }
    }, 1000);
  }
}
