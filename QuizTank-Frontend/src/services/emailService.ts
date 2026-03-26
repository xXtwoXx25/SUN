import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const CONTACT_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_CONTACT_TEMPLATE_ID || TEMPLATE_ID;

export const emailService = {
    sendVerificationEmail: async (toEmail: string, otp: string, userName: string) => {
        if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY || SERVICE_ID === 'your_service_id') {
            console.warn('EmailJS credentials (SERVICE_ID/TEMPLATE_ID/PUBLIC_KEY) not configured.');
            return;
        }

        try {
            const templateParams = {
                to_email: toEmail,
                username: userName,
                otp_code: otp,
            };

            const response = await emailjs.send(
                SERVICE_ID,
                TEMPLATE_ID,
                templateParams,
                PUBLIC_KEY
            );

            return response;
        } catch (error) {
            console.error('EmailJS [Verification] Error:', error);
            throw error;
        }
    },

    sendContactEmail: async (fromName: string, fromEmail: string, subject: string, message: string) => {
        if (!SERVICE_ID || !CONTACT_TEMPLATE_ID || !PUBLIC_KEY || SERVICE_ID === 'your_service_id') {
            console.warn('EmailJS credentials (SERVICE_ID/CONTACT_TEMPLATE_ID/PUBLIC_KEY) not configured.');
            return;
        }

        try {
            const templateParams = {
                from_name: fromName,
                from_email: fromEmail,
                subject: subject,
                message: message,
            };

            const response = await emailjs.send(
                SERVICE_ID,
                CONTACT_TEMPLATE_ID,
                templateParams,
                PUBLIC_KEY
            );

            return response;
        } catch (error) {
            console.error('EmailJS [Contact] Error:', error);
            throw error;
        }
    }
};
