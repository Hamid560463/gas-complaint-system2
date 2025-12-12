
import { User, Role } from './types';

// --- تنظیمات دیتابیس (پایگاه داده) ---
// توجه: اتصال مستقیم برنامه React به دیتابیس‌های PostgreSQL/MySQL لیارا (بدون واسط Backend) امن نیست.
// بهترین گزینه برای برنامه‌های بدون سرور (مانند این برنامه)، استفاده از سرویس‌های "Backend-as-a-Service" است.
//
// دستورالعمل راه‌اندازی:
// 1. به سایت https://supabase.com بروید و یک پروژه رایگان بسازید.
// 2. از بخش Settings > API مقادیر URL و ANON KEY را کپی کنید.
// 3. آن‌ها را در متغیرهای زیر جایگذاری کنید.
//
// اگر این مقادیر خالی بمانند، برنامه به طور خودکار روی "حافظه مرورگر" (LocalStorage) کار می‌کند
// و اطلاعات فقط در کامپیوتر فعلی ذخیره می‌شوند.

export const SUPABASE_URL: string = 'https://alpdhziidlvjglwnamox.supabase.co'; 
export const SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscGRoemlpZGx2amdsd25hbW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1Mzc0MjAsImV4cCI6MjA4MTExMzQyMH0.wp-t3g2_E9Q20pyPDNeYboYMVZ8nElqK6XnzP7dqXNw';

export const INITIAL_USERS: User[] = [
    { id: 'admin', fullName: 'مدیر سیستم', password: 'admin', role: Role.Admin },
    { id: '1234567890', fullName: 'علی محمدی (شاکی)', password: '123', role: Role.Complainant },
    { id: 'eng1', fullName: 'مهندس رضایی (ناظر)', password: '123', role: Role.Supervisor },
    { id: 'exec1', fullName: 'شرکت گاز سوزان (مجری)', password: '123', role: Role.Executor },
];
