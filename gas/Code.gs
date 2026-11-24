/**
 * TokoGT - Backend Google Apps Script
 * Penyimpanan: Google Sheet (sheet "docs"). Satu baris = satu catatan data.
 * Script ini dipasang di dalam Google Sheet.
 *
 * LANGKAH PASANG
 * 1. Buat Google Sheet baru > Extensions (Ekstensi) > Apps Script.
 * 2. Tempel seluruh isi file ini ke Code.gs.
 * 3. Ganti nilai KUNCI_API di bawah dengan kunci rahasia Anda, lalu jalankan fungsi setup() sekali (beri izin akses).
 * 4. Tambah file HTML bernama "index" (tombol + > HTML) lalu tempel isi file index.html dari folder gas.
 *    Dengan begitu aplikasi dibuka langsung dari URL /exec tanpa mengisi URL dan kunci di perangkat mana pun.
 * 5. Jalankan fungsi pasangBackupHarian() sekali (beri izin Google Drive) untuk cadangan otomatis tiap hari pukul 02.00.
 * 6. (Jika perlu memulihkan data) lihat fungsi daftarCadangan() dan pulihkanDariCadangan() di bagian bawah.
 * 7. Deploy > New deployment > Web app: Execute as = Me, Who has access = Anyone. Salin URL berakhiran /exec.
 *    Setelah mengubah kode: Deploy > Manage deployments > pensil > Version: New version.
 */
const KUNCI_API = 'GANTI-DENGAN-KUNCI-RAHASIA';
const SHEET = 'docs', CHUNK = 45000;
const PULIHKAN_DARI = ''; // nama file cadangan untuk dipulihkan, mis. 'TokoGT-Backup-2026-11-24_0200'. Kosong = cadangan terbaru.
const JUMLAH_CADANGAN = 14; // salinan cadangan terakhir yang disimpan di Google Drive

function setup() {
  PropertiesService.getScriptProperties().setProperty('API_KEY', KUNCI_API);
  sh_();
}
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function sh_() {
  const ss = SpreadsheetApp.getActive();
  let s = ss.getSheetByName(SHEET);
  if (!s) { s = ss.insertSheet(SHEET); s.appendRow(['path', 'updated', 'data (potongan JSON)']); s.setFrozenRows(1); }
  return s;
}
function ver_() {
  const c = CacheService.getScriptCache();
  let v = c.get('v');
  if (!v) { v = String(Date.now()); c.put('v', v, 21600); }
  return v;
}
function bump_() {
  CacheService.getScriptCache().put('v', Date.now() + '-' + Math.random().toString(36).slice(2, 6), 21600);
}
function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'ping') return json_({ ok: true, time: new Date().toISOString() });
  try {
    // Frontend dilayani langsung dari Apps Script: URL dan kunci disisipkan otomatis,
    // sehingga browser/perangkat mana pun tidak perlu mengisi koneksi lagi.
    const t = HtmlService.createTemplateFromFile('index');
    t.cfg = JSON.stringify({
      url: ScriptApp.getService().getUrl(),
      key: PropertiesService.getScriptProperties().getProperty('API_KEY') || ''
    });
    return t.evaluate().setTitle('TokoGT')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return ContentService.createTextOutput('TokoGT backend aktif. File HTML "index" belum ditambahkan: ' + err);
  }
}
function doPost(e) {
  try {
    const r = JSON.parse(e.postData.contents);
    const key = PropertiesService.getScriptProperties().getProperty('API_KEY');
    if (!key || r.key !== key) return json_({ ok: false, error: 'unauthorized' });
    if (r.action === 'ver') return json_({ ok: true, v: ver_() }); // cepat, tanpa membuka Sheet
    const lock = LockService.getScriptLock();
    lock.waitLock(25000);
    try { return json_(route_(r)); } finally { lock.releaseLock(); }
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}
function row_(path, data) {
  const str = JSON.stringify(data), row = [path, Date.now()];
  for (let i = 0; i < str.length; i += CHUNK) row.push('J' + str.substr(i, CHUNK));
  return row;
}
function route_(r) {
  const s = sh_(), last = s.getLastRow();
  if (r.action === 'backupInfo') return { ok: true, email: email_(), folder: 'TokoGT-Backup', name: namaCadangan_(), last: PropertiesService.getScriptProperties().getProperty('LAST_BACKUP') || '' };
  if (r.action === 'backup') { const b = backup_(r.name); return { ok: true, name: b.name, url: b.url, folderUrl: b.folderUrl, email: email_() }; }
  if (r.action === 'state') {
    const v = last > 1 ? s.getRange(2, 1, last - 1, 2).getValues() : [];
    return { ok: true, docs: v.map(function (x) { return { p: x[0], u: String(x[1]) }; }) };
  }
  if (r.action === 'all') {
    const docs = [];
    if (last > 1) {
      s.getRange(2, 1, last - 1, s.getMaxColumns()).getValues().forEach(function (row) {
        docs.push({ p: row[0], u: String(row[1]), d: row.slice(2).filter(function (c) { return c !== ''; })
          .map(function (c) { return String(c).substr(1); }).join('') });
      });
    }
    return { ok: true, v: ver_(), docs: docs };
  }
  if (r.action === 'getMany') {
    const want = {}, out = {};
    r.paths.forEach(function (p) { want[p] = 1; });
    if (last > 1) {
      s.getRange(2, 1, last - 1, s.getMaxColumns()).getValues().forEach(function (row) {
        if (want[row[0]]) out[row[0]] = row.slice(2).filter(function (c) { return c !== ''; })
          .map(function (c) { return String(c).substr(1); }).join('');
      });
    }
    return { ok: true, data: out };
  }
  if (r.action === 'batch') {
    const paths = last > 1 ? s.getRange(2, 1, last - 1, 1).getValues().map(function (x) { return x[0]; }) : [];
    const idx = {};
    paths.forEach(function (p, i) { idx[p] = i + 2; });
    const upd = [], add = [], del = [], addAt = {};
    let W = 3;
    r.ops.forEach(function (o) {
      if (o.op === 'del') { if (idx[o.path]) { del.push(idx[o.path]); delete idx[o.path]; } return; }
      const row = row_(o.path, o.data);
      W = Math.max(W, row.length);
      if (idx[o.path]) upd.push({ r: idx[o.path], row: row });
      else if (addAt[o.path] !== undefined) add[addAt[o.path]] = row;
      else { addAt[o.path] = add.length; add.push(row); }
    });
    if (W > s.getMaxColumns()) s.insertColumnsAfter(s.getMaxColumns(), W - s.getMaxColumns());
    const C = s.getMaxColumns();
    const pad = function (row) { const b = new Array(C).fill(''); for (let k = 0; k < row.length; k++) b[k] = row[k]; return b; };
    upd.forEach(function (u) { s.getRange(u.r, 1, 1, C).setValues([pad(u.row)]); });
    if (add.length) s.getRange(s.getLastRow() + 1, 1, add.length, C).setValues(add.map(pad));
    del.sort(function (a, b) { return b - a; }).forEach(function (n) { s.deleteRow(n); });
    SpreadsheetApp.flush();
    bump_();
    return { ok: true };
  }
  return { ok: false, error: 'unknown_action' };
}

/** Cadangan: menyalin Google Sheet ke folder Drive "TokoGT-Backup", menyimpan JUMLAH_CADANGAN salinan terakhir. */
function namaCadangan_() {
  return 'TokoGT-Backup-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmm');
}
function email_() {
  try { return Session.getEffectiveUser().getEmail() || ''; } catch (e) { return ''; }
}
function backup_(nama) {
  const ss = SpreadsheetApp.getActive();
  const it = DriveApp.getFoldersByName('TokoGT-Backup');
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder('TokoGT-Backup');
  const name = (nama && /^TokoGT-Backup-[0-9_\-]+$/.test(nama)) ? nama : namaCadangan_();
  const copy = DriveApp.getFileById(ss.getId()).makeCopy(name, folder);
  const files = [], fi = folder.getFiles();
  while (fi.hasNext()) files.push(fi.next());
  files.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  files.slice(JUMLAH_CADANGAN).forEach(function (f) { f.setTrashed(true); });
  PropertiesService.getScriptProperties().setProperty('LAST_BACKUP', name);
  return { name: name, url: copy.getUrl(), folderUrl: folder.getUrl() };
}
function backupHarian() { return backup_().name; }
/** Jalankan SEKALI dari editor untuk memasang jadwal cadangan harian. */
function pasangBackupHarian() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'backupHarian') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('backupHarian').timeBased().everyDays(1).atHour(2).create();
  return backupHarian();
}

/** Melihat daftar cadangan. Jalankan lalu buka Log eksekusi (Execution log). */
function daftarCadangan() {
  const it = DriveApp.getFoldersByName('TokoGT-Backup');
  if (!it.hasNext()) { Logger.log('Folder TokoGT-Backup belum ada.'); return; }
  const files = [], fi = it.next().getFiles();
  while (fi.hasNext()) files.push(fi.next());
  files.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  files.forEach(function (f) { Logger.log(f.getName() + '  (dibuat ' + f.getDateCreated() + ')'); });
}
/** Memulihkan data dari cadangan Google Drive ke Sheet ini. Isi PULIHKAN_DARI lebih dulu (atau kosongkan untuk terbaru). */
function pulihkanDariCadangan() {
  const it = DriveApp.getFoldersByName('TokoGT-Backup');
  if (!it.hasNext()) throw new Error('Folder TokoGT-Backup tidak ditemukan di Google Drive.');
  const folder = it.next();
  let file = null;
  if (PULIHKAN_DARI) {
    const f = folder.getFilesByName(PULIHKAN_DARI);
    if (f.hasNext()) file = f.next();
  } else {
    const fi = folder.getFiles();
    while (fi.hasNext()) { const f = fi.next(); if (!file || f.getDateCreated() > file.getDateCreated()) file = f; }
  }
  if (!file) throw new Error('File cadangan tidak ditemukan. Jalankan daftarCadangan() untuk melihat nama yang benar.');
  const src = SpreadsheetApp.open(file).getSheetByName(SHEET);
  if (!src || src.getLastRow() < 1) throw new Error('Sheet "docs" tidak ada atau kosong di cadangan itu.');
  const vals = src.getDataRange().getValues();
  if (String(vals[0][0]) !== 'path') throw new Error('Format cadangan tidak dikenali.');
  backupHarian(); // cadangan pengaman dari kondisi saat ini sebelum ditimpa
  const s = sh_(), cols = vals[0].length;
  if (cols > s.getMaxColumns()) s.insertColumnsAfter(s.getMaxColumns(), cols - s.getMaxColumns());
  s.clearContents();
  s.getRange(1, 1, vals.length, cols).setValues(vals);
  SpreadsheetApp.flush();
  bump_();
  return 'Dipulihkan dari ' + file.getName() + ' (' + (vals.length - 1) + ' dokumen)';
}
/** Memaksa semua perangkat memuat ulang data (dipakai jika Sheet diedit manual). */
function bumpVersi() { bump_(); }
