import { Link } from "react-router-dom";
import { Card } from "react-bootstrap";

export default function InicioDashboard() {
  const panels = [
    { path: "/dashboard/users", label: "Usuarios", icon: "bi-people", color: "primary" },
    { path: "/dashboard/clientes", label: "Clientes", icon: "bi-box-seam", color: "success" },
    { path: "/dashboard/materiales", label: "Materiales", icon: "bi-layers", color: "info" },
    { path: "/dashboard/servicios", label: "Servicios", icon: "bi-gear", color: "warning" },
    { path: "/dashboard/productos", label: "Productos", icon: "bi-box", color: "secondary" },
    { path: "/dashboard/cotizaciones", label: "Pedidos", icon: "bi-file-earmark-text", color: "dark" },
  ];

  return (
    <div>
      <h3 className="mb-4">Panel Principal</h3>
      <div className="row">
        {panels.map((panel, idx) => (
          <div className="col-md-4 mb-4" key={idx}>
            <Link to={panel.path} style={{ textDecoration: "none" }}>
              <Card className={`text-white bg-${panel.color} shadow-sm`} style={{ cursor: "pointer" }}>
                <Card.Body className="d-flex align-items-center justify-content-between">
                  <div>
                    <Card.Title>{panel.label}</Card.Title>
                  </div>
                  <i className={`bi ${panel.icon}`} style={{ fontSize: "2rem" }}></i>
                </Card.Body>
              </Card>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
