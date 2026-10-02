import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LoginPage } from './components/LoginPage';
import { AuthPayload } from './components/LoginForm';
import GradientMenu from './components/GradientMenu';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userRole, setUserRole] = useState<'student' | 'teacher'>('student');
  const [userName, setUserName] = useState<string>('Nikhil Yadav');

  const handleLoginSuccess = (auth: AuthPayload) => {
    setUserEmail(auth.email);
    setUserRole(auth.role);
    setUserName(auth.name);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AnimatePresence mode="wait">
      {!isAuthenticated ? (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full min-h-screen"
        >
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        </motion.div>
      ) : (
        <motion.div
          key={`portal-${userRole}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full min-h-screen"
        >
          <GradientMenu
            userEmail={userEmail}
            userRole={userRole}
            userName={userName}
            onLogout={handleLogout}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;

