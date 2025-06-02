import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ScanReceiptPage from './pages/ScanReceiptPage';
import ManualEntryPage from './pages/ManualEntryPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <>
                    <Navbar />
                    <HomePage />
                  </>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/scan" 
              element={
                <PrivateRoute>
                  <>
                    <Navbar />
                    <ScanReceiptPage />
                  </>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/manual-entry" 
              element={
                <PrivateRoute>
                  <>
                    <Navbar />
                    <ManualEntryPage />
                  </>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/reports"
              element={
                <PrivateRoute>
                  <>
                    <Navbar />
                    <ReportsPage />
                  </>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/settings"
              element={
                <PrivateRoute>
                  <>
                    <Navbar />
                    <SettingsPage />
                  </>
                </PrivateRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
