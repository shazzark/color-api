export default function Loading() {
  return (
    <section className="route-status" role="status" aria-live="polite">
      <span className="route-status__line" aria-hidden="true" />
      <p>Loading this ChromaForge page…</p>
    </section>
  );
}
