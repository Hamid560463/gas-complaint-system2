
import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { Notification } from './components/common/Notification';

const AppContent: React.FC = () => {
    const { user } = useAppContext();

    return (
        <div>
            <main>
                {user ? <Dashboard /> : <Auth />}
            </main>
            <Notification />
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

export default App;