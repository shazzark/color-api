"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="route-status" role="alert">
      <p className="eyebrow">Something went wrong</p>
      <h1>This page could not be displayed.</h1>
      <p>Try loading the page again. No color input or API response is shown here.</p>
      <button className="button button--primary" type="button" onClick={() => reset()}>Try again</button>
    </section>
  );
}
