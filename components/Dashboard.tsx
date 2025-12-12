
import React, { useState, useMemo, ChangeEvent, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Role, Complaint, ComplaintStatus } from '../types';
import { ComplaintForm, ComplaintDetails, getStatusBadgeStyles } from './ComplaintViews';
import { EngineerManagement } from './EngineerManagement';
import { SmsSettings } from './SmsSettings';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { Input } from './common/Input';
import { HomeIcon, ClipboardDocumentListIcon, ArrowLeftOnRectangleIcon, PlusCircleIcon, UsersIcon, ClockIcon, CalendarDaysIcon, BuildingOfficeIcon, CheckCircleIcon, Cog6ToothIcon, CameraIcon, Bars3Icon, UserGroupIcon, ChatBubbleBottomCenterTextIcon } from './Icons';

type ViewType = 'list' | 'form' | 'details' | 'profile' | 'engineers' | 'sms_settings';

// ProfileSettings Component
const ProfileSettings: React.FC = () => {
    const { user, updateUserProfile, addNotification } = useAppContext();
    
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (password && password !== confirmPassword) {
            addNotification('رمزهای عبور جدید مطابقت ندارند.', 'error');
            return;
        }

        setIsLoading(true);
        await updateUserProfile({
            fullName,
            password: password || undefined,
            avatar: avatarPreview,
        });

        setIsLoading(false);
        addNotification('پروفایل با موفقیت به‌روزرسانی شد.', 'success');
    };
    
    return (
        <Card>
            <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-800">پروفایل</h2>
            </div>
            <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
                     <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                            <img 
                                src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'U')}&background=0D9488&color=fff&size=96`}
                                alt="Avatar" 
                                className="h-24 w-24 rounded-full object-cover bg-gray-200 ring-4 ring-white"
                            />
                             <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 cursor-pointer bg-emerald-600 p-2 rounded-full text-white hover:bg-emerald-700 transition-colors">
                                <CameraIcon className="h-5 w-5" />
                                <input id="avatar-upload" type="file" className="sr-only" accept="image/*" onChange={handleAvatarChange} />
                            </label>
                        </div>
                        <div>
                             <h3 className="text-xl font-bold text-gray-800">{user?.fullName}</h3>
                             <p className="text-sm text-gray-500">{user?.role}</p>
                        </div>
                    </div>
                    
                    <Input 
                        label="نام و نام خانوادگی"
                        id="profile-fullName"
                        value={fullName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                        required
                    />
                    <Input 
                        label="رمز عبور جدید (اختیاری)"
                        id="profile-password"
                        type="password"
                        value={password}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        placeholder="برای تغییر، رمز جدید را وارد کنید"
                    />
                    <Input 
                        label="تکرار رمز عبور جدید"
                        id="profile-confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                        disabled={!password}
                    />

                    <div className="text-left pt-4">
                        <Button type="submit" isLoading={isLoading}>ذخیره تغییرات</Button>
                    </div>
                </form>
            </div>
        </Card>
    );
};


// Sidebar Component
const Sidebar: React.FC<{ view: ViewType; setView: (view: ViewType) => void; isOpen: boolean; setIsOpen: (isOpen: boolean) => void; }> = ({ view, setView, isOpen, setIsOpen }) => {
    const { user, logout, isCloudConnected } = useAppContext();
    const getInitials = (name: string) => {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    const handleNavigation = (targetView: ViewType) => {
        setView(targetView);
        if (window.innerWidth < 768) { // md breakpoint
            setIsOpen(false);
        }
    };

    return (
        <>
            <aside className={`fixed md:relative inset-y-0 right-0 z-30 w-64 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0`}>
                <div className="h-16 flex items-center justify-center border-b border-gray-200 px-4">
                    <div className="flex items-center">
                        <BuildingOfficeIcon className="h-8 w-8 text-emerald-600" />
                        <h1 className="text-lg font-bold text-gray-800 mr-2">سامانه شکایات</h1>
                    </div>
                </div>
                <div className="flex-1 flex flex-col overflow-y-auto">
                    <div className="px-4 py-6">
                        <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">منوی اصلی</p>
                        <nav className="mt-2 space-y-1">
                            <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('list'); }} className={`flex items-center px-4 py-2 text-gray-700 rounded-lg font-semibold transition-colors ${['list', 'details'].includes(view) ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-gray-100'}`}>
                                <HomeIcon className={`h-5 w-5 ml-3 transition-colors ${['list', 'details'].includes(view) ? 'text-emerald-600' : 'text-gray-500'}`} />
                                داشبورد
                            </a>
                            {user?.role === Role.Complainant && (
                                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('form'); }} className={`flex items-center px-4 py-2 text-gray-700 rounded-lg font-semibold transition-colors ${view === 'form' ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-gray-100'}`}>
                                    <PlusCircleIcon className={`h-5 w-5 ml-3 transition-colors ${view === 'form' ? 'text-emerald-600' : 'text-gray-500'}`} />
                                    ثبت شکایت جدید
                                </a>
                            )}
                            {user?.role === Role.Admin && (
                                <>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('engineers'); }} className={`flex items-center px-4 py-2 text-gray-700 rounded-lg font-semibold transition-colors ${view === 'engineers' ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-gray-100'}`}>
                                        <UserGroupIcon className={`h-5 w-5 ml-3 transition-colors ${view === 'engineers' ? 'text-emerald-600' : 'text-gray-500'}`} />
                                        مدیریت مهندسین و مجریان
                                    </a>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('sms_settings'); }} className={`flex items-center px-4 py-2 text-gray-700 rounded-lg font-semibold transition-colors ${view === 'sms_settings' ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-gray-100'}`}>
                                        <ChatBubbleBottomCenterTextIcon className={`h-5 w-5 ml-3 transition-colors ${view === 'sms_settings' ? 'text-emerald-600' : 'text-gray-500'}`} />
                                        تنظیمات پیامک
                                    </a>
                                </>
                            )}
                            <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('profile'); }} className={`flex items-center px-4 py-2 text-gray-700 rounded-lg font-semibold transition-colors ${view === 'profile' ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-gray-100'}`}>
                                <Cog6ToothIcon className={`h-5 w-5 ml-3 transition-colors ${view === 'profile' ? 'text-emerald-600' : 'text-gray-500'}`} />
                                تنظیمات پروفایل
                            </a>
                        </nav>
                    </div>

                    {/* Status Indicator */}
                    <div className="px-6 py-4 mt-auto">
                        <div className={`rounded-lg p-3 flex items-center ${isCloudConnected ? 'bg-emerald-50 border border-emerald-100' : 'bg-gray-100 border border-gray-200'}`}>
                            <div className={`w-3 h-3 rounded-full mr-2 ${isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
                            <div>
                                <p className="text-xs font-semibold text-gray-600">وضعیت ذخیره‌سازی</p>
                                <p className={`text-xs font-bold ${isCloudConnected ? 'text-emerald-600' : 'text-gray-600'}`}>
                                    {isCloudConnected ? 'آنلاین (ابری)' : 'آفلاین (مرورگر)'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.fullName} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                                {getInitials(user?.fullName || '')}
                            </div>
                        )}
                        <div className="mr-3 overflow-hidden">
                            <p className="text-sm font-semibold text-gray-800 truncate">{user?.fullName}</p>
                            <p className="text-xs text-gray-500">{user?.id}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => logout()}
                        className="w-full mt-4 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                        <ArrowLeftOnRectangleIcon className="h-5 w-5 ml-2" />
                        خروج از حساب
                    </button>
                </div>
            </aside>
            {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/30 z-20 md:hidden"></div>}
        </>
    );
};

// Header Component
const Header: React.FC<{ view: ViewType; onMenuClick: () => void; }> = ({ view, onMenuClick }) => {
    const titles: Record<ViewType, string> = {
        list: 'داشبورد',
        details: 'جزئیات پرونده',
        form: 'ثبت شکواییه جدید',
        profile: 'تنظیمات پروفایل',
        engineers: 'مدیریت مهندسین و مجریان',
        sms_settings: 'تنظیمات درگاه پیامکی'
    };
    
    const title = titles[view];
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const today = new Date();
    const formattedDate = new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(today);

    const formattedTime = new Intl.DateTimeFormat('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(currentTime);

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center">
                 <button onClick={onMenuClick} className="md:hidden ml-4 text-gray-500 hover:text-gray-700">
                    <Bars3Icon className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            </div>
            <div className="hidden sm:flex items-center text-sm text-gray-500">
                <div className="flex items-center ml-4">
                    <CalendarDaysIcon className="w-5 h-5 ml-2" />
                    <span>{formattedDate}</span>
                </div>
                <div className="flex items-center">
                    <ClockIcon className="w-5 h-5 ml-2" />
                    <span>{formattedTime}</span>
                </div>
            </div>
        </header>
    );
};

// StatCard Component
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-center">
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            {icon}
        </div>
        <div className="mr-4">
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

// ComplaintList Component
const ComplaintListItem: React.FC<{ complaint: Complaint; onSelect: (id: string) => void; }> = ({ complaint, onSelect }) => (
    <tr onClick={() => onSelect(complaint.id)} className="hover:bg-gray-50 cursor-pointer">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{complaint.id}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.gasFileNumber}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.complainant.fullName}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(complaint.createdAt).toLocaleDateString('fa-IR')}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
             <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadgeStyles(complaint.status)}`}>{complaint.status}</span>
        </td>
    </tr>
);

