import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import UsersAdmin from "../pages/UsersAdmin";
import InicioDashboard from "../pages/InicioDashboard";
import PrivateRoute from "./PrivateRoute";
import Clients from "../pages/ClientsAdmin";
import MaterialsAdmin from "../pages/MaterialsAdmin";
import ServicesAdmin from "../pages/ServicesAdmin";
import ProductsAdmin from "../pages/ProductsAdmin";
import QuoteAdmin from "../pages/QuoteAdmin";
import PaymentsAdmin from "../pages/PaymentsAdmin"; // ✅ Asegurar esta importación

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        >
          <Route index element={<InicioDashboard />} />
          <Route path="users" element={<UsersAdmin />} />
          <Route path="clientes" element={<Clients />} />
          <Route path="materiales" element={<MaterialsAdmin />} />
          <Route path="servicios" element={<ServicesAdmin />} />
          <Route path="productos" element={<ProductsAdmin />} />
          <Route path="cotizaciones" element={<QuoteAdmin />} />
          <Route path="payments-admin" element={<PaymentsAdmin />} /> {/* ✅ Verificar esta ruta */}
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
