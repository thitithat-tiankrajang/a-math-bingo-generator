# Frontend - Math Bingo Generator

## ฟีเจอร์ใหม่ที่เพิ่มเข้ามา

### 🔐 ระบบ Authentication และ Authorization

#### 1. **Student Registration**
- นักเรียนสามารถสมัครสมาชิกได้
- ต้องกรอกข้อมูลครบถ้วน: username, password, ชื่อ-นามสกุล, โรงเรียน, วัตถุประสงค์
- หลังสมัครแล้วจะอยู่ในสถานะ "รอการอนุมัติ"

#### 2. **Admin Dashboard**
- Admin สามารถดูรายการนักเรียนที่รอการอนุมัติ
- สามารถอนุมัติหรือปฏิเสธการสมัครได้
- ดูรายการนักเรียนทั้งหมดพร้อมสถานะ

#### 3. **Role-based Access Control**
- **Admin**: เข้าถึงทุกฟีเจอร์ รวมถึงพิมพ์ PDF
- **Student (Approved)**: เข้าถึงฟีเจอร์หลักและพิมพ์ PDF ได้
- **Student (Pending)**: เข้าถึงฟีเจอร์หลักได้ แต่ไม่สามารถพิมพ์ PDF

### 🎯 การใช้งาน

#### สำหรับนักเรียน:
1. **สมัครสมาชิก** - กดปุ่ม "สมัครสมาชิก" และกรอกข้อมูล
2. **เข้าสู่ระบบ** - ใช้ username และ password ที่สมัครไว้
3. **รอการอนุมัติ** - ระบบจะแสดงสถานะ "รอการอนุมัติ"
4. **ใช้งานระบบ** - หลังได้รับการอนุมัติแล้วจะสามารถพิมพ์ PDF ได้

#### สำหรับ Admin:
1. **เข้าสู่ระบบ** - ใช้ username ที่กำหนดใน ALLOWED_USERNAME
2. **จัดการนักเรียน** - กดปุ่ม "จัดการนักเรียน" ใน UserProfile
3. **อนุมัติ/ปฏิเสธ** - ดูรายการและดำเนินการตามความเหมาะสม

### 🔧 การตั้งค่า

#### 1. สร้างไฟล์ .env ใน E-math-api/
```env
PORT=3001
JWT_SECRET=your_super_secret_jwt_key_here
MONGODB_URI=mongodb://localhost:27017/emath
ALLOWED_USERNAME=admin
```

#### 2. รัน API
```bash
cd E-math-api
npm install
npm run dev
```

#### 3. รัน Frontend
```bash
cd fe/web
npm install
npm run dev
```

### 📋 Components ที่สร้างใหม่

#### 1. **AdminDashboard.tsx**
- แสดงรายการนักเรียนที่รอการอนุมัติ
- ฟังก์ชันอนุมัติ/ปฏิเสธ
- แสดงข้อมูลนักเรียนครบถ้วน

#### 2. **StudentRegistration.tsx**
- ฟอร์มสมัครสมาชิกสำหรับนักเรียน
- Validation ข้อมูลครบถ้วน
- ไม่มีฟอร์มสมัคร Admin (ตามความต้องการ)

#### 3. **ปรับปรุง AuthHeader.tsx**
- เพิ่มปุ่มสมัครสมาชิก
- รองรับการแสดง Admin Dashboard

#### 4. **ปรับปรุง UserProfile.tsx**
- แสดงสถานะและ role ของ user
- ปุ่มจัดการนักเรียนสำหรับ Admin
- แสดงข้อความสถานะสำหรับ Student

#### 5. **ปรับปรุง PrintTextAreaSection.tsx**
- จำกัดการพิมพ์ PDF เฉพาะ Admin และ Student ที่ได้รับการอนุมัติ
- แสดงข้อความแจ้งเตือนสำหรับผู้ที่ไม่มีสิทธิ์

### 🔒 Security Features

1. **Token-based Authentication**
   - JWT token สำหรับการยืนยันตัวตน
   - Token หมดอายุใน 24 ชั่วโมง

2. **Role-based Authorization**
   - Admin: เข้าถึงทุกฟีเจอร์
   - Student (Approved): เข้าถึงฟีเจอร์หลัก + พิมพ์ PDF
   - Student (Pending): เข้าถึงฟีเจอร์หลักเท่านั้น

3. **Input Validation**
   - ตรวจสอบข้อมูลที่กรอกครบถ้วน
   - ป้องกัน SQL injection และ XSS

### 🎨 UI/UX Improvements

1. **Responsive Design**
   - รองรับทุกขนาดหน้าจอ
   - Mobile-friendly interface

2. **Status Indicators**
   - Badge แสดงสถานะ role และ approval
   - Color coding สำหรับสถานะต่างๆ

3. **User Feedback**
   - Loading states
   - Success/error messages
   - Confirmation dialogs

### 🚀 การ Deploy

#### Frontend (Vercel)
```bash
cd fe/web
npm run build
vercel --prod
```

#### API (Vercel)
```bash
cd E-math-api
npm run build
vercel --prod
```

### 📝 หมายเหตุ

1. **Admin Registration**: ไม่มีฟอร์มสมัคร Admin ใน frontend (ตามความต้องการ)
2. **PDF Access**: Student ที่ยังไม่ได้รับการอนุมัติจะไม่สามารถพิมพ์ PDF ได้
3. **Database**: ต้องมี MongoDB ที่รันอยู่หรือใช้ MongoDB Atlas
4. **Environment Variables**: ตรวจสอบให้แน่ใจว่าไฟล์ .env ถูกต้อง

### 🔧 การแก้ไขปัญหา

#### ปัญหาที่พบบ่อย:

1. **API Connection Error**
   - ตรวจสอบว่า API รันที่ port 3001
   - ตรวจสอบ CORS configuration

2. **MongoDB Connection**
   - ตรวจสอบ MONGODB_URI ในไฟล์ .env
   - ตรวจสอบการเชื่อมต่อ internet

3. **Admin Access**
   - ตรวจสอบ ALLOWED_USERNAME ในไฟล์ .env
   - ใช้ username ที่กำหนดในการ register admin

4. **Student Approval**
   - Admin ต้องอนุมัติ Student ก่อนจึงจะใช้งานได้
   - ตรวจสอบสถานะใน UserProfile

---

**ระบบพร้อมใช้งานแล้ว!** 🎉 