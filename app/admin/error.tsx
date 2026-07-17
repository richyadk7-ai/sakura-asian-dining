"use client";

import Link from "next/link";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="admin-page"><div className="admin-auth-card"><p className="eyebrow">Dashboard action failed</p><h1>Nothing was published.</h1><p role="alert">{error.message || "The requested owner action could not be completed."}</p><button className="button button-gold" onClick={reset}>Try again</button><Link className="text-link" href="/admin">Return to dashboard</Link></div></main>;
}
