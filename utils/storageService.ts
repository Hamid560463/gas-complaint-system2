
import { supabase } from './supabaseClient';
import { Attachment } from '../types';

/**
 * Uploads a file to Supabase Storage bucket named 'attachments'.
 * Returns the Attachment object with the public URL.
 */
export const uploadFile = async (file: File): Promise<Attachment | null> => {
    try {
        // Create a unique file path: timestamp_random_filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
            .from('attachments')
            .upload(filePath, file);

        if (error) {
            console.error('Error uploading file:', error);
            return null;
        }

        // Get Public URL
        const { data: publicUrlData } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath);

        return {
            id: fileName,
            name: file.name,
            url: publicUrlData.publicUrl
        };
    } catch (e) {
        console.error('Unexpected error during upload:', e);
        return null;
    }
};
