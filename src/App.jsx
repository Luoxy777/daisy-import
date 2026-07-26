// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Admin from './pages/Admin';
import AdminProductList from './pages/AdminProductList';
import AdminEditProduct from './pages/AdminEditProduct';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';

function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-16">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/profile" element={<Profile />} />

          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          {/* Protected Routes (Admin) */}
          <Route path="/admin" element={
            <ProtectedRoute><Navigate to="/admin/products" replace /></ProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <ProtectedRoute><AdminProductList /></ProtectedRoute>
          } />
          <Route path="/admin/add" element={
            <ProtectedRoute><Admin /></ProtectedRoute>
          } />
          <Route path="/admin/edit/:id" element={
            <ProtectedRoute><AdminEditProduct /></ProtectedRoute>
          } />
        </Routes>
      </div>
    </div>
  );
}

export default App;