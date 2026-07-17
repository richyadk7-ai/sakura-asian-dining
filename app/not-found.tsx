import Link from "next/link";

export default function NotFound() {
  return <main className="not-found"><span aria-hidden="true">桜</span><p className="eyebrow">404 · Page not found</p><h1>This table is not here.</h1><p>お探しのページが見つかりませんでした。</p><Link className="button button-gold" href="/en">Return home / ホームへ</Link></main>;
}
