import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from '../Icons';

export const Notification: React.FC = () => {
    const { notifications, removeNotification } = useAppContext();

    if (notifications.length === 0) {
        return null;
    }

    const icons = {
        success: <CheckCircleIcon className="h-6 w-6 text-green-400" />,
        error: <XCircleIcon className="h-6 w-6 text-red-400" />,
        info: <InformationCircleIcon className="h-6 w-6 text-blue-400" />,
    };

    return (
        <div className="fixed bottom-0 right-0 p-4 space-y-4 z-50">
            {notifications.map(notification => (
                <div key={notification.id} className="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
                    <div className="p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                {icons[notification.type]}
                            </div>
                            <div className="mr-3 w-0 flex-1 pt-0.5">
                                <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                            </div>
                            <div className="mr-4 flex-shrink-0 flex">
                                <button
                                    onClick={() => removeNotification(notification.id)}
                                    className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <span className="sr-only">Close</span>
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};