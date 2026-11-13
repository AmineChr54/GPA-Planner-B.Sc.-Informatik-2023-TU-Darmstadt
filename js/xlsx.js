/* ==========================================================================
   Minimal .xlsx reader — no library. An .xlsx file is a zip of XML files:
   walk the zip's central directory, inflate entries with the browser's
   DecompressionStream, read shared strings + the first sheet via DOMParser.
   Enough for plain tables like the TU exam schedule.
   ========================================================================== */
"use strict";

const Xlsx = (() => {
  async function inflateRaw(bytes) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  function unzip(buf) {
    const dv = new DataView(buf), u8 = new Uint8Array(buf), dec = new TextDecoder();
    let eocd = -1; // end-of-central-directory record, searched from the end
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error("xlsx.notZip");
    const count = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);
    const files = new Map();
    for (let k = 0; k < count && dv.getUint32(p, true) === 0x02014b50; k++) {
      const method = dv.getUint16(p + 10, true), size = dv.getUint32(p + 20, true);
      const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      files.set(dec.decode(u8.subarray(p + 46, p + 46 + nlen)), { method, size, off });
      p += 46 + nlen + xlen + clen;
    }
    async function read(name) {
      const f = files.get(name); if (!f) return null;
      const start = f.off + 30 + dv.getUint16(f.off + 26, true) + dv.getUint16(f.off + 28, true);
      const data = u8.subarray(start, start + f.size);
      return dec.decode(f.method === 0 ? data : await inflateRaw(data));
    }
    return { read };
  }

  const xml = (s) => new DOMParser().parseFromString(s, "application/xml");
  const texts = (el) => [...el.getElementsByTagName("t")].map((x) => x.textContent).join("");

  /* → { sheetName, modified, rows: [{A: "...", B: "...", …}] } for the first sheet */
  async function readFirstSheet(buf) {
    if (typeof DecompressionStream === "undefined") throw new Error("xlsx.unsupported");
    const z = unzip(buf);
    const ssx = await z.read("xl/sharedStrings.xml");
    const ss = ssx ? [...xml(ssx).getElementsByTagName("si")].map(texts) : [];
    const wb = xml(await z.read("xl/workbook.xml"));
    const sheet = wb.getElementsByTagName("sheet")[0];
    if (!sheet) throw new Error("xlsx.noSheet");
    const rid = sheet.getAttribute("r:id");
    let target = "worksheets/sheet1.xml";
    const relsX = await z.read("xl/_rels/workbook.xml.rels");
    if (relsX) for (const r of xml(relsX).getElementsByTagName("Relationship")) if (r.getAttribute("Id") === rid) target = r.getAttribute("Target");
    const path = target.startsWith("/") ? target.slice(1) : "xl/" + target.replace(/^\.\//, "");
    const rows = [];
    for (const row of xml(await z.read(path)).getElementsByTagName("row")) {
      const o = {};
      for (const c of row.getElementsByTagName("c")) {
        const col = (c.getAttribute("r") || "").replace(/\d+/g, "");
        const tp = c.getAttribute("t"), v = c.getElementsByTagName("v")[0];
        o[col] = tp === "s" ? ss[+(v ? v.textContent : -1)] ?? "" : tp === "inlineStr" ? texts(c) : v ? v.textContent : "";
      }
      rows.push(o);
    }
    let modified = null;
    const core = await z.read("docProps/core.xml");
    if (core) { const m = core.match(/<dcterms:modified[^>]*>([^<]+)</); if (m) modified = m[1].slice(0, 10); }
    return { sheetName: sheet.getAttribute("name") || "", modified, rows };
  }

  return { readFirstSheet };
})();
