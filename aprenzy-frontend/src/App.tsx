
import { BrowserRouter, Navigate, useLocation } from "react-router-dom";

import Login from "./pages/Login";
import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

import AdminLayout from "./layouts/AdminLayout";
import DocenteLayout from "./layouts/DocenteLayout";
import EstudianteLayout from "./layouts/EstudianteLayout";

function AppContent() {
  const { token, usuario, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-card">
          <div className="app-loading-logo">A</div>
          <h2>Cargando Aprenzy...</h2>
          <p>Verificando tu sesión.</p>
        </div>
      </div>
    );
  }

  if (!token || !usuario) {
    return <Login />;
  }

  const rol = usuario.tipo_de_usuario
    ?.trim()
    .toLowerCase();

  const rutasPorRol: Record<string, string> = {
    administrador: "/administrador",
    docente: "/docente",
    estudiante: "/estudiante",
  };

  const rutaBase = rutasPorRol[rol];

  if (!rutaBase) {
    return (
      <div className="app-error">
        <h1>Rol no reconocido</h1>
        <p>
          No se reconoce el rol de este usuario:
          {" "}
          {usuario.tipo_de_usuario ?? "Sin rol"}
        </p>
      </div>
    );
  }

  const rutaActual = location.pathname.replace(/\/+$/, "") || "/";

  const perteneceAlRol =
    rutaActual === rutaBase ||
    rutaActual.startsWith(`${rutaBase}/`);

  if (!perteneceAlRol) {
    return <Navigate to={rutaBase} replace />;
  }

  switch (rol) {
    case "administrador":
      return <AdminLayout />;

    case "docente":
      return <DocenteLayout />;

    case "estudiante":
      return <EstudianteLayout />;

    default:
      return <Navigate to="/" replace />;
  }
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
