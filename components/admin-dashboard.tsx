"use client";

import { AlertTriangle, CheckCircle2, Eye, ImageUp, LogOut, Save, Send, Star } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { logout, publishDocument, publishPhoto, saveDraft, toggleFeatured, uploadPhoto } from "@/app/admin/actions";
import type { ContentDocument, ImageInventoryEntry } from "@/types";

type DocumentState = { id: ContentDocument["id"]; payload: unknown; publishedAt?: string | null };

function missingTranslations(value: unknown, path = ""): string[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap((item, index) => missingTranslations(item, `${path}[${index}]`));
  const record = value as Record<string, unknown>;
  const issues: string[] = [];
  for (const key of Object.keys(record)) {
    if (key.endsWith("En")) {
      const peer = `${key.slice(0, -2)}Ja`;
      if (!record[peer]) issues.push(`${path}.${peer}`.replace(/^\./, ""));
    }
    if (key.endsWith("Ja")) {
      const peer = `${key.slice(0, -2)}En`;
      if (!record[peer]) issues.push(`${path}.${peer}`.replace(/^\./, ""));
    }
    issues.push(...missingTranslations(record[key], `${path}.${key}`));
  }
  return [...new Set(issues)];
}

export function AdminDashboard({ initialDocuments, inventory, photoRows }: { initialDocuments: DocumentState[]; inventory: ImageInventoryEntry[]; photoRows: Array<{ id: string; published: boolean; authorized: boolean; featured: boolean; category: string }> }) {
  const [tab, setTab] = useState<ContentDocument["id"] | "photos">("restaurant");
  return (
    <div className="admin-dashboard">
      <header className="admin-header"><div><p className="eyebrow">Protected owner area</p><h1>Sakura content studio</h1></div><div className="admin-header-actions"><Link className="button button-outline" href="/admin/preview" target="_blank"><Eye />Preview drafts</Link><form action={logout}><button className="button button-outline"><LogOut />Sign out</button></form></div></header>
      <nav className="admin-tabs" aria-label="Dashboard sections">{[...initialDocuments.map((item) => item.id), "photos"].map((id) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id as typeof tab)}>{id}</button>)}</nav>
      {initialDocuments.map((document) => tab === document.id ? <DocumentEditor key={document.id} document={document} /> : null)}
      {tab === "photos" ? <PhotoManager inventory={inventory} photoRows={photoRows} /> : null}
    </div>
  );
}

function DocumentEditor({ document }: { document: DocumentState }) {
  const [json, setJson] = useState(() => JSON.stringify(document.payload, null, 2));
  const parsed = useMemo(() => { try { return { value: JSON.parse(json), error: "" }; } catch (error) { return { value: null, error: error instanceof Error ? error.message : "Invalid JSON" }; } }, [json]);
  const missing = parsed.value ? missingTranslations(parsed.value) : [];
  return <section className="admin-panel"><div className="admin-panel-title"><div><h2>{document.id}</h2><p>{document.publishedAt ? `Published ${new Date(document.publishedAt).toLocaleString()}` : "Using static fallback until first publish"}</p></div>{parsed.error ? <span className="status-error"><AlertTriangle />Invalid JSON</span> : missing.length ? <span className="status-warning"><AlertTriangle />{missing.length} translation gaps</span> : <span className="status-good"><CheckCircle2 />Bilingual fields complete</span>}</div><textarea aria-label={`Edit ${document.id} JSON`} value={json} onChange={(event) => setJson(event.target.value)} spellCheck={false} /><div className="admin-actions"><form action={saveDraft}><input type="hidden" name="id" value={document.id} /><input type="hidden" name="payload" value={json} /><button className="button button-outline" disabled={Boolean(parsed.error)}><Save />Save draft</button></form><form action={publishDocument}><input type="hidden" name="id" value={document.id} /><button className="button button-gold"><Send />Publish saved draft</button></form></div>{missing.length ? <details><summary>Missing translations</summary><ul>{missing.slice(0, 100).map((item) => <li key={item}>{item}</li>)}</ul></details> : null}</section>;
}

function PhotoManager({ inventory, photoRows }: { inventory: ImageInventoryEntry[]; photoRows: Array<{ id: string; published: boolean; authorized: boolean; featured: boolean; category: string }> }) {
  const imported = new Set(photoRows.map((row) => row.id));
  const missing = inventory.filter((entry) => !imported.has(entry.referenceId));
  return <section className="admin-panel"><div className="admin-panel-title"><div><h2>Authorized originals</h2><p>{photoRows.length} uploaded · {missing.length} inventory slots awaiting import</p></div></div><form className="photo-upload-form" action={uploadPhoto}><label>Inventory reference<select name="referenceId" required defaultValue=""><option value="" disabled>Select a missing slot</option>{missing.map((entry) => <option key={entry.referenceId} value={entry.referenceId}>{entry.referenceId} · {entry.category} #{entry.sourceOrder}</option>)}</select></label><label>English alt text<input name="altEn" required /></label><label>Japanese alt text<input name="altJa" required /></label><label>Original photograph<input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/tiff" required /></label><label className="checkbox-line"><input name="authorized" type="checkbox" value="yes" required /> I confirm this restaurant has authorized publication of this original.</label><label className="checkbox-line"><input name="featured" type="checkbox" value="yes" /> Feature this image in eligible public placements.</label><button className="button button-gold"><ImageUp />Audit & upload original</button></form>{photoRows.length ? <div className="uploaded-photos">{photoRows.map((row) => <article key={row.id}><strong>{row.id}</strong><span>{row.category} · {row.published ? "Published" : "Draft"}{row.featured ? " · Featured" : ""}</span><form action={toggleFeatured}><input type="hidden" name="id" value={row.id} /><input type="hidden" name="featured" value={row.featured ? "no" : "yes"} /><button className="text-link"><Star />{row.featured ? "Unfeature" : "Feature"}</button></form>{!row.published && row.authorized ? <form action={publishPhoto}><input type="hidden" name="id" value={row.id} /><button className="text-link">Publish</button></form> : null}</article>)}</div> : null}</section>;
}
