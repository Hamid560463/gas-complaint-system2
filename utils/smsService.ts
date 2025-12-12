
import { supabase } from './supabaseClient';

export interface SmsResult {
    success: boolean;
    message: string;
}

/**
 * Sends SMS via Supabase Edge Function to keep API keys secure.
 */
export const sendKavehNegarSms = async (
    apiKey: string, 
    sender: string, 
    receptor: string, 
    message: string
): Promise<SmsResult> => {
    try {
        // Validation
        if (!receptor || !message) {
            return { success: false, message: 'شماره گیرنده یا متن پیام خالی است.' };
        }

        console.log(`[SMS Service] Invoking Edge Function for: ${receptor}`);

        const { data, error } = await supabase.functions.invoke('send-sms', {
            body: {
                apiKey,
                sender,
                receptor,
                message
            }
        });

        if (error) {
            console.error('❌ Edge Function Error:', error);
            return { success: false, message: 'خطا در ارتباط با سرور پیامک (Edge Function).' };
        }

        if (data && data.success) {
            console.log('✅ SMS Sent Successfully');
            return { success: true, message: 'پیامک با موفقیت ارسال شد.' };
        } else {
            const errorMsg = data?.message || 'خطای ناشناخته از سمت سرور';
            console.error('❌ SMS Failed:', errorMsg);
            return { success: false, message: errorMsg };
        }

    } catch (error) {
        console.error('❌ SMS Service System Error:', error);
        return { success: false, message: 'خطای سیستمی در ارسال درخواست.' };
    }
};
