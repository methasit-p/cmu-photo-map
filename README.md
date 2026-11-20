# แผนที่เก็บภาพ มหาวิทยาลัยเชียงใหม่ (CMU Photo Map)

แผนที่ interactive ของ มช. ใช้เก็บภาพของแต่ละคณะและแลนด์มาร์ค ภาพที่อัปโหลดจะไปอยู่ใน Google Drive โดยแยกโฟลเดอร์ตามสถานที่ หน้าเว็บอยู่บน GitHub Pages และใช้ Google Apps Script เป็นตัวกลางบันทึกภาพลง Drive

- `index.html` — หน้าแผนที่ทั้งหมดอยู่ในไฟล์เดียว
- `apps-script/Code.gs` — โค้ดฝั่ง Google Apps Script

## การตั้งค่า (ทำครั้งเดียว)

### 1. สร้าง Apps Script
1. เปิด <https://script.google.com> แล้วกด **New project** ด้วยบัญชี Google เจ้าของโฟลเดอร์ "CMU Photo Map - แผนที่ภาพ มช."
2. ลบโค้ดเดิมทั้งหมด แล้ววางเนื้อหาจาก `apps-script/Code.gs`
3. แก้ `UPLOAD_KEY = 'CHANGE-ME'` เป็นรหัสของคุณเอง (ใช้ตอนอัปโหลดจากหน้าเว็บ)
4. ถ้าใช้โฟลเดอร์อื่น ให้แก้ `ROOT_FOLDER_ID` เป็น ID ของโฟลเดอร์นั้น (ส่วนท้ายของ URL โฟลเดอร์)

### 2. Deploy เป็น Web app
1. กด **Deploy → New deployment** แล้วเลือกชนิด **Web app**
2. **Execute as:** Me
3. **Who has access:** Anyone
4. กด **Deploy** อนุญาตสิทธิ์ Google Drive แล้วคัดลอก **Web app URL** (ลงท้ายด้วย `/exec`)

> แก้โค้ด Apps Script ภายหลังแล้ว ต้องกด **Deploy → Manage deployments → แก้ไข → Version: New version** ทุกครั้ง ไม่อย่างนั้นเว็บจะยังใช้โค้ดเก่าอยู่

### 3. ใส่ URL ลงในหน้าเว็บ
เปิด `index.html` ค้นหา `CONFIG` แล้ววาง URL:

```js
const CONFIG={API_URL:"https://script.google.com/macros/s/xxxxxxxx/exec"};
```

### 4. เปิด GitHub Pages
ไปที่ repo → **Settings → Pages → Build and deployment** → Source: **Deploy from a branch** → Branch: `main` / `(root)` → **Save**
รอ 1–2 นาที เว็บจะอยู่ที่ `https://<username>.github.io/<repo>/`

### 5. (ไม่บังคับ) แชร์ภาพเก่า
ถ้ามีภาพที่อัปโหลดไว้ก่อนแล้ว (เช่น จากเวอร์ชันบน claude.ai) ให้เลือกฟังก์ชัน `shareExistingPhotos` ใน editor ของ Apps Script แล้วกด **Run** หนึ่งครั้ง หน้าเว็บจึงจะแสดงภาพตัวอย่างได้

## การใช้งาน
- แตะหมุดเพื่อดูภาพและอัปโหลด อัปโหลดครั้งแรกจะถามรหัสอัปโหลด
- หมุดทึบพร้อมตัวเลข = สถานที่ที่มีภาพแล้ว
- ปุ่ม **+ เพิ่มจุดใหม่** แตะบนแผนที่เพื่อสร้างจุดถ่ายภาพของคุณเอง (สร้างเป็นโฟลเดอร์ใน Drive)
- ตำแหน่งหมุดเป็นค่าประมาณบนแผนที่วาดเชิงสัญลักษณ์ แก้พิกัดได้ในอาร์เรย์ `BASE` ของ `index.html`

## ข้อควรรู้เรื่องความเป็นส่วนตัว
- หน้าเว็บบน GitHub Pages เป็นสาธารณะ ใครมีลิงก์ก็ดูรายการและภาพได้ เพราะภาพถูกแชร์แบบ "ทุกคนที่มีลิงก์" (`MAKE_PUBLIC = true`)
- การอัปโหลดและการเพิ่มจุดใหม่ต้องใช้รหัส `UPLOAD_KEY` อย่าใส่รหัสนี้ไว้ในโค้ดที่ push ขึ้น GitHub
