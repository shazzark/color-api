export default async function globalTeardown() {
  try {
    await fetch("http://127.0.0.1:3100/__playwright_shutdown", {
      signal: AbortSignal.timeout(2_000)
    });
  } catch {
    // The web server may already have exited after a startup or test failure.
  }
}
