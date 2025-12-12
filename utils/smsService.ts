
export interface KavehNegarResponse {
    return: {
        status: number;
        message: string;
    };
    entries: any[];
}

export interface SmsResult {
    success: boolean;
    message: string;
}

export const sendKavehNegarSms = async (
    apiKey: string, 
    sender: string, 
    receptor: string, 
    message: string
): Promise<SmsResult> => {
    try {
        // Validation
        if (!apiKey || !sender || !receptor || !message) {
            console.warn('SMS Service: Missing required parameters');
            return { success: false, message: 'پارامترهای ورودی (کلید API، فرستنده یا گیرنده) ناقص هستند.' };
        }

        console.log(`[SMS Service] Attempting to send SMS via KavehNegar to ${receptor}...`);

        const encodedMessage = encodeURIComponent(message);
        
        // --- CORS FIX ---
        // Browsers block direct requests to KavehNegar due to CORS policy.
        // We use 'corsproxy.io' to bypass this restriction for client-side apps.
        // In a real production environment, you should use your own backend server.
        
        const targetUrl = `https://api.kavenegar.com/v1/${apiKey}/sms/send.json?receptor=${receptor}&sender=${sender}&message=${encodedMessage}`;
        
        // We wrap the target URL with a CORS proxy
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

        const response = await fetch(proxyUrl);
        
        // Check if response is ok
        if (!response.ok) {
             console.error('❌ Network Error:', response.statusText);
             return { success: false, message: `خطای شبکه: ${response.statusText}` };
        }

        const data: KavehNegarResponse = await response.json();

        if (data.return && data.return.status === 200) {
            console.log('✅ SMS Sent Successfully:', data);
            return { success: true, message: 'پیامک با موفقیت ارسال شد.' };
        } else {
            const errorMsg = data.return ? `${data.return.message} (کد: ${data.return.status})` : 'خطای ناشناخته از سمت پنل پیامک';
            console.error('❌ KavehNegar API Error:', errorMsg);
            return { success: false, message: errorMsg };
        }
    } catch (error) {
        console.error('❌ SMS Service Error:', error);
        return { success: false, message: 'خطای سیستمی در ارسال درخواست.' };
    }
};
