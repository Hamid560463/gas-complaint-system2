
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from '../Icons';

export const Notification: React.FC = () => {
    const { notifications, removeNotification } = useAppContext();

    if (notifications.length === 0) {
        return null;
    }

    const icons = {
        success: <CheckCircleIcon className="h-8 w-8 text-green-500" />,
        error: <XCircleIcon className="h-8 w-8 text-red-500" />,
        info: <InformationCircleIcon className="h-8 w-8 text-blue-500" />,
    };

    return (
        <div className="fixed bottom-0 right-0 p-6 space-y-4 z-50 w-full md:w-auto flex flex-col items-end">
            {notifications.map(notification => (
                <div key={notification.id} className="w-full md:w-[28rem] bg-white shadow-2xl rounded-xl pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border border-gray-100">
                    <div className="p-5">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 ml-4">
                                {icons[notification.type]}
                            </div>
                            <div className="w-0 flex-1 pt-1">
                                <p className="text-base font-semibold text-gray-800 leading-relaxed">
                                    {notification.message}
                                </p>
                            </div>
                            <div className="mr-4 flex-shrink-0 flex">
                                <button
                                    onClick={() => removeNotification(notification.id)}
                                    className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                                >
                                    <span className="sr-only">بستن</span>
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
