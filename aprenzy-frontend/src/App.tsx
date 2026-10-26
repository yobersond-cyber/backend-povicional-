import Login from "./pages/Login";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

import AdminLayout from "./layouts/AdminLayout";
import DocenteLayout from "./layouts/DocenteLayout";
import EstudianteLayout from "./layouts/EstudianteLayout";

function AppContent() {
  const {
    token,
    usuario,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-card">
          <div className="app-loading-logo">
            A
          </div>

          <h2>
            Cargando Aprenzy...
          </h2>

          <p>
            Verificando tu sesión.
          </p>
        </div>
      </div>
    );
  }

  if (!token || !usuario) {
    return <Login />;
  }

  const rol =
    usuario.tipo_de_usuario
      ?.trim()
      .toLowerCase();

  if (rol === "administrador") {
    return <AdminLayout />;
  }

  if (rol === "docente") {
    return <DocenteLayout />;
  }

  if (rol === "estudiante") {
    return <EstudianteLayout />;
  }

  return (
    <div className="app-error">
      <h1>
        Rol no reconocido
      </h1>

      <p>
        El usuario tiene un tipo
        de usuario que Aprenzy no
        reconoce.
      </p>

      <p>
        Rol recibido:{" "}
        <strong>
          {usuario.tipo_de_usuario}
        </strong>
      </p>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;