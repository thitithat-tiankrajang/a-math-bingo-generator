# Debug Guide - ตรวจสอบข้อมูล User

## 🔍 Console Logs ที่เพิ่มเข้ามา

### 1. **AuthService (auth.ts)**
```javascript
// Login
🔍 AuthService - Login credentials: {username: "admin", password: "***"}
🔍 AuthService - Login API URL: http://localhost:3001/auth/login
🔍 AuthService - Login response status: 200
🔍 AuthService - Login response data: {token: "...", user: {...}}

// Get Profile
🔍 AuthService - Getting profile...
🔍 AuthService - API URL: http://localhost:3001/auth/profile
🔍 AuthService - Auth headers: {Authorization: "Bearer ..."}
🔍 AuthService - Profile response status: 200
🔍 AuthService - Profile response data: {user: {...}}
```

### 2. **AuthContext (AuthContext.tsx)**
```javascript
// Login
🔍 AuthContext - Login credentials: {username: "admin", password: "***"}
🔍 AuthContext - Login response: {token: "...", user: {...}}
🔍 AuthContext - User profile data: {user: {...}}

// Check Auth Status
🔍 AuthContext - Stored token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
🔍 AuthContext - User data from stored token: {user: {...}}
```

### 3. **UserProfile (UserProfile.tsx)**
```javascript
// User Data
🔍 UserProfile - User data: {_id: "...", username: "admin", role: "admin", status: "approved"}
🔍 UserProfile - User role: "admin"
🔍 UserProfile - User status: "approved"
🔍 UserProfile - Is authenticated: true

// Fetch Pending Count
🔍 UserProfile - Fetching pending count...
🔍 UserProfile - Token from localStorage: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
🔍 UserProfile - API response status: 200
🔍 UserProfile - API response data: {students: [...], total: 5}
🔍 UserProfile - Set pending count to: 5
```

## 🎯 ข้อมูลที่ควรเห็น

### สำหรับ Admin Login:
```javascript
{
  _id: "...",
  username: "admin",
  role: "admin",
  status: "approved",
  firstName: "...",
  lastName: "...",
  // ... other fields
}
```

### สำหรับ Student Login:
```javascript
{
  _id: "...",
  username: "student1",
  role: "student",
  status: "pending", // or "approved" or "rejected"
  firstName: "...",
  lastName: "...",
  school: "...",
  purpose: "...",
  // ... other fields
}
```

## 🔧 การตรวจสอบ

### 1. **เปิด Developer Tools**
- กด F12 หรือ Ctrl+Shift+I
- ไปที่แท็บ Console

### 2. **Login เป็น Admin**
- ดู console logs ที่ขึ้นต้นด้วย 🔍
- ตรวจสอบว่า user.role === "admin"

### 3. **ตรวจสอบ Token**
- ดูว่า token ถูกเก็บใน localStorage หรือไม่
- ตรวจสอบว่า token ถูกส่งไปยัง API หรือไม่

### 4. **ตรวจสอบ API Response**
- ดู response status (ควรเป็น 200)
- ดู response data ที่ได้จาก API

## 🚨 ปัญหาที่อาจพบ

### 1. **ไม่เห็น console logs**
- ตรวจสอบว่าเปิด Developer Tools แล้ว
- ตรวจสอบว่าเลือกแท็บ Console

### 2. **user เป็น null**
- ตรวจสอบว่า login สำเร็จหรือไม่
- ตรวจสอบ token ใน localStorage

### 3. **API Error**
- ตรวจสอบว่า API รันที่ port 3001
- ตรวจสอบ CORS configuration

### 4. **Token ไม่ถูกส่ง**
- ตรวจสอบ localStorage.getItem('token')
- ตรวจสอบ Authorization header

## 📋 ขั้นตอนการ Debug

### 1. **Login และดู Console**
```bash
# 1. เปิด Developer Tools
# 2. Login เป็น Admin
# 3. ดู console logs
```

### 2. **ตรวจสอบ User Data**
```javascript
// ใน Console พิมพ์:
console.log('User from AuthContext:', useAuth().user);
console.log('Token from localStorage:', localStorage.getItem('token'));
```

### 3. **ทดสอบ API โดยตรง**
```javascript
// ใน Console พิมพ์:
fetch('http://localhost:3001/auth/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
}).then(r => r.json()).then(console.log);
```

## 🎯 สิ่งที่ต้องตรวจสอบ

### ✅ **Admin Login สำเร็จ**
- [ ] user.role === "admin"
- [ ] user.status === "approved"
- [ ] token ถูกเก็บใน localStorage
- [ ] API response status 200

### ✅ **ปุ่มกล่องจดหมายแสดง**
- [ ] user.role === "admin" ใน UserProfile
- [ ] pendingCount > 0 (ถ้ามีนักเรียนรอการอนุมัติ)
- [ ] ปุ่ม "กล่องจดหมาย" แสดงใน header

### ✅ **API ทำงานถูกต้อง**
- [ ] GET /auth/profile ส่งคืนข้อมูล user
- [ ] GET /auth/admin/students/pending ส่งคืนข้อมูลนักเรียน
- [ ] Authorization header ถูกส่งไป

---

**ใช้ console logs เหล่านี้เพื่อตรวจสอบข้อมูล user และ debug ปัญหาที่เกิดขึ้น!** 🔍✨ 