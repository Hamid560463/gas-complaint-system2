import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
    return (
        <div className={`bg-white overflow-hidden shadow rounded-lg border border-gray-200 ${className}`}>
            {title && (
                <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
                </div>
            )}
            <div className={title ? "px-4 py-5 sm:p-6" : ""}>
                {children}
            </div>
        </div>
    );
};