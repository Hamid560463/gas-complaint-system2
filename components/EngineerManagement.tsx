
import React, { useState, ChangeEvent, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { User, Role } from '../types';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { Input, Select } from './common/Input';
import { Modal } from './common/Modal';
import { ArrowUpTrayIcon, InformationCircleIcon, PencilIcon, PlusCircleIcon } from './Icons';

// This lets TypeScript know that the XLSX object is available on the window
declare const XLSX: any;

interface EngineerManagementProps {
    onImportComplete: () => void;
}

const ImportView: React.FC<{ onImportComplete: () => void }> = ({ onImportComplete }) => {
    const { importEngineers, addNotification } = useAppContext();
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleImport = () => {
        if (!file) {
            addNotification('لطفاً ابتدا یک فایل اکسل را انتخاب کنید.', 'error');
            return;
        }

        setIsLoading(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet);

                const newEngineers: User[] = json.map((row, index) => {
                    const { fullName, id, role, email, phoneNumber } = row;
                    if (!fullName || !id || !role) {
                        throw new Error(`ردیف ${index + 2} در فایل اکسل ناقص است. ستون‌های fullName, id, و role الزامی هستند.`);
                    }
                    if (role !== Role.Supervisor && role !== Role.Executor) {
                        throw new Error(`مقدار نقش (role) در ردیف ${index + 2} نامعتبر است. فقط مقادیر 'ناظر' یا 'مجری' مجاز هستند.`);
                    }
                    return {
                        id: String(id),
                        fullName: String(fullName),
                        role: role as Role,
                        email: email ? String(email) : undefined,
                        phoneNumber: phoneNumber ? String(phoneNumber) : undefined,
                        password: '123' // Default password for imported users
                    };
                });
                
                if (importEngineers(newEngineers)) {
                   onImportComplete();
                }

            } catch (error) {
                if (error instanceof Error) {
                   addNotification(`خطا در پردازش فایل: ${error.message}`, 'error');
                } else {
                   addNotification('یک خطای ناشناخته در پردازش فایل رخ داد.', 'error');
                }
            } finally {
                setIsLoading(false);
            }
        };

        reader.onerror = () => {
             addNotification('خطا در خواندن فایل.', 'error');
             setIsLoading(false);
        }

        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="p-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="mr-3">
                        <p className="text-sm text-blue-700">
                            فایل اکسل باید دارای ستون‌های الزامی `fullName`، `id` (کد ملی) و `role` (با مقدار 'ناظر' یا 'مجری') باشد. ستون‌های `email` و `phoneNumber` اختیاری هستند. با ایمپورت فایل جدید، لیست مهندسین قبلی حذف و لیست جدید جایگزین می‌شود.
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="max-w-md mx-auto">
                <label htmlFor="excel-upload" className="block text-sm font-medium text-gray-700 mb-2">
                    فایل اکسل (.xlsx, .xls) را انتخاب کنید:
                </label>
                <div className="flex items-center space-x-2 space-x-reverse">
                     <input
                        id="excel-upload"
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                </div>

                {file && <p className="mt-2 text-sm text-gray-600">فایل انتخاب شده: <span className="font-semibold">{file.name}</span></p>}

                <div className="mt-6">
                    <Button onClick={handleImport} isLoading={isLoading} disabled={!file}>
                        <ArrowUpTrayIcon className="w-5 h-5 ml-2" />
                        ایمپورت و جایگزینی لیست
                    </Button>
                </div>
            </div>
        </div>
    );
};

