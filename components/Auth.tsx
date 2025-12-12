import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Input } from './common/Input';
import { Button } from './common/Button';
import { BuildingOfficeIcon, UserIcon, LockClosedIcon } from './Icons';

const LoginForm: React.FC = () => {
    const [nationalId, setNationalId] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAppContext();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login(nationalId, password);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
                label="نام کاربری (کد ملی)" 
                id="login-nationalId" 
                type="text" 
                value={nationalId} 
                onChange={e => setNationalId(e.target.value)} 
                required 
                icon={<UserIcon className="h-5 w-5 text-gray-400" />}
            />
            <Input 
                label="رمز عبور" 
                id="login-password" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
            />
            <Button type="submit" className="w-full !py-3">ورود</Button>
        </form>
    );
};

const RegisterForm: React.FC = () => {
    const [fullName, setFullName] = useState('');
    const [nationalId, setNationalId] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { register, addNotification } = useAppContext();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            addNotification('رمزهای عبور مطابقت ندارند.', 'error');
            return;
        }
        register(fullName, nationalId, password);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
                label="نام و نام خانوادگی" 
                id="reg-fullName" 
                type="text" 
                value={fullName} 
                onChange={e => setFullName(e.target.value)} 
                required 
                icon={<UserIcon className="h-5 w-5 text-gray-400" />}
            />
            <Input 
                label="کد ملی (نام کاربری)" 
                id="reg-nationalId" 
                type="text" 
                value={nationalId} 
                onChange={e => setNationalId(e.target.value)} 
                required 
                icon={<UserIcon className="h-5 w-5 text-gray-400" />}
            />
            <Input 
                label="رمز عبور" 
                id="reg-password" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
            />
            <Input 
                label="تکرار رمز عبور" 
                id="reg-confirmPassword" 
                type="password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
                icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
            />
            <Button type="submit" className="w-full !py-3">ثبت نام</Button>
        </form>
    );
};


const InfoPane: React.FC = () => (
    <div className="max-w-lg text-center">
        <div className="bg-white/20 p-4 rounded-full inline-block">
            <BuildingOfficeIcon className="h-16 w-16" />
        </div>
        <h1 className="text-4xl font-bold mt-6">سامانه هوشمند شکایات</h1>
        <p className="mt-4 text-lg text-emerald-100">
            ثبت، پیگیری و رسیدگی به شکایات حوزه گازکشی نظام مهندسی با شفافیت و سرعت.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-12 text-right">
            <div className="bg-white/10 p-6 rounded-lg">
                <h3 className="font-semibold text-lg">ثبت آسان شکایت</h3>
                <p className="text-sm text-emerald-200 mt-1">فرآیند ثبت شکواییه در چند مرحله ساده.</p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg">
                <h3 className="font-semibold text-lg">پیگیری آنلاین</h3>
                <p className="text-sm text-emerald-200 mt-1">مشاهده وضعیت پرونده با کد رهگیری.</p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg">
                <h3 className="font-semibold text-lg">پاسخگویی سریع</h3>
                <p className="text-sm text-emerald-200 mt-1">ارجاع و رسیدگی به شکایات در کمترین زمان.</p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg">
                <h3 className="font-semibold text-lg">شفافیت در فرآیند</h3>
                <p className="text-sm text-emerald-200 mt-1">دسترسی به تمام نظرات و رای نهایی.</p>
            </div>
        </div>
    </div>
);

const AuthFormPane: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    
    return (
        <div className="w-full max-w-sm">
            <div className="text-center mb-8">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-emerald-600" />
                <h2 className="text-2xl font-bold text-gray-800 mt-4">سامانه شکایات</h2>
                <p className="text-gray-500 mt-1">هئیت حل اختلاف نظام مهندسی</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
                 <div className="bg-gray-100 rounded-lg p-1 flex my-6">
                    <button
                        onClick={() => setActiveTab('login')}
                        className={`w-1/2 py-2 text-center rounded-md transition-all font-semibold text-sm ${activeTab === 'login' ? 'bg-white shadow text-emerald-600' : 'text-gray-500'}`}
                    >
                        ورود
                    </button>
                    <button
                        onClick={() => setActiveTab('register')}
                        className={`w-1/2 py-2 text-center rounded-md transition-all font-semibold text-sm ${activeTab === 'register' ? 'bg-white shadow text-emerald-600' : 'text-gray-500'}`}
                    >
                        ثبت نام
                    </button>
                </div>
                
                {activeTab === 'login' && <LoginForm />}
                {activeTab === 'register' && <RegisterForm />}
            </div>
        </div>
    );
};

const Auth: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            <div className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center p-6 md:p-12 bg-gray-100">
                <AuthFormPane />
            </div>
            <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-emerald-600 p-12 text-white items-center justify-center">
                <InfoPane />
            </div>
        </div>
    );
};

export default Auth;