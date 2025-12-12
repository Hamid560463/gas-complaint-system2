
export enum Role {
    Complainant = 'complainant',
    Admin = 'admin',
    Supervisor = 'supervisor',
    Executor = 'executor'
}

export enum ComplaintStatus {
    New = 'جدید',
    Referred = 'ارجاع شده',
    Responded = 'پاسخ داده شده',
    Investigation = 'نقص مدارک / بررسی مجدد',
    Closed = 'مختومه'
}

export enum ComplaintType {
    AgainstExecutor = 'شکایت از مجری',
    AgainstSupervisor = 'شکایت از ناظر',
    Other = 'سایر'
}

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationState {
    id: number;
    message: string;
    type: NotificationType;
}

export interface User {
    id: string; // National ID
    fullName: string;
    password?: string;
    role: Role;
    avatar?: string;
    phoneNumber?: string;
    email?: string;
}

export interface Attachment {
    id: string;
    name: string;
    url: string;
}

export interface Comment {
    id: string;
    author: User;
    text: string;
    attachments: Attachment[];
    createdAt: Date;
}

export interface ReferralLog {
    id: string;
    target: 'supervisor' | 'executor';
    referredAt: Date;
    referredBy: User;
}

export interface Complaint {
    id: string;
    gasFileNumber: string;
    complainant: User;
    projectAddress: string; // Mandatory now
    contactPhoneNumber: string; // Mandatory now
    supervisor?: User;
    executor?: User;
    complaintType: ComplaintType;
    description: string;
    status: ComplaintStatus;
    attachments: Attachment[];
    comments: Comment[];
    referralHistory: ReferralLog[];
    createdAt: Date;
    referredAt?: Date;
    respondedAt?: Date;
    closedAt?: Date;
    finalVerdict?: string;
    referredToSupervisor?: boolean;
    referredToExecutor?: boolean;
    investigationTarget?: Role; // New field: Who needs to fix the defect?
}

export interface SmsTemplates {
    newComplaint: string;       // Sent to Complainant on creation
    referralToEngineer: string; // Sent to Supervisor/Executor when referred
    referralNotification: string; // Sent to Complainant when referred
    defectReturn: string;       // Sent to Target when returned for defect
    finalVerdict: string;       // Sent to Complainant when closed
}

export interface SmsSettings {
    apiKey: string;
    lineNumber: string;
    isEnabled: boolean;
    templates: SmsTemplates;
}