const ManageView: React.FC = () => {
    const { supervisors, executors, updateEngineer, addEngineer } = useAppContext();
    
    // States for Edit Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editFormData, setEditFormData] = useState({ fullName: '', email: '', phoneNumber: '', role: Role.Supervisor });

    // States for Add Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addFormData, setAddFormData] = useState({ id: '', fullName: '', email: '', phoneNumber: '', role: Role.Supervisor });

    // Edit Logic
    useEffect(() => {
        if (editingUser) {
            setEditFormData({
                fullName: editingUser.fullName || '',
                email: editingUser.email || '',
                phoneNumber: editingUser.phoneNumber || '',
                role: editingUser.role,
            });
        }
    }, [editingUser]);

    const handleOpenEditModal = (user: User) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingUser(null);
    };

    const handleEditFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            if (updateEngineer(editingUser.id, editFormData)) {
                handleCloseEditModal();
            }
        }
    };

    // Add Logic
    const handleOpenAddModal = () => {
        setAddFormData({ id: '', fullName: '', email: '', phoneNumber: '', role: Role.Supervisor });
        setIsAddModalOpen(true);
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
    };

    const handleAddFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setAddFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const newUser: User = {
            id: addFormData.id,
            fullName: addFormData.fullName,
            role: addFormData.role,
            phoneNumber: addFormData.phoneNumber,
            email: addFormData.email,
            password: '123' // Default password
        };
        
        if (addEngineer(newUser)) {
            handleCloseAddModal();
        }
    };

    const allEngineers = [...supervisors, ...executors].sort((a, b) => a.fullName.localeCompare(b.fullName, 'fa'));

    return (
        <div className="p-0 sm:p-6">
            <div className="flex justify-between items-center mb-4 px-4 sm:px-0">
                <h3 className="text-lg font-medium leading-6 text-gray-900">لیست مهندسین و مجریان</h3>
                <Button onClick={handleOpenAddModal} variant="primary" className="text-xs sm:text-sm">
                    <PlusCircleIcon className="w-4 h-4 ml-1" />
                    افزودن دستی
                </Button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نام و نام خانوادگی</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نقش</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ایمیل</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">شماره تلفن</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">ویرایش</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {allEngineers.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.fullName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phoneNumber || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleOpenEditModal(user)} className="text-emerald-600 hover:text-emerald-900 flex items-center">
                                        <PencilIcon className="w-4 h-4 ml-1" />
                                        ویرایش
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title={`ویرایش اطلاعات ${editingUser?.fullName}`}>
                <form onSubmit={handleSaveEdit} className="space-y-4">
                    <Input label="نام و نام خانوادگی" id="edit-fullName" name="fullName" value={editFormData.fullName} onChange={handleEditFormChange} required />
                    <Input label="ایمیل" id="edit-email" name="email" type="email" value={editFormData.email} onChange={handleEditFormChange} />
                    <Input label="شماره تلفن" id="edit-phoneNumber" name="phoneNumber" value={editFormData.phoneNumber} onChange={handleEditFormChange} placeholder="09xxxxxxxxx" />
                    <Select label="نقش" id="edit-role" name="role" value={editFormData.role} onChange={handleEditFormChange}>
                        <option value={Role.Supervisor}>ناظر</option>
                        <option value={Role.Executor}>مجری</option>
                    </Select>
                    <div className="pt-4 flex justify-end space-x-2 space-x-reverse">
                        <Button type="button" variant="secondary" onClick={handleCloseEditModal}>انصراف</Button>
                        <Button type="submit">ذخیره تغییرات</Button>
                    </div>
                </form>
            </Modal>

            {/* Add Modal */}
            <Modal isOpen={isAddModalOpen} onClose={handleCloseAddModal} title="افزودن مهندس جدید">
                <form onSubmit={handleSaveAdd} className="space-y-4">
                    <div className="bg-yellow-50 border-r-4 border-yellow-400 p-3 mb-2">
                        <p className="text-xs text-yellow-700">
                             رمز عبور پیش‌فرض برای کاربر جدید <strong>123</strong> خواهد بود.
                        </p>
                    </div>
                    <Input label="کد ملی (نام کاربری)" id="add-id" name="id" value={addFormData.id} onChange={handleAddFormChange} required placeholder="کد ملی 10 رقمی" />
                    <Input label="نام و نام خانوادگی" id="add-fullName" name="fullName" value={addFormData.fullName} onChange={handleAddFormChange} required />
                    <Input label="شماره تلفن" id="add-phoneNumber" name="phoneNumber" value={addFormData.phoneNumber} onChange={handleAddFormChange} placeholder="09xxxxxxxxx" />
                    <Input label="ایمیل (اختیاری)" id="add-email" name="email" type="email" value={addFormData.email} onChange={handleAddFormChange} />
                    <Select label="نقش" id="add-role" name="role" value={addFormData.role} onChange={handleAddFormChange}>
                        <option value={Role.Supervisor}>ناظر</option>
                        <option value={Role.Executor}>مجری</option>
                    </Select>
                    <div className="pt-4 flex justify-end space-x-2 space-x-reverse">
                        <Button type="button" variant="secondary" onClick={handleCloseAddModal}>انصراف</Button>
                        <Button type="submit">افزودن کاربر</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};


export const EngineerManagement: React.FC<EngineerManagementProps> = ({ onImportComplete }) => {
    const [activeTab, setActiveTab] = useState<'manage' | 'import'>('manage');

    return (
        <Card>
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-4 space-x-reverse px-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('manage')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'manage'
                                ? 'border-emerald-500 text-emerald-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        مدیریت مهندسین
                    </button>
                    <button
                        onClick={() => setActiveTab('import')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'import'
                                ? 'border-emerald-500 text-emerald-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        ایمپورت از اکسل
                    </button>
                </nav>
            </div>

            {activeTab === 'manage' ? <ManageView /> : <ImportView onImportComplete={onImportComplete} />}
        </Card>
    );
};
