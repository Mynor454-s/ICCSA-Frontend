import { useAuth } from "../auth/AuthProvider";
import { Outlet } from "react-router-dom";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="d-flex vh-100">
      {/* Sidebar: solo datos del usuario */}
      <aside
        className="bg-dark text-white p-4 d-flex flex-column justify-content-between"
        style={{ width: "260px" }}
      >
        <div>
          {/* Título */}
          <div className="text-center mb-4">
            <i className="bi bi-stack" style={{ fontSize: "2rem" }}></i>
            <h5 className="mt-2 mb-0">Pedidos</h5>
          </div>

          {/* Info del usuario */}
          <div className="bg-secondary bg-opacity-25 rounded p-3 text-center">
            <i
              className="bi bi-person-circle mb-3"
              style={{ fontSize: "3rem", color: "#0d6efd" }}
            ></i>
            <h6 className="mb-1">{user?.name}</h6>
            <small className="d-block text-white-50">{user?.email}</small>
            <span className="badge bg-primary mt-2">{user?.role}</span>
          </div>
        </div>

        {/* Botón de Logout */}
        <div className="mt-3">
          <button
            className="btn btn-outline-light w-100"
            onClick={logout}
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Cerrar sesión
          </button>
        </div>

        {/* Footer */}
        <div className="text-center small text-white-50 mt-4">
          <hr className="border-secondary" />
          <div>
            <i className="bi bi-shield-lock-fill me-1"></i>
            Sesión segura
          </div>
          <div className="mt-1">© 2025 ICCSA</div>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-grow-1 p-4 bg-light overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
