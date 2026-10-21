import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

/**
 * @param {object} summary
 * @param {string} outDir
 */
export async function writeReports(summary, outDir) {
  await mkdir(outDir, { recursive: true });
  const jsonPath = join(outDir, "summary.json");
  await writeFile(jsonPath, JSON.stringify(summary, null, 2), "utf8");

  const html = renderThaiHtml(summary, outDir);
  const htmlPath = join(outDir, "index.html");
  await writeFile(htmlPath, html, "utf8");
  return { jsonPath, htmlPath };
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function severityRank(s) {
  return s === "fail" ? 0 : s === "warn" ? 1 : 2;
}

function renderThaiHtml(summary, outDir) {
  const issues = [...(summary.issues || [])].sort(
    (a, b) => severityRank(a.severity) - severityRank(b.severity),
  );
  const pages = summary.pages || [];

  const issueRows = issues
    .map((iss) => {
      const shot = iss.screenshot
        ? `<a href="${esc(rel(outDir, iss.screenshot))}">ภาพ</a>`
        : "—";
      return `<tr class="sev-${esc(iss.severity)}">
        <td><span class="badge">${esc(iss.severity)}</span></td>
        <td>${esc(iss.code)}</td>
        <td>${esc(iss.pageId || "")} / ${esc(iss.viewport || "")}</td>
        <td>${esc(iss.message)}</td>
        <td>${shot}</td>
      </tr>`;
    })
    .join("\n");

  const grid = pages
    .map((p) => {
      const shots = (p.screenshots || [])
        .map(
          (s) => `<figure>
            <figcaption>${esc(s.viewport)}</figcaption>
            <a href="${esc(rel(outDir, s.path))}"><img src="${esc(rel(outDir, s.path))}" alt="${esc(p.id)} ${esc(s.viewport)}" loading="lazy" /></a>
          </figure>`,
        )
        .join("");
      return `<section class="page">
        <h3>${esc(p.id)} <small>${esc(p.path)}</small></h3>
        <div class="grid">${shots}</div>
      </section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ClipperQ UI QA Report</title>
  <style>
    :root { --bg:#0f1419; --card:#1a222c; --text:#e8eef4; --muted:#8b9aab; --fail:#f07178; --warn:#e6b450; --ok:#7fd962; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: "Sarabun", "Noto Sans Thai", system-ui, sans-serif; background:var(--bg); color:var(--text); line-height:1.45; }
    header { padding:1.5rem 1.25rem; border-bottom:1px solid #2a3542; background:linear-gradient(180deg,#1a2836,#0f1419); }
    h1 { margin:0 0 .35rem; font-size:1.5rem; }
    .meta { color:var(--muted); font-size:.9rem; }
    main { padding:1.25rem; max-width:1200px; margin:0 auto; }
    .stats { display:flex; flex-wrap:wrap; gap:.75rem; margin:1rem 0 1.5rem; }
    .stat { background:var(--card); padding:.75rem 1rem; border-radius:10px; min-width:7rem; }
    .stat b { display:block; font-size:1.35rem; }
    table { width:100%; border-collapse:collapse; background:var(--card); border-radius:12px; overflow:hidden; }
    th, td { padding:.65rem .75rem; text-align:left; border-bottom:1px solid #2a3542; font-size:.88rem; vertical-align:top; }
    th { color:var(--muted); font-weight:600; }
    .badge { display:inline-block; padding:.1rem .45rem; border-radius:6px; font-size:.75rem; font-weight:700; text-transform:uppercase; }
    .sev-fail .badge { background:#3d1f24; color:var(--fail); }
    .sev-warn .badge { background:#3a3018; color:var(--warn); }
    .sev-info .badge { background:#1e2a22; color:var(--ok); }
    .page { margin:2rem 0; }
    .page h3 { margin:0 0 .75rem; font-size:1.05rem; }
    .page small { color:var(--muted); font-weight:400; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:.75rem; }
    figure { margin:0; background:var(--card); border-radius:10px; overflow:hidden; }
    figcaption { padding:.4rem .6rem; font-size:.75rem; color:var(--muted); }
    img { display:block; width:100%; height:auto; background:#000; }
    a { color:#7db7ff; }
  </style>
</head>
<body>
  <header>
    <h1>รายงาน UI QA — ClipperQ</h1>
    <p class="meta">เป้าหมาย: ${esc(summary.baseUrl)} · ร้าน: ${esc(summary.shopSlug)} · เวลา: ${esc(summary.startedAt)}</p>
    <p class="meta">โหมด auth: ${esc(summary.authMode)} · สถานะรวม: <strong>${esc(summary.verdict)}</strong></p>
  </header>
  <main>
    <div class="stats">
      <div class="stat"><b>${summary.counts?.fail ?? 0}</b> Fail</div>
      <div class="stat"><b>${summary.counts?.warn ?? 0}</b> Warn</div>
      <div class="stat"><b>${summary.counts?.info ?? 0}</b> Info</div>
      <div class="stat"><b>${pages.length}</b> หน้า</div>
      <div class="stat"><b>${summary.viewportCount ?? 3}</b> Viewport</div>
    </div>

    <h2>ปัญหา (เรียงตามความรุนแรง)</h2>
    <table>
      <thead><tr><th>ระดับ</th><th>รหัส</th><th>หน้า / Viewport</th><th>รายละเอียด</th><th>ภาพ</th></tr></thead>
      <tbody>
        ${issueRows || '<tr><td colspan="5">ไม่พบปัญหา</td></tr>'}
      </tbody>
    </table>

    <h2>ภาพหน้าจอ (หน้า × 3 viewport)</h2>
    ${grid}
  </main>
</body>
</html>`;
}

function rel(outDir, absPath) {
  try {
    return relative(outDir, absPath).split("\\").join("/");
  } catch {
    return absPath;
  }
}

export async function ensureDir(path) {
  await mkdir(dirname(path), { recursive: true });
}
