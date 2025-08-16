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
          {/* Aquí se carga el panel principal */}
          <Route index element={<InicioDashboard />} />
          <Route path="users" element={<UsersAdmin />} />
          <Route path="clientes" element={<Clients />} />
          <Route path="materiales" element={<MaterialsAdmin />} />
          <Route path="servicios" element={<ServicesAdmin />} />
          <Route path="productos" element={<ProductsAdmin />} />
          <Route path="cotizaciones" element={<QuoteAdmin />} />
          {/* más rutas hijas aquí */}
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
