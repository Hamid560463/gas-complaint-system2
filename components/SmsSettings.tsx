
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { Input, Textarea } from './common/Input';
import { ChatBubbleBottomCenterTextIcon, PaperAirplaneIcon, PencilIcon } from './Icons';
import { sendKavehNegarSms } from '../utils/smsService';
import { SmsTemplates } from '../types';

export const SmsSettings: React.FC = () => {
    const { smsSettings, updateSmsSettings, addNotification } = useAppContext();
    const [apiKey, setApiKey] = useState('');
    const [lineNumber, setLineNumber] = useState('');
    const [isEnabled, setIsEnabled] = useState(false);
    const [templates, setTemplates] = useState<SmsTemplates>({
        newComplaint: '',
        referralToEngineer: '',
        referralNotification: '',
        defectReturn: '',
        finalVerdict: ''
    });
    const [isSaved, setIsSaved] = useState(false);

    // Test SMS State
    const [testPhoneNumber, setTestPhoneNumber] = useState('');
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        if (smsSettings) {
            setApiKey(smsSettings.apiKey);
            setLineNumber(smsSettings.lineNumber);
            setIsEnabled(smsSettings.isEnabled);
            if (smsSettings.templates) {
                setTemplates(smsSettings.templates);
            }
        }
    }, [smsSettings]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateSmsSettings({
            apiKey,
            lineNumber,
            isEnabled,
            templates
        });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    const handleTemplateChange = (key: keyof SmsTemplates, value: string) => {
        setTemplates(prev => ({ ...prev, [key]: value }));
    };

    const handleTestSms = async () => {
        if (!apiKey || !lineNumber) {
            addNotification('لطفاً ابتدا کلید API و شماره خط را وارد کنید.', 'error');
            return;
        }
        if (!testPhoneNumber) {
             addNotification('لطفاً شماره موبایل گیرنده تست را وارد کنید.', 'error');
             return;
        }
        
        setIsTesting(true);
        const result = await sendKavehNegarSms(apiKey, lineNumber, testPhoneNumber, 'این یک پیام آزمایشی از سامانه شکایات است.');
        setIsTesting(false);

        if (result.success) {
            addNotification('پیامک آزمایشی با موفقیت ارسال شد.', 'success');
        } else {
            addNotification(`ارسال ناموفق: ${result.message}`, 'error');
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <div className="border-b border-gray-200 px-6 py-4 flex items-center">
                    <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-emerald-600 ml-2" />
                    <h2 className="text-lg font-semibold text-gray-800">تنظیمات درگاه پیامکی</h2>
                </div>
                <div className="p-6">
                    <div className="mb-6 bg-blue-50 border-r-4 border-blue-400 p-4">
                        <p className="text-sm text-blue-700">
                            در این بخش می‌توانید اطلاعات اتصال به پنل پیامکی (مانند IPPanel یا KavehNegar) را وارد کنید. با فعال‌سازی این بخش، پیامک‌های اطلاع‌رسانی برای ثبت شکایت، ارجاع و صدور رای نهایی به صورت خودکار ارسال خواهند شد.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
                        <div className="flex items-center mb-4">
                            <input
                                id="sms-enabled"
                                type="checkbox"
                                checked={isEnabled}
                                onChange={(e) => setIsEnabled(e.target.checked)}
                                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded ml-2"
                            />
                            <label htmlFor="sms-enabled" className="text-sm font-medium text-gray-700">
                                فعال‌سازی ارسال پیامک
                            </label>
                        </div>

                        <Input 
                            label="کلید دسترسی (API Key)"
                            id="apiKey"
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="کلید API دریافتی از پنل پیامکی"
                            disabled={!isEnabled}
                        />
                        
                        <Input 
                            label="شماره خط فرستنده"
                            id="lineNumber"
                            type="text"
                            value={lineNumber}
                            onChange={(e) => setLineNumber(e.target.value)}
                            placeholder="مثال: 3000xxxx"
                            disabled={!isEnabled}
                        />

                        {/* Test Connection Section */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                                <PaperAirplaneIcon className="h-5 w-5 ml-2 text-gray-500" />
                                تست اتصال و ارسال پیامک
                            </h3>
                            <div className="flex flex-col sm:flex-row gap-3 items-end">
                                <div className="flex-1 w-full">
                                    <Input 
                                        label="شماره موبایل گیرنده تست"
                                        id="testPhone"
                                        type="text"
                                        value={testPhoneNumber}
                                        onChange={(e) => setTestPhoneNumber(e.target.value)}
                                        placeholder="09xxxxxxxxx"
                                        disabled={!isEnabled}
                                    />
                                </div>
                                <div className="w-full sm:w-auto">
                                    <Button 
                                        type="button" 
                                        variant="secondary" 
                                        onClick={handleTestSms} 
                                        isLoading={isTesting}
                                        disabled={!isEnabled}
                                        className="w-full"
                                    >
                                        ارسال پیامک آزمایشی
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="text-left pt-4 flex items-center justify-end gap-2">
                            {isSaved && <span className="text-sm text-green-600 font-medium">ذخیره شد!</span>}
                            <Button type="submit">ذخیره تنظیمات</Button>
                        </div>
                    </form>
                </div>
            </Card>

            <Card>
                <div className="border-b border-gray-200 px-6 py-4 flex items-center">
                    <PencilIcon className="h-6 w-6 text-emerald-600 ml-2" />
                    <h2 className="text-lg font-semibold text-gray-800">مدیریت قالب‌های پیامک</h2>
                </div>
                <div className="p-6">
                    <div className="mb-6 bg-yellow-50 border-r-4 border-yellow-400 p-4">
                        <p className="text-sm text-yellow-700">
                            در متن‌های زیر می‌توانید از متغیرهای <strong>{'{id}'}</strong> (کد رهگیری شکایت) و <strong>{'{target}'}</strong> (نام نقش: ناظر/مجری) استفاده کنید. این متغیرها هنگام ارسال به صورت خودکار با مقادیر واقعی جایگزین می‌شوند.
                        </p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1">
                                <Textarea 
                                    label="ثبت شکایت جدید (به شاکی)"
                                    id="tpl-newComplaint"
                                    value={templates.newComplaint}
                                    onChange={(e) => handleTemplateChange('newComplaint', e.target.value)}
                                    rows={3}
                                />
                                <p className="text-xs text-gray-500 mt-1">مثال: شکایت شما با کد {`{id}`} ثبت شد.</p>
                            </div>

                            <div className="col-span-1">
                                <Textarea 
                                    label="ارجاع به مهندس (به ناظر/مجری)"
                                    id="tpl-referralToEngineer"
                                    value={templates.referralToEngineer}
                                    onChange={(e) => handleTemplateChange('referralToEngineer', e.target.value)}
                                    rows={3}
                                />
                                <p className="text-xs text-gray-500 mt-1">مثال: پرونده {`{id}`} به کارتابل شما ارجاع شد.</p>
                            </div>

                            <div className="col-span-1">
                                <Textarea 
                                    label="اطلاع‌رسانی ارجاع (به شاکی)"
                                    id="tpl-referralNotification"
                                    value={templates.referralNotification}
                                    onChange={(e) => handleTemplateChange('referralNotification', e.target.value)}
                                    rows={3}
                                />
                                <p className="text-xs text-gray-500 mt-1">مثال: شکایت {`{id}`} جهت بررسی به {`{target}`} ارجاع گردید.</p>
                            </div>

                            <div className="col-span-1">
                                <Textarea 
                                    label="اعلام نقص مدارک (به کاربر)"
                                    id="tpl-defectReturn"
                                    value={templates.defectReturn}
                                    onChange={(e) => handleTemplateChange('defectReturn', e.target.value)}
                                    rows={3}
                                />
                                <p className="text-xs text-gray-500 mt-1">مثال: پرونده {`{id}`} دارای نقص مدارک است.</p>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <Textarea 
                                    label="صدور رای نهایی (به شاکی)"
                                    id="tpl-finalVerdict"
                                    value={templates.finalVerdict}
                                    onChange={(e) => handleTemplateChange('finalVerdict', e.target.value)}
                                    rows={3}
                                />
                                <p className="text-xs text-gray-500 mt-1">مثال: رای نهایی پرونده {`{id}`} صادر شد.</p>
                            </div>
                        </div>

                        <div className="text-left pt-4 flex items-center justify-end gap-2">
                            {isSaved && <span className="text-sm text-green-600 font-medium">ذخیره شد!</span>}
                            <Button type="submit">ذخیره قالب‌ها</Button>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    );
};
