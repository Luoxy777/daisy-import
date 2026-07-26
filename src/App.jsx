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
import Profile from './pages/Profile';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import AdminRoute from './components/AdminRoute';

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
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsConditions />} />

          {/* Admin Routes - Hanya admin! */}
          <Route path="/admin" element={<AdminRoute><Navigate to="/admin/products" replace /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><AdminProductList /></AdminRoute>} />
          <Route path="/admin/add" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/admin/edit/:id" element={<AdminRoute><AdminEditProduct /></AdminRoute>} />
        </Routes>
      </div>
    </div>
  );
}

export default App;