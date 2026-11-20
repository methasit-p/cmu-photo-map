/**
 * CMU Photo Map — Google Apps Script backend
 * เก็บภาพลงโฟลเดอร์ Google Drive แยกตามสถานที่ ให้หน้าเว็บบน GitHub Pages เรียกใช้
 *
 * Deploy: Deploy → New deployment → Web app
 *   Execute as: Me   |   Who has access: Anyone
 */

// โฟลเดอร์หลัก "CMU Photo Map - แผนที่ภาพ มช." ใน Google Drive
const ROOT_FOLDER_ID = '1dWGiu-qCPwvP31xjV7FGg90wv7fyjiBI';

// รหัสสำหรับอัปโหลด — เปลี่ยนเป็นรหัสของคุณเองก่อน deploy
const UPLOAD_KEY = 'CHANGE-ME';

// true = แชร์ภาพแบบ "ทุกคนที่มีลิงก์ดูได้" เพื่อให้หน้าเว็บแสดงภาพตัวอย่างได้
const MAKE_PUBLIC = true;

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'list';
    if (action === 'list') return out_(list_());
    return out_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents);
    if (!UPLOAD_KEY || UPLOAD_KEY === 'CHANGE-ME' || b.uploadKey !== UPLOAD_KEY) {
      return out_({ ok: false, error: 'bad_key' });
    }
    if (b.action === 'upload') return out_(upload_(b));
    if (b.action === 'addPlace') {
      return out_({ ok: true, folder: folderInfo_(getFolder_(b.key, b.name)) });
    }
    return out_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

function root_() {
  return DriveApp.getFolderById(ROOT_FOLDER_ID);
}

// ชื่อโฟลเดอร์รูปแบบ "[key] ชื่อสถานที่"
function keyOf_(title) {
  const m = /^\[([^\]]+)\]/.exec(title || '');
  return m ? m[1] : null;
}

function folderInfo_(f) {
  return { id: f.getId(), url: f.getUrl() };
}

function getFolder_(key, name) {
  if (!/^[\w:.-]{1,60}$/.test(String(key || ''))) throw new Error('bad_place_key');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const it = root_().getFolders();
    while (it.hasNext()) {
      const f = it.next();
      if (keyOf_(f.getName()) === key) return f;
    }
    const label = String(name || key).replace(/[\[\]]/g, '').slice(0, 80);
    return root_().createFolder('[' + key + '] ' + label);
  } finally {
    lock.releaseLock();
  }
}

function list_() {
  const folders = [];
  const photos = [];
  const it = root_().getFolders();
  while (it.hasNext()) {
    const f = it.next();
    const key = keyOf_(f.getName());
    if (!key) continue;
    folders.push({
      key: key,
      name: f.getName().replace(/^\[[^\]]+\]\s*/, ''),
      id: f.getId(),
      url: f.getUrl()
    });
    const files = f.getFiles();
    while (files.hasNext()) {
      const x = files.next();
      if (!/^image\//.test(x.getMimeType())) continue;
      photos.push({
        id: x.getId(),
        name: x.getName(),
        key: key,
        created: x.getDateCreated().toISOString(),
        url: x.getUrl()
      });
    }
  }
  return { ok: true, rootUrl: root_().getUrl(), folders: folders, photos: photos };
}

function upload_(b) {
  if (!b.data) throw new Error('no_data');
  const mime = /^image\/[\w.+-]+$/.test(b.mime || '') ? b.mime : 'image/jpeg';
  const folder = getFolder_(b.key, b.placeName);
  const name = String(b.name || ('photo_' + Date.now() + '.jpg')).slice(0, 120);
  const blob = Utilities.newBlob(Utilities.base64Decode(b.data), mime, name);
  const file = folder.createFile(blob);
  if (MAKE_PUBLIC) file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return {
    ok: true,
    folder: folderInfo_(folder),
    file: {
      id: file.getId(),
      name: file.getName(),
      key: b.key,
      created: file.getDateCreated().toISOString(),
      url: file.getUrl()
    }
  };
}

/**
 * รันครั้งเดียวจากหน้า editor (เลือกฟังก์ชันนี้แล้วกด Run)
 * เพื่อแชร์ภาพที่อัปโหลดไว้ก่อนหน้า (เช่น จากเวอร์ชัน claude.ai) ให้หน้าเว็บแสดงตัวอย่างได้
 */
function shareExistingPhotos() {
  const it = root_().getFolders();
  let n = 0;
  while (it.hasNext()) {
    const files = it.next().getFiles();
    while (files.hasNext()) {
      const x = files.next();
      if (/^image\//.test(x.getMimeType())) {
        x.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        n++;
      }
    }
  }
  Logger.log('แชร์แล้ว ' + n + ' ภาพ');
}
