
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, Complaint, NotificationState, NotificationType, Role, ComplaintStatus, Comment, SmsSettings, ReferralLog, SmsTemplates, Attachment } from '../types';
import { INITIAL_USERS } from '../constants';
import { validateNationalId, validatePhoneNumber } from '../utils/validation';
import { sendKavehNegarSms } from '../utils/smsService';
import * as db from '../utils/db';


interface UpdateProfileData {
    fullName?: string;
    password?: string;
    avatar?: string | null;
}

interface UpdateEngineerData {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    role?: Role;
}

interface AppContextType {
    user: User | null;
    users: User[];
    complaints: Complaint[];
    supervisors: User[];
    executors: User[];
    notifications: NotificationState[];
    smsSettings: SmsSettings;
    isLoading: boolean;
    isCloudConnected: boolean; // New Status Field
    login: (nationalId: string, password: string) => boolean;
    register: (fullName: string, nationalId: string, password: string) => Promise<boolean>;
    logout: () => void;
    addComplaint: (complaint: Omit<Complaint, 'id' | 'complainant' | 'status' | 'comments' | 'referralHistory' | 'createdAt' | 'referredToSupervisor' | 'referredToExecutor'>) => Promise<Complaint>;
    getComplaintById: (id: string) => Complaint | undefined;
    referComplaint: (complaintId: string, target: 'supervisor' | 'executor') => Promise<void>;
    addComment: (complaintId: string, text: string, attachments: Attachment[]) => Promise<void>;
    returnComplaint: (complaintId: string, reason: string, targetRole: Role) => Promise<void>;
    addFinalVerdict: (complaintId: string, verdict: string) => Promise<void>;
    updateUserProfile: (data: UpdateProfileData) => Promise<void>;
    updateEngineer: (userId: string, data: UpdateEngineerData) => Promise<boolean>;
    addEngineer: (engineer: User) => Promise<boolean>;
    importEngineers: (engineers: User[]) => Promise<boolean>;
    addNotification: (message: string, type?: NotificationType) => void;
    removeNotification: (id: number) => void;
    updateSmsSettings: (settings: SmsSettings) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_TEMPLATES: SmsTemplates = {
    newComplaint: "شکایت شما با کد پیگیری {id} در سامانه ثبت شد.",
    referralToEngineer: "همکار گرامی، پرونده جدیدی با کد {id} به کارتابل شما ارجاع شد.",
    referralNotification: "شکایت {id} جهت بررسی به {target} ارجاع شد.",
    defectReturn: "پرونده {id} دارای نقص مدارک است. لطفا جهت تکمیل اطلاعات به سامانه مراجعه کنید.",
    finalVerdict: "رای نهایی پرونده {id} صادر شد. جهت مشاهده به سامانه مراجعه کنید."
};

const DEFAULT_SMS_SETTINGS: SmsSettings = {
    apiKey: '47776F414B6256614A584379663045714530656C48736154763979364D3057415A376D34497074717675513D', 
    lineNumber: '2000660110', 
    isEnabled: true,
    templates: DEFAULT_TEMPLATES
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [smsSettings, setSmsSettings] = useState<SmsSettings>(DEFAULT_SMS_SETTINGS);
    const [notifications, setNotifications] = useState<NotificationState[]>([]);
    const [isCloudConnected, setIsCloudConnected] = useState(false);

    // --- Data Loading ---
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Check connection type
                setIsCloudConnected(db.isCloudStorage());

                // Load Users
                let loadedUsers = await db.fetchCollection<User>('users');
                if (loadedUsers.length === 0) {
                    // Seed initial users if DB is empty
                    loadedUsers = INITIAL_USERS;
                    await db.saveCollection('users', loadedUsers);
                }
                setUsers(loadedUsers);

                // Load Complaints
                const loadedComplaints = await db.fetchCollection<any>('complaints');
                // Revive dates
                const processedComplaints = loadedComplaints.map((c: any) => ({
                    ...c,
                    createdAt: new Date(c.createdAt),
                    referredAt: c.referredAt ? new Date(c.referredAt) : undefined,
                    respondedAt: c.respondedAt ? new Date(c.respondedAt) : undefined,
                    closedAt: c.closedAt ? new Date(c.closedAt) : undefined,
                    comments: c.comments.map((comment: any) => ({
                        ...comment,
                        createdAt: new Date(comment.createdAt),
                    })),
                    referralHistory: c.referralHistory ? c.referralHistory.map((log: any) => ({
                        ...log,
                        referredAt: new Date(log.referredAt)
                    })) : [],
                }));
                setComplaints(processedComplaints);

                // Load Settings
                const loadedSettings = await db.fetchSettings(DEFAULT_SMS_SETTINGS);
                // Ensure templates exist
                const finalSettings = {
                    ...loadedSettings,
                    templates: { ...DEFAULT_TEMPLATES, ...(loadedSettings.templates || {}) }
                };
                setSmsSettings(finalSettings);

            } catch (error) {
                console.error("Failed to load data:", error);
                addNotification('خطا در بارگذاری اطلاعات از پایگاه داده.', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    const addNotification = (message: string, type: NotificationType = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeNotification(id), 5000);
    };

    const removeNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const updateSmsSettings = async (settings: SmsSettings) => {
        setSmsSettings(settings);
        await db.saveSettings(settings);
        addNotification('تنظیمات پنل پیامکی با موفقیت ذخیره شد.', 'success');
    };

    const formatSmsMessage = (template: string, params: Record<string, string>) => {
        let message = template;
        Object.keys(params).forEach(key => {
            message = message.replace(new RegExp(`{${key}}`, 'g'), params[key]);
        });
        return message;
    };

    const handleSendSms = async (recipient: string, message: string) => {
        if (!smsSettings.isEnabled) return false;
        
        if (!smsSettings.apiKey || !smsSettings.lineNumber) {
            console.warn('[SMS] Cannot send SMS: API Key or Line Number missing.');
            return false;
        }
        
        // Use the service
        const result = await sendKavehNegarSms(smsSettings.apiKey, smsSettings.lineNumber, recipient, message);
        
        if (!result.success) {
            console.warn(`[SMS Failed]: ${result.message}`);
        }
        
        return result.success;
    };

    const login = (nationalId: string, password: string): boolean => {
        const foundUser = users.find(u => u.id === nationalId && u.password === password);
        if (foundUser) {
            setUser(foundUser);
            addNotification(`خوش آمدید, ${foundUser.fullName}!`, 'success');
            return true;
        }
        addNotification('کد ملی یا رمز عبور اشتباه است.', 'error');
        return false;
    };

    const register = async (fullName: string, nationalId: string, password: string): Promise<boolean> => {
        if (!validateNationalId(nationalId)) {
            addNotification('کد ملی وارد شده معتبر نیست.', 'error');
            return false;
        }
        if (users.some(u => u.id === nationalId)) {
            addNotification('کاربری با این کد ملی قبلاً ثبت نام کرده است.', 'error');
            return false;
        }
        const newUser: User = { id: nationalId, fullName, password, role: Role.Complainant };
        
        // Optimistic UI update
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        setUser(newUser);
        
        // DB Persist
        await db.saveItem('users', newUser);
        
        addNotification('ثبت نام با موفقیت انجام شد.', 'success');
        return true;
    };
    
    const logout = () => {
        setUser(null);
        addNotification('با موفقیت از حساب خود خارج شدید.');
    };

    const addComplaint = async (complaintData: Omit<Complaint, 'id' | 'complainant' | 'status' | 'comments' | 'referralHistory' | 'createdAt' | 'referredToSupervisor' | 'referredToExecutor'>): Promise<Complaint> => {
        if (!user) throw new Error('User not logged in');
        const newComplaint: Complaint = {
            ...complaintData,
            id: `C-${Date.now().toString().slice(-6)}`,
            complainant: user,
            status: ComplaintStatus.New,
            comments: [],
            referralHistory: [],
            createdAt: new Date(),
            referredToSupervisor: false,
            referredToExecutor: false,
        };

        const updatedComplaints = [...complaints, newComplaint];
        setComplaints(updatedComplaints);
        
        // DB Persist
        await db.saveItem('complaints', newComplaint);
        
        // SMS Notification
        if (newComplaint.contactPhoneNumber) {
            const message = formatSmsMessage(smsSettings.templates.newComplaint, {
                id: newComplaint.id
            });
            handleSendSms(newComplaint.contactPhoneNumber, message);
        }

        return newComplaint;
    };
    
    const getComplaintById = (id: string): Complaint | undefined => {
        return complaints.find(c => c.id === id);
    };
    
    const referComplaint = async (complaintId: string, target: 'supervisor' | 'executor') => {
        if (!user) return;
        
        let targetComplaint: Complaint | null = null;
        let targetUser: User | undefined;
        let targetPersian = '';

        const updatedComplaints = complaints.map(c => {
            if (c.id === complaintId) {
                const newLog: ReferralLog = {
                    id: `REF-${Date.now()}`,
                    target,
                    referredAt: new Date(),
                    referredBy: user
                };

                const updated = { 
                    ...c, 
                    status: ComplaintStatus.Referred, 
                    referredAt: c.referredAt || new Date(),
                    referralHistory: [...(c.referralHistory || []), newLog]
                };
                
                if (target === 'supervisor') {
                    updated.referredToSupervisor = true;
                    targetUser = c.supervisor;
                    targetPersian = 'ناظر';
                }
                if (target === 'executor') {
                    updated.referredToExecutor = true;
                    targetUser = c.executor;
                    targetPersian = 'مجری';
                }
                
                targetComplaint = updated;
                return updated;
            }
            return c;
        });

        setComplaints(updatedComplaints);

        // DB Persist
        if (targetComplaint) {
            await db.saveItem('complaints', targetComplaint);
        }

        // SMS
        if (targetUser?.phoneNumber) {
            const message = formatSmsMessage(smsSettings.templates.referralToEngineer, {
                id: complaintId
            });
            handleSendSms(targetUser.phoneNumber, message);
        }
        if (targetComplaint && (targetComplaint as Complaint).contactPhoneNumber) {
             const message = formatSmsMessage(smsSettings.templates.referralNotification, {
                id: complaintId,
                target: targetPersian
            });
             handleSendSms((targetComplaint as Complaint).contactPhoneNumber, message);
        }

        addNotification(`پرونده به ${targetPersian} ارجاع شد.`, 'info');
    };

    const addComment = async (complaintId: string, text: string, attachments: Attachment[]) => {
        if (!user) return;
        const newComment: Comment = {
            id: `CM-${Date.now()}`,
            author: user,
            text,
            attachments: attachments,
            createdAt: new Date(),
        };

        let updatedComplaint: Complaint | null = null;
        const updatedComplaints = complaints.map(c => {
            if (c.id === complaintId) {
                updatedComplaint = { 
                    ...c, 
                    comments: [...c.comments, newComment], 
                    status: ComplaintStatus.Responded, 
                    respondedAt: new Date() 
                };
                return updatedComplaint;
            }
            return c;
        });

        setComplaints(updatedComplaints);
        if (updatedComplaint) await db.saveItem('complaints', updatedComplaint);
    };

    const returnComplaint = async (complaintId: string, reason: string, targetRole: Role) => {
        if (!user) return;
        
        let targetPersian = 'متقاضی';
        if (targetRole === Role.Supervisor) targetPersian = 'ناظر';
        if (targetRole === Role.Executor) targetPersian = 'مجری';
        if (targetRole === Role.Complainant) targetPersian = 'شاکی';

        const rejectionComment: Comment = {
            id: `CM-${Date.now()}`,
            author: user,
            text: `*** اعلام نقص مدارک / درخواست اطلاعات (مخاطب: ${targetPersian}) ***\n${reason}`,
            attachments: [],
            createdAt: new Date(),
        };

        let targetPhone: string | undefined = '';
        let updatedComplaint: Complaint | null = null;

        const updatedComplaints = complaints.map(c => {
            if (c.id === complaintId) {
                if (targetRole === Role.Complainant) targetPhone = c.contactPhoneNumber;
                if (targetRole === Role.Supervisor) targetPhone = c.supervisor?.phoneNumber;
                if (targetRole === Role.Executor) targetPhone = c.executor?.phoneNumber;

                updatedComplaint = { 
                    ...c, 
                    status: ComplaintStatus.Investigation, 
                    investigationTarget: targetRole,
                    comments: [...c.comments, rejectionComment]
                };
                return updatedComplaint;
            }
            return c;
        });

        setComplaints(updatedComplaints);
        if (updatedComplaint) await db.saveItem('complaints', updatedComplaint);

        if (targetPhone) {
            const message = formatSmsMessage(smsSettings.templates.defectReturn, {
                id: complaintId
            });
            handleSendSms(targetPhone, message);
        }
        addNotification(`پرونده جهت تکمیل اطلاعات به ${targetPersian} بازگردانده شد.`, 'info');
    };
    
    const addFinalVerdict = async (complaintId: string, verdict: string) => {
        let complainantPhone = '';
        let updatedComplaint: Complaint | null = null;

        const updatedComplaints = complaints.map(c => {
            if (c.id === complaintId) {
                complainantPhone = c.contactPhoneNumber;
                updatedComplaint = { ...c, finalVerdict: verdict, status: ComplaintStatus.Closed, closedAt: new Date() };
                return updatedComplaint;
            }
            return c;
        });
        
        setComplaints(updatedComplaints);
        if (updatedComplaint) await db.saveItem('complaints', updatedComplaint);

        if (complainantPhone) {
            const message = formatSmsMessage(smsSettings.templates.finalVerdict, {
                id: complaintId
            });
            handleSendSms(complainantPhone, message);
        }
        
        addNotification(`رای نهایی برای پرونده ${complaintId} ثبت و به طرفین اطلاع‌رسانی شد.`, 'success');
    };

    const updateUserProfile = async (data: UpdateProfileData) => {
        if (!user) return;

        let updatedUserObj: User | null = null;

        const updatedUsers = users.map(u => {
            if (u.id === user.id) {
                const updated = { ...u };
                if (data.fullName) updated.fullName = data.fullName;
                if (data.password) updated.password = data.password;
                if (data.avatar !== undefined) updated.avatar = data.avatar ?? undefined;
                updatedUserObj = updated;
                return updated;
            }
            return u;
        });

        setUsers(updatedUsers);
        if (updatedUserObj) {
            setUser(updatedUserObj);
            await db.saveItem('users', updatedUserObj);
        }
    };

    const updateEngineer = async (userId: string, data: UpdateEngineerData): Promise<boolean> => {
        if (data.phoneNumber && !validatePhoneNumber(data.phoneNumber)) {
            addNotification('فرمت شماره تلفن همراه نامعتبر است. (مثال صحیح: 09123456789)', 'error');
            return false;
        }

        let updatedUserObj: User | null = null;
        const updatedUsers = users.map(u => {
            if (u.id === userId) {
                updatedUserObj = { ...u, ...data };
                return updatedUserObj;
            }
            return u;
        });

        setUsers(updatedUsers);
        if (updatedUserObj) {
            await db.saveItem('users', updatedUserObj);
            if (user && user.id === userId) setUser(updatedUserObj);
        }
        
        addNotification('اطلاعات مهندس با موفقیت به‌روزرسانی شد.', 'success');
        return true;
    };
    
    const addEngineer = async (engineer: User): Promise<boolean> => {
        if (!validateNationalId(engineer.id)) {
            addNotification('کد ملی وارد شده نامعتبر است.', 'error');
            return false;
        }
        if (users.some(u => u.id === engineer.id)) {
            addNotification('کاربری با این کد ملی قبلاً وجود دارد.', 'error');
            return false;
        }
        if (engineer.phoneNumber && !validatePhoneNumber(engineer.phoneNumber)) {
             addNotification('فرمت شماره تلفن همراه نامعتبر است.', 'error');
             return false;
        }

        const updatedUsers = [...users, engineer];
        setUsers(updatedUsers);
        await db.saveItem('users', engineer);

        addNotification('مهندس جدید با موفقیت اضافه شد.', 'success');
        return true;
    };

    const importEngineers = async (engineers: User[]): Promise<boolean> => {
        const invalidIdIndex = engineers.findIndex(e => !validateNationalId(e.id));
        if (invalidIdIndex !== -1) {
            addNotification(`کد ملی نامعتبر در ردیف ${invalidIdIndex + 2} فایل اکسل: ${engineers[invalidIdIndex].id}`, 'error');
            return false;
        }

        // We append new engineers to existing users that are NOT being imported (keep admins/complainants)
        // Or we assume the import is ONLY for supervisors/executors.
        // For simplicity, we merge.
        
        const existingNonEngineers = users.filter(u => u.role === Role.Complainant || u.role === Role.Admin);
        const finalUsers = [...existingNonEngineers, ...engineers];

        setUsers(finalUsers);
        
        // Bulk Save
        await db.saveCollection('users', finalUsers);

        addNotification('لیست مهندسین با موفقیت به‌روزرسانی شد.', 'success');
        return true;
    };

    const getDynamicSupervisors = () => users.filter(u => u.role === Role.Supervisor);
    const getDynamicExecutors = () => users.filter(u => u.role === Role.Executor);


    const value = {
        user,
        users,
        complaints,
        supervisors: getDynamicSupervisors(),
        executors: getDynamicExecutors(),
        notifications,
        smsSettings,
        isLoading,
        isCloudConnected,
        login,
        register,
        logout,
        addComplaint,
        getComplaintById,
        referComplaint,
        addComment,
        returnComplaint,
        addFinalVerdict,
        updateUserProfile,
        updateEngineer,
        addEngineer,
        importEngineers,
        addNotification,
        removeNotification,
        updateSmsSettings,
    };

    return <AppContext.Provider value={value}>{!isLoading ? children : <div className="flex h-screen items-center justify-center text-emerald-600">در حال بارگذاری اطلاعات...</div>}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
