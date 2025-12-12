import React, { useState, ChangeEvent } from 'react';
import { DocumentIcon, PhotoIcon, XMarkIcon } from '../Icons';

interface FileUploadProps {
    onFilesChange: (files: File[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesChange }) => {
    const [files, setFiles] = useState<File[]>([]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const allFiles = [...files, ...Array.from(e.target.files)];
            setFiles(allFiles);
            onFilesChange(allFiles);
             e.target.value = '';
        }
    };

    const removeFile = (fileName: string) => {
        const updatedFiles = files.filter(file => file.name !== fileName);
        setFiles(updatedFiles);
        onFilesChange(updatedFiles);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ضمیمه کردن فایل (عکس و داکیومنت)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>فایل‌های خود را آپلود کنید</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
                        </label>
                        <p className="pr-1">یا در اینجا بکشید و رها کنید</p>
                    </div>
                    <p className="text-xs text-gray-500">JPG, PNG, PDF, up to 10MB</p>
                </div>
            </div>
            {files.length > 0 && (
                <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">فایل‌های انتخاب شده:</h4>
                    <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                        {files.map(file => (
                            <li key={file.name} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                <div className="w-0 flex-1 flex items-center">
                                    {file.type.startsWith('image/') ? <PhotoIcon className="flex-shrink-0 h-5 w-5 text-gray-400" /> : <DocumentIcon className="flex-shrink-0 h-5 w-5 text-gray-400" />}
                                    <span className="mr-2 flex-1 w-0 truncate">{file.name}</span>
                                </div>
                                <div className="ml-4 flex-shrink-0">
                                    <button type="button" onClick={() => removeFile(file.name)} className="font-medium text-red-600 hover:text-red-500">
                                        <XMarkIcon className="h-5 w-5"/>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};