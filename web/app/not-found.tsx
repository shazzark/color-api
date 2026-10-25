import Link from "next/link";

export default function NotFound() {
  return (
    <section className="route-status">
      <p className="eyebrow">404 / NOT FOUND</p>
      <h1>That route is not part of the current plan.</h1>
      <p>Use the navigation to browse the published package and planned website routes.</p>
      <Link className="button button--primary" href="/">Return home</Link>
    </section>
  );
}
