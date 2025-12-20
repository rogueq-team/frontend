import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import About from './components/About';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Contacts from './components/Contacts';
import Applications from './components/Applications';
import CreateApplication from './components/CreateApplication';
import DealChat from './components/DealChat';
import AddFunds from './components/AddFunds';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function AppContent() {
  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<About />} />
          <Route path="/about" element={<About />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/applications" element={<Applications/>}/>
          <Route path="/applications/create" element={<CreateApplication />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={ <Settings />} />
          <Route path="/deal/:dealId" element={<DealChat />} />
          <Route path="/add-funds" element={<AddFunds />} />

        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;