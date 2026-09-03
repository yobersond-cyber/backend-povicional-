import Login from "./pages/Login";
import Dashboard from "./pages/dashboard";

// Importa el contexto de autenticación
import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

// Decide qué pantalla mostrar
function AppContent() {
  // Obtiene la información de la sesión
  const { token } = useAuth();

  // Muestra el dashboard si existe un token
  if (token) {
    return <Dashboard />;
  }

  // Muestra el login si no existe una sesión
  return <Login />;
}

// Componente principal de la aplicación
function App() {
  // Proporciona la autenticación a toda la aplicación
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// Exporta la aplicación
export default App;