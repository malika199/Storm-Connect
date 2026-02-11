import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Home
import Home from './pages/Home';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import RegisterParent from './pages/auth/RegisterParent';

// User Space
import UserDashboard from './pages/user/Dashboard';
import UserProfile from './pages/user/Profile';
import UserMessages from './pages/user/Messages';
import UserMatch from './pages/user/Match';
import UserConversations from './pages/user/Conversations';
import UserNotifications from './pages/user/Notifications';
import BlockedUsers from './pages/user/BlockedUsers';
import ViewProfile from './pages/user/ViewProfile';

// Guardian Space
import GuardianDashboard from './pages/guardian/Dashboard';
import GuardianDiscussions from './pages/guardian/Discussions';

// Components
import PrivateRoute from './components/PrivateRoute';
import UserLayout from './components/UserLayout';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/register-parent" element={<RegisterParent />} />
            
            {/* User Routes (layout avec barre de filtres sur toutes les pages) */}
            <Route path="/user" element={<PrivateRoute><UserLayout /></PrivateRoute>}>
              <Route index element={<UserDashboard />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="messages" element={<UserMessages />} />
              <Route path="match" element={<UserMatch />} />
              <Route path="conversations" element={<UserConversations />} />
              <Route path="notifications" element={<UserNotifications />} />
              <Route path="blocked" element={<BlockedUsers />} />
              <Route path="profiles/:userId" element={<ViewProfile />} />
            </Route>
            
            {/* Guardian Routes */}
            <Route path="/guardian" element={<PrivateRoute><GuardianDashboard /></PrivateRoute>} />
            <Route path="/guardian/discussions" element={<PrivateRoute><GuardianDiscussions /></PrivateRoute>} />
            
            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss={false}
            draggable
            pauseOnHover={false}
            enableMultiContainer={false}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
