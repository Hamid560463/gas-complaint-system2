
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Complaint, ComplaintType, Role, ComplaintStatus, Attachment } from '../types';
import { Card } from './common/Card';
import { Input, Select, Textarea } from './common/Input';
import { Button } from './common/Button';
import { FileUpload } from './common/FileUpload';
import { DocumentIcon, ClockIcon, PrinterIcon } from './Icons';
import { validatePhoneNumber } from '../utils/validation';

interface ComplaintFormProps {
    onSuccess: (complaintId: string) => void;
}

// Helper to convert File to Base64 Data URL
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

// Helper for status colors
export const getStatusBadgeStyles = (status: ComplaintStatus): string => {
    switch (status) {
        case ComplaintStatus.New: return 'bg-amber-100 text-amber-800 border-amber-200';
        case ComplaintStatus.Referred: return 'bg-sky-100 text-sky-800 border-sky-200';
        case ComplaintStatus.Responded: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
        case ComplaintStatus.Investigation: return 'bg-orange-100 text-orange-800 border-orange-200';
        case ComplaintStatus.Closed: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

// ComplaintForm Component
export const ComplaintForm: React.FC<ComplaintFormProps> = ({ onSuccess }) => {
    const { supervisors, executors, addComplaint, addNotification, user } = useAppContext();
    
    const [gasFileNumber, setGasFileNumber] = useState('');
    const [supervisorId, setSupervisorId] = useState('');
    const [executorId, setExecutorId] = useState('');
    const [complaintType, setComplaintType] = useState<ComplaintType>(ComplaintType.AgainstExecutor);
    const [description, setDescription] = useState('');
    
    // New Fields
    const [contactPhoneNumber, setContactPhoneNumber] = useState(user?.phoneNumber || '');
    const [projectAddress, setProjectAddress] = useState('');

    const [files, setFiles] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Validation - Strictly Enforced
        if (!validatePhoneNumber(contactPhoneNumber)) {
            addNotification("شماره موبایل وارد شده معتبر نیست (مثال: 09121234567).", 'error');
            setIsLoading(false);
            return;
        }

        if (!projectAddress.trim()) {
            addNotification("وارد کردن آدرس دقیق ملک الزامی است.", 'error');
            setIsLoading(false);
            return;
        }

        const supervisor = supervisors.find(s => s.id === supervisorId);
        const executor = executors.find(e => e.id === executorId);

        if (!supervisor || !executor) {
            addNotification("لطفا ناظر و مجری را انتخاب کنید.", 'error');
            setIsLoading(false);
            return;
        }

        try {
            // Convert files to Base64 to make them accessible across devices
            const attachments: Attachment[] = await Promise.all(files.map(async (file) => ({
                id: file.name,
                name: file.name,
                url: await fileToBase64(file),
            })));

            const newComplaint = await addComplaint({
                gasFileNumber,
                supervisor,
                executor,
                complaintType,
                description,
                contactPhoneNumber,
                projectAddress,
                attachments,
            });

            onSuccess(newComplaint.id);
        } catch (error) {
            console.error(error);
            addNotification("خطا در بارگذاری فایل‌ها یا ثبت شکایت.", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card title="ثبت شکواییه جدید">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-yellow-50 border-r-4 border-yellow-400 p-4 mb-4">
                    <p className="text-sm text-yellow-700">
                        پر کردن شماره موبایل و آدرس دقیق ملک جهت پیگیری شکایت و دریافت پیامک‌های اطلاع‌رسانی <strong>الزامی</strong> است.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Input label="شماره پرونده گاز" id="gasFileNumber" value={gasFileNumber} onChange={e => setGasFileNumber(e.target.value)} required />
                     <Input label="شماره موبایل جهت اطلاع‌رسانی" id="contactPhoneNumber" value={contactPhoneNumber} onChange={e => setContactPhoneNumber(e.target.value)} placeholder="09xxxxxxxxx" required />
                </div>
                
                <Textarea label="آدرس دقیق ملک (محل پروژه)" id="projectAddress" value={projectAddress} onChange={e => setProjectAddress(e.target.value)} placeholder="استان، شهر، خیابان..." required />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select label="نام مجری" id="executor" value={executorId} onChange={e => setExecutorId(e.target.value)} required>
                        <option value="">یک مجری را انتخاب کنید</option>
                        {executors.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                    </Select>
                    <Select label="نام ناظر" id="supervisor" value={supervisorId} onChange={e => setSupervisorId(e.target.value)} required>
                        <option value="">یک ناظر را انتخاب کنید</option>
                        {supervisors.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                    </Select>
                </div>
                
                <Select label="نوع شکایت" id="complaintType" value={complaintType} onChange={e => setComplaintType(e.target.value as ComplaintType)} required>
                    {Object.values(ComplaintType).map(type => <option key={type} value={type}>{type}</option>)}
                </Select>
                <Textarea label="متن شکواییه" id="description" value={description} onChange={e => setDescription(e.target.value)} required />
                <FileUpload onFilesChange={setFiles} />
                <div className="text-left">
                    <Button type="submit" isLoading={isLoading}>ارسال شکواییه</Button>
                </div>
            </form>
        </Card>
    );
};

// ComplaintDetails Component
const DetailItem: React.FC<{ label: string; value: string | React.ReactNode; className?: string }> = ({ label, value, className = '' }) => (
    <div className={`py-3 sm:grid sm:grid-cols-3 sm:gap-4 ${className}`}>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{value}</dd>
    </div>
);

const AttachmentsList: React.FC<{ attachments: Attachment[] }> = ({ attachments }) => (
    <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
        {attachments.map(att => (
            <li key={att.id} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                <div className="w-0 flex-1 flex items-center">
                    <DocumentIcon className="flex-shrink-0 h-5 w-5 text-gray-400" />
                    <span className="mr-2 flex-1 w-0 truncate">{att.name}</span>
                </div>
                <div className="ml-4 flex-shrink-0">
                    <a href={att.url} download={att.name} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-500">
                        دانلود
                    </a>
                </div>
            </li>
        ))}
    </ul>
);

const ResponseForm: React.FC<{ complaintId: string, title: string, buttonText: string }> = ({ complaintId, title, buttonText }) => {
    const { addComment } = useAppContext();
    const [text, setText] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const attachments: Attachment[] = await Promise.all(files.map(async (file) => ({
                id: file.name,
                name: file.name,
                url: await fileToBase64(file),
            })));

            await addComment(complaintId, text, attachments);
            setText('');
            setFiles([]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="mt-6 print:hidden" title={title}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea label="متن توضیحات" id="comment-text" value={text} onChange={e => setText(e.target.value)} required />
                <FileUpload onFilesChange={setFiles} />
                <div className="text-left">
                    <Button type="submit" isLoading={isLoading}>{buttonText}</Button>
                </div>
            </form>
        </Card>
    );
};

const AdminReturnForm: React.FC<{ complaint: Complaint }> = ({ complaint }) => {
    const { returnComplaint } = useAppContext();
    const [reason, setReason] = useState('');
    const [targetRole, setTargetRole] = useState<Role>(Role.Complainant);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        returnComplaint(complaint.id, reason, targetRole);
        setReason('');
        setIsLoading(false);
    };

    return (
        <Card className="mt-6 bg-red-50 border border-red-200 print:hidden" title="بازگشت پرونده (اعلام نقص مدارک)">
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-red-700">
                    در صورتی که مستندات کافی نیست، فرد مسئول را انتخاب و دلیل را ذکر کنید.
                </p>
                <Select label="مخاطب رفع نقص" id="target-role" value={targetRole} onChange={e => setTargetRole(e.target.value as Role)}>
                    <option value={Role.Complainant}>شاکی (تکمیل مدارک شکایت)</option>
                    {complaint.supervisor && <option value={Role.Supervisor}>ناظر ({complaint.supervisor.fullName})</option>}
                    {complaint.executor && <option value={Role.Executor}>مجری ({complaint.executor.fullName})</option>}
                </Select>
                <Textarea label="دلیل بازگشت / نقص مدارک" id="return-reason" value={reason} onChange={e => setReason(e.target.value)} required />
                <div className="text-left">
                    <Button type="submit" variant="danger" isLoading={isLoading}>ثبت و بازگشت پرونده</Button>
                </div>
            </form>
        </Card>
    );
};

const AdminVerdictForm: React.FC<{ complaintId: string }> = ({ complaintId }) => {
    const { addFinalVerdict } = useAppContext();
    const [verdict, setVerdict] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        addFinalVerdict(complaintId, verdict);
        setIsLoading(false);
    };
    
    return (
        <Card className="mt-6 print:hidden" title="ثبت نتیجه و رای نهایی">
             <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea label="متن رای نهایی" id="verdict-text" value={verdict} onChange={e => setVerdict(e.target.value)} required />
                <div className="text-left">
                    <Button type="submit" isLoading={isLoading}>ثبت نهایی و اطلاع رسانی پیامکی</Button>
                </div>
            </form>
        </Card>
    );
};

export const ComplaintDetails: React.FC<{ complaint: Complaint }> = ({ complaint }) => {
    const { user, referComplaint } = useAppContext();

    if (!user) return null;

    const isAdmin = user.role === Role.Admin;
    const isComplainant = user.role === Role.Complainant;
    const isSupervisor = user.role === Role.Supervisor;
    const isExecutor = user.role === Role.Executor;

    // Filter Comments Logic:
    // Admin sees ALL comments.
    // Others see only THEIR OWN comments AND comments made by Admin (instructions).
    const visibleComments = complaint.comments.filter(comment => {
        if (isAdmin) return true;
        if (comment.author.role === Role.Admin) return true;
        return comment.author.id === user.id;
    });

    const isClosed = complaint.status === ComplaintStatus.Closed;
    const isInvestigation = complaint.status === ComplaintStatus.Investigation;

    // Response Form Logic
    // 1. Engineers can respond if status is Referred or Responded.
    // 2. If status is Investigation, ONLY the target can respond.
    
    let canRespond = false;
    let responseTitle = "ثبت توضیحات";
    let isDefectMode = false;

    if (!isClosed) {
        if (isInvestigation) {
            // Only the person targeted by the investigation can respond
            if (complaint.investigationTarget === user.role) {
                canRespond = true;
                responseTitle = "تکمیل مدارک / رفع نقص";
                isDefectMode = true;
            }
        } else if (complaint.status !== ComplaintStatus.New) {
            // Standard flow: Engineers can respond if referred
            if (isSupervisor && complaint.referredToSupervisor) canRespond = true;
            if (isExecutor && complaint.referredToExecutor) canRespond = true;
        }
    }

    const showReferralButtons = isAdmin && (!complaint.referredToExecutor || !complaint.referredToSupervisor) && !isClosed;
    const canAdminClose = isAdmin && !isClosed;
    const canAdminReturn = isAdmin && !isClosed;

    const referralTargets = [
        complaint.referredToSupervisor && 'ناظر',
        complaint.referredToExecutor && 'مجری'
    ].filter(Boolean).join(' و ');

    return (
        <Card className="print:shadow-none print:border-none">
            <div className="flex justify-between items-center border-b border-gray-200 px-4 py-5 sm:px-6">
                 <h3 className="text-lg font-medium leading-6 text-gray-900">
                    جزئیات شکواییه - کد رهگیری: {complaint.id}
                 </h3>
                 <div className="print:hidden">
                    <Button onClick={() => window.print()} variant="secondary" className="text-xs sm:text-sm">
                        <PrinterIcon className="w-4 h-4 ml-2" />
                        چاپ / خروجی PDF
                    </Button>
                 </div>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
                <dl className="divide-y divide-gray-200">
                    <DetailItem label="وضعیت" value={
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadgeStyles(complaint.status)} print:border-gray-400 print:text-black`}>
                            {complaint.status}
                        </span>
                    } />
                    <DetailItem label="شاکی" value={complaint.complainant.fullName} />
                    <DetailItem label="شماره تماس شاکی" value={complaint.contactPhoneNumber} />
                    <DetailItem label="آدرس پروژه" value={complaint.projectAddress} />
                    <DetailItem label="شماره پرونده گاز" value={complaint.gasFileNumber} />
                    <DetailItem label="ناظر" value={complaint.supervisor?.fullName || '-'} />
                    <DetailItem label="مجری" value={complaint.executor?.fullName || '-'} />
                    {referralTargets && <DetailItem label="ارجاع شده به" value={referralTargets} />}
                    <DetailItem label="تاریخ ثبت" value={new Date(complaint.createdAt).toLocaleDateString('fa-IR')} />
                    <DetailItem label="شرح شکواییه" value={<p className="whitespace-pre-wrap">{complaint.description}</p>} />
                    <DetailItem label="مستندات شاکی" value={complaint.attachments.length > 0 ? <AttachmentsList attachments={complaint.attachments} /> : "مستنداتی ضمیمه نشده است."} />
                </dl>
                
                {/* Referral History Log */}
                {complaint.referralHistory && complaint.referralHistory.length > 0 && (
                    <div className="mt-6 border-t border-gray-200 pt-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                            <ClockIcon className="h-5 w-5 ml-2 text-gray-500" />
                            تاریخچه ارجاعات پرونده
                        </h4>
                        <ul className="relative border-r border-gray-200 mr-3 space-y-6">
                            {complaint.referralHistory.map((log) => (
                                <li key={log.id} className="relative pr-6">
                                    <div className="absolute -right-1.5 top-1.5 h-3 w-3 rounded-full bg-blue-200 ring-4 ring-white print:border print:border-gray-400"></div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                ارجاع به {log.target === 'supervisor' ? 'مهندس ناظر' : 'مجری پروژه'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">توسط: {log.referredBy.fullName}</p>
                                        </div>
                                        <span className="text-xs text-gray-400 mt-1 sm:mt-0 font-mono">
                                            {new Date(log.referredAt).toLocaleString('fa-IR')}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {showReferralButtons && (
                    <div className="mt-6 text-left border-t border-gray-200 pt-6 flex items-center gap-4 print:hidden">
                        <p className="font-semibold text-sm text-gray-700">عملیات:</p>
                        <Button 
                            onClick={() => referComplaint(complaint.id, 'supervisor')}
                            disabled={complaint.referredToSupervisor}
                            variant='secondary'
                        >
                            {complaint.referredToSupervisor ? 'به ناظر ارجاع شد' : 'ارجاع به ناظر'}
                        </Button>
                        <Button 
                            onClick={() => referComplaint(complaint.id, 'executor')}
                            disabled={complaint.referredToExecutor}
                            variant='secondary'
                        >
                            {complaint.referredToExecutor ? 'به مجری ارجاع شد' : 'ارجاع به مجری'}
                        </Button>
                    </div>
                )}

                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">نظرات و دفاعیات</h3>
                    {visibleComments.length === 0 && !isClosed && <p className="text-sm text-gray-500">هنوز نظری که برای شما قابل مشاهده باشد ثبت نشده است.</p>}
                    <div className="space-y-6">
                        {visibleComments.map(comment => (
                            <Card key={comment.id} className="bg-gray-50 p-6 print:bg-white print:border print:border-gray-300">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-semibold text-gray-800">{comment.author.fullName} <span className="text-xs text-gray-500 font-normal">({comment.author.role})</span></p>
                                    <p className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString('fa-IR')}</p>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{comment.text}</p>
                                {comment.attachments.length > 0 && <AttachmentsList attachments={comment.attachments} />}
                            </Card>
                        ))}
                        {isClosed && complaint.finalVerdict && (
                            <Card className="bg-green-50 border-green-200 border p-6 print:bg-white print:border-black">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-semibold text-green-800 print:text-black">رای نهایی هیئت حل اختلاف</p>
                                    <p className="text-xs text-gray-500">{complaint.closedAt && new Date(complaint.closedAt).toLocaleString('fa-IR')}</p>
                                </div>
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{complaint.finalVerdict}</p>
                            </Card>
                        )}
                    </div>
                </div>
                
                {/* Response Form */}
                {canRespond && (
                    <div className="mt-4 print:hidden">
                        {isDefectMode && (
                            <div className="bg-orange-50 border-r-4 border-orange-400 p-4 mb-4">
                                <p className="text-sm text-orange-700">
                                    پرونده دارای نقص اطلاعات است. لطفاً موارد خواسته شده توسط مدیر را ارسال کنید.
                                </p>
                            </div>
                        )}
                        <ResponseForm 
                            complaintId={complaint.id} 
                            title={responseTitle}
                            buttonText="ثبت و ارسال" 
                        />
                    </div>
                )}

                {/* Admin Actions */}
                {canAdminReturn && <AdminReturnForm complaint={complaint} />}
                {canAdminClose && <AdminVerdictForm complaintId={complaint.id} />}
            </div>
        </Card>
    );
};
