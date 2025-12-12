
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, Complaint, NotificationState, NotificationType, Role, ComplaintStatus, Comment, SmsSettings, ReferralLog, SmsTemplates, Attachment } from '../types';
import { INITIAL_USERS } from '../constants';
import { validateNationalId, validatePhoneNumber } from '../utils/validation';
import { sendKavehNegarSms } from '../utils/smsService';
import * as db from '../utils/db';
import { supabase } from '../utils/supabaseClient';

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
    isCloudConnected: boolean;
    login: (nationalId: string, password: string) => Promise<boolean>;
    register: (fullName: string, nationalId: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
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
    apiKey: '', // Empty by default for security, loaded from DB
    lineNumber: '2000660110', 
    isEnabled: true,
    templates: DEFAULT_TEMPLATES
};

// Helper to create fake email for National ID based auth
const getEmailFromNationalId = (nid: string) => `${nid}@system.local`;

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]); // This stores public profiles
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

                // Check Supabase Session
                const { data: { session } } = await supabase.auth.getSession();
                
                // Load Users (Public Profiles)
                let loadedUsers = await db.fetchCollection<User>('users');
                if (loadedUsers.length === 0) {
                    // Seed initial users if DB is empty AND we are on local storage (avoid auto-seeding auth on cloud)
                    if (!db.isCloudStorage()) {
                        loadedUsers = INITIAL_USERS;
                        await db.saveCollection('users', loadedUsers);
                    }
                }
                setUsers(loadedUsers);

                if (session && session.user) {
                    // Find the profile matching the auth user
                    // We store the National ID in user_metadata or map it via the 'users' table
                    // Here we try to find the user in our 'users' collection by ID (which we used as National ID)
                    // But Supabase Auth uses UUIDs. 
                    // Strategy: We look up the user in 'users' collection where id == nationalId derived from email OR metadata.
                    const nationalId = session.user.user_metadata?.nationalId || session.user.email?.split('@')[0];
                    const currentUser = loadedUsers.find(u => u.id === nationalId);
                    if (currentUser) {
                        setUser(currentUser);
                    }
                }

                // Load Complaints
                const loadedComplaints = await db.fetchCollection<any>('complaints');
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
                const finalSettings = {
                    ...loadedSettings,
                    templates: { ...DEFAULT_TEMPLATES, ...(loadedSettings.templates || {}) }
                };
                setSmsSettings(finalSettings);

            } catch (error) {
                console.error("Failed to load data:", error);
                addNotification('خطا در بارگذاری اطلاعات.', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!session) {
                setUser(null);
            } else {
                 const loadedUsers = await db.fetchCollection<User>('users');
                 setUsers(loadedUsers);
                 const nationalId = session.user.user_metadata?.nationalId || session.user.email?.split('@')[0];
                 const currentUser = loadedUsers.find(u => u.id === nationalId);
                 if (currentUser) setUser(currentUser);
            }
        });

        return () => subscription.unsubscribe();
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
        
        if (!smsSettings.apiKey) {
            console.warn('[SMS] API Key missing.');
            return false;
        }
        
        const result = await sendKavehNegarSms(smsSettings.apiKey, smsSettings.lineNumber, recipient, message);
        
        if (!result.success) {
            console.warn(`[SMS Failed]: ${result.message}`);
        }
        
        return result.success;
    };

    const login = async (nationalId: string, password: string): Promise<boolean> => {
        // Use Supabase Auth
        const email = getEmailFromNationalId(nationalId);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error("Login error:", error.message);
            addNotification('کد ملی یا رمز عبور اشتباه است.', 'error');
            return false;
        }

        addNotification(`خوش آمدید!`, 'success');
        return true;
    };

    const register = async (fullName: string, nationalId: string, password: string): Promise<boolean> => {
        if (!validateNationalId(nationalId)) {
            addNotification('کد ملی وارد شده معتبر نیست.', 'error');
            return false;
        }

        const email = getEmailFromNationalId(nationalId);

        // 1. Sign up in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { nationalId, fullName, role: Role.Complainant } // Metadata
            }
        });

        if (authError) {
            addNotification(`خطا در ثبت نام: ${authError.message}`, 'error');
            return false;
        }

        // 2. Create Public Profile in 'users' table
        const newUser: User = { 
            id: nationalId, 
            fullName, 
            role: Role.Complainant 
            // We don't store password in the public table anymore
        };
        
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        setUser(newUser); // Set immediate context state
        
        await db.saveItem('users', newUser);
        
        addNotification('ثبت نام با موفقیت انجام شد.', 'success');
        return true;
    };
    
    const logout = async () => {
        await supabase.auth.signOut();
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
        
        await db.saveItem('complaints', newComplaint);
        
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

        if (targetComplaint) {
            await db.saveItem('complaints', targetComplaint);
        }

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

        // 1. Update Auth Password if provided
        if (data.password) {
            const { error } = await supabase.auth.updateUser({ password: data.password });
            if (error) {
                addNotification(`خطا در تغییر رمز عبور: ${error.message}`, 'error');
                return;
            }
        }

        // 2. Update Public Profile
        let updatedUserObj: User | null = null;

        const updatedUsers = users.map(u => {
            if (u.id === user.id) {
                const updated = { ...u };
                if (data.fullName) updated.fullName = data.fullName;
                // We don't store password in public profile
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
        // Only updates the Public Profile.
        // For security, an admin cannot change another user's password directly via Supabase Auth client-side without a backend function, 
        // unless using Service Role key (which we shouldn't use in frontend).
        // So we just update the profile info.

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

        const email = getEmailFromNationalId(engineer.id);
        const password = engineer.password || '123'; // Default

        // 1. Create Auth User
        const { error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { nationalId: engineer.id, fullName: engineer.fullName, role: engineer.role } }
        });

        if (authError) {
             addNotification(`خطا در ایجاد حساب کاربری: ${authError.message}`, 'error');
             return false;
        }

        // 2. Create Public Profile
        const safeEngineer = { ...engineer };
        delete safeEngineer.password; // Don't save pass in public

        const updatedUsers = [...users, safeEngineer];
        setUsers(updatedUsers);
        await db.saveItem('users', safeEngineer);

        addNotification('مهندس جدید با موفقیت اضافه شد.', 'success');
        return true;
    };

    const importEngineers = async (engineers: User[]): Promise<boolean> => {
        // Bulk import is tricky with Auth because of rate limits and security.
        // For this demo, we will just create Public Profiles in the 'users' table.
        // In a real app, each engineer would need to sign up themselves or use a backend Admin script.
        
        const existingNonEngineers = users.filter(u => u.role === Role.Complainant || u.role === Role.Admin);
        
        // Filter out those who already exist in the list
        const newUniqueEngineers = engineers.filter(e => !users.some(u => u.id === e.id));
        
        // Remove passwords before saving to public table
        const safeEngineers = newUniqueEngineers.map(e => {
            const { password, ...rest } = e;
            return rest as User;
        });

        const finalUsers = [...users, ...safeEngineers];

        setUsers(finalUsers);
        await db.saveCollection('users', finalUsers);

        addNotification(`لیست مهندسین به‌روز شد. (تعداد افزوده شده: ${safeEngineers.length}). توجه: حساب کاربری ورود (Auth) باید جداگانه ایجاد شود.`, 'success');
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
