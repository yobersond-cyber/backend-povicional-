
import {
  BrowserRouter,
  Navigate,
  useLocation,
} from "react-router-dom";

import Login from "./pages/Login";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

import AdminLayout from "./layouts/AdminLayout";
import RectorLayout from "./components/layout/RectorLayout";
import CoordinadorLayout from "./layouts/CoordinadorLayout";
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

  // Si no existe una sesión válida, mostrar el login.
  if (!token || !usuario) {
    return <Login />;
  }

  // Normalizar el rol recibido desde el backend.
  const rol = usuario.tipo_de_usuario
    ?.trim()
    .toLowerCase();

  // Ruta principal correspondiente a cada rol.
  const rutasPorRol: Record<string, string> = {
    administrador: "/administrador",
    rector: "/rector",
    coordinador: "/coordinador",
    docente: "/docente",
    estudiante: "/estudiante",
  };

  const rutaBase = rol
    ? rutasPorRol[rol]
    : undefined;

  // Evitar el acceso cuando el rol no está reconocido.
  if (!rutaBase) {
    return (
      <div className="app-error">
        <h1>Rol no reconocido</h1>
        <p>
          No se reconoce el rol de este usuario:{" "}
          {usuario.tipo_de_usuario ?? "Sin rol"}
        </p>
      </div>
    );
  }

  // Normalizar la ruta actual.
  const rutaActual =
    location.pathname.replace(/\/+$/, "") || "/";

  // Comprobar que la ruta corresponda al rol autenticado.
  const perteneceAlRol =
    rutaActual === rutaBase ||
    rutaActual.startsWith(`${rutaBase}/`);

  // Si intenta entrar a otro módulo, regresar a su panel.
  if (!perteneceAlRol) {
    return <Navigate to={rutaBase} replace />;
  }

  // Mostrar el panel correspondiente al usuario.
  switch (rol) {
    case "administrador":
      return <AdminLayout />;

    case "rector":
      return <RectorLayout />;

    case "coordinador":
      return <CoordinadorLayout />;

    case "docente":
      return <DocenteLayout />;

    case "estudiante":
      return <EstudianteLayout />;

    default:
      return <Navigate to={rutaBase} replace />;
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