const ComplaintList: React.FC<{ complaints: Complaint[]; onSelect: (id: string) => void; setView: (view: ViewType) => void; }> = ({ complaints, onSelect, setView }) => {
    const { user } = useAppContext();
    return (
        <Card>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-gray-200">
                 <h2 className="text-lg font-semibold text-gray-800 mb-4 md:mb-0">لیست پرونده‌ها</h2>
            </div>
            <div className="overflow-x-auto">
                 {complaints.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">کد رهگیری</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">شماره پرونده گاز</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">شاکی</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ ثبت</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {complaints.map(c => <ComplaintListItem key={c.id} complaint={c} onSelect={onSelect} />)}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center p-12">
                         <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">بدون شکواییه</h3>
                        <p className="mt-1 text-sm text-gray-500">هنوز هیچ شکواییه‌ای برای نمایش وجود ندارد.</p>
                         {user?.role === Role.Complainant && (
                            <div className="mt-6">
                               <Button onClick={() => setView('form')}>ثبت اولین شکواییه</Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}

// Main Dashboard Component
const Dashboard: React.FC = () => {
    const { user, complaints } = useAppContext();
    const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
    const [view, setView] = useState<ViewType>('list');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const userComplaints = useMemo(() => {
        if (!user) return [];
        switch (user.role) {
            case Role.Complainant:
                return complaints.filter(c => c.complainant.id === user.id);
            case Role.Admin:
                return complaints;
            case Role.Supervisor:
                return complaints.filter(c => c.supervisor.id === user.id && c.referredToSupervisor);
            case Role.Executor:
                return complaints.filter(c => c.executor.id === user.id && c.referredToExecutor);
            default:
                return [];
        }
    }, [user, complaints]);
    
    const stats = useMemo(() => {
        const total = userComplaints.length;
        const newCount = complaints.filter(c => c.status === ComplaintStatus.New).length; // Admin sees all new ones
        const inProgressCount = userComplaints.filter(c => 
            [ComplaintStatus.Referred, ComplaintStatus.Responded].includes(c.status)
        ).length;
        const closedCount = userComplaints.filter(c => c.status === ComplaintStatus.Closed).length;
        return { total, newCount, inProgressCount, closedCount };
    }, [userComplaints, complaints]);

    const handleSelectComplaint = (id: string) => {
        setSelectedComplaintId(id);
        setView('details');
    };
    
    const handleBackToList = () => {
        setSelectedComplaintId(null);
        setView('list');
    };

    const handleFormSuccess = (complaintId: string) => {
        setSelectedComplaintId(complaintId);
        setView('details');
    };
    
    const selectedComplaint = useMemo(() => {
        return complaints.find(c => c.id === selectedComplaintId);
    }, [selectedComplaintId, complaints]);

    const renderContent = () => {
        switch (view) {
            case 'profile':
                return <ProfileSettings />;
            case 'engineers':
                return <EngineerManagement onImportComplete={() => setView('list')} />;
            case 'sms_settings':
                return <SmsSettings />;
            case 'details':
                if (selectedComplaint) {
                    return (
                         <div>
                            <Button onClick={handleBackToList} variant="secondary" className="mb-6">بازگشت به لیست</Button>
                            <ComplaintDetails complaint={selectedComplaint} />
                        </div>
                    );
                }
                setView('list');
                return null;
            
            case 'form':
                if (user?.role === Role.Complainant) {
                    return (
                        <div>
                             <Button onClick={handleBackToList} variant="secondary" className="mb-6">انصراف و بازگشت</Button>
                             <ComplaintForm onSuccess={handleFormSuccess} />
                        </div>
                    );
                }
                 setView('list');
                return null;

            case 'list':
            default:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard title="کل پرونده‌ها" value={stats.total} icon={<ClipboardDocumentListIcon className="w-6 h-6" />} />
                            {user?.role === Role.Admin && <StatCard title="پرونده‌های جدید" value={stats.newCount} icon={<PlusCircleIcon className="w-6 h-6" />} />}
                            <StatCard title="در حال رسیدگی" value={stats.inProgressCount} icon={<UsersIcon className="w-6 h-6" />} />
                            <StatCard title="مختومه شده" value={stats.closedCount} icon={<CheckCircleIcon className="w-6 h-6" />} />
                        </div>
                        <ComplaintList complaints={userComplaints} onSelect={handleSelectComplaint} setView={setView} />
                    </div>
                );
        }
    };

    return (
       <div className="flex h-screen bg-gray-50 text-gray-800">
            <Sidebar view={view} setView={setView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header view={view} onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
