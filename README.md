# TaskNote – จดบันทึกงาน (PWA)

แอพจดงาน + ปฏิทิน ไม่ต้องมี backend / build step — ไฟล์ทั้งหมดเป็น static

## Deploy (ต้องเป็น HTTPS เพื่อให้ติดตั้งและใช้ออฟไลน์ได้)
- **Netlify Drop**: เข้า app.netlify.com/drop แล้วลากทั้งโฟลเดอร์นี้ไปวาง
- **GitHub Pages**: push โฟลเดอร์ขึ้น repo → Settings → Pages → Deploy from branch
- **Cloudflare Pages / Vercel**: เลือก static, ไม่มี build command, output = root

## ติดตั้งลงมือถือ
- **iPhone (Safari)**: ปุ่มแชร์ → “เพิ่มไปยังหน้าจอโฮม”
- **Android (Chrome)**: เมนู ⋮ → “ติดตั้งแอพ” (หรือกดปุ่มติดตั้งในหน้าตั้งค่า)

## ทดสอบในเครื่อง
`python -m http.server 8080` แล้วเปิด http://localhost:8080 (service worker ใช้ได้บน localhost)

## หมายเหตุ
- ข้อมูลเก็บใน localStorage ของเครื่อง — ใช้ “ส่งออก” ในหน้าตั้งค่าเพื่อสำรอง/ย้ายเครื่อง
- แก้ไฟล์แล้วให้เปลี่ยนเลขเวอร์ชัน `CACHE` ใน `sw.js` เพื่อให้เครื่องผู้ใช้อัปเดต
