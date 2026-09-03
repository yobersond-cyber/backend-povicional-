// Importa las herramientas necesarias de React
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// Importa las funciones de autenticación
import {
  login as loginService,
  logout as logoutService,
} from "../services/auth";

// Importa la función para obtener el usuario autenticado
import {
  obtenerUsuario,
  type Usuario,
} from "../services/usuario";

// Define los datos disponibles en el contexto
interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  loading: boolean;
  login: (
    correo: string,
    contrasena: string,
  ) => Promise<void>;
  logout: () => void;
}

// Crea el contexto de autenticación
const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

// Proporciona la sesión al resto de la aplicación
export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Recupera el token guardado en el navegador
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );

  // Guarda la información del usuario actual
  const [usuario, setUsuario] =
    useState<Usuario | null>(null);

  // Controla si estamos recuperando la sesión
  const [loading, setLoading] = useState(true);

  // Recupera el usuario cuando existe una sesión guardada
  useEffect(() => {
    // Comprueba si existe un token
    if (!token) {
      setLoading(false);
      return;
    }

    // Obtiene los datos del usuario autenticado
    obtenerUsuario()
      .then((usuarioActual) => {
        // Guarda el usuario obtenido
        setUsuario(usuarioActual);
      })
      .catch(() => {
        // Cierra la sesión si el token no es válido
        logoutService();

        // Limpia el token de React
        setToken(null);

        // Limpia el usuario actual
        setUsuario(null);
      })
      .finally(() => {
        // Finaliza la carga de la sesión
        setLoading(false);
      });
  }, [token]);

  // Realiza el inicio de sesión
  const login = async (
    correo: string,
    contrasena: string,
  ) => {
    // Envía las credenciales al backend
    const respuesta = await loginService({
      correo,
      contrasena,
    });

    // Guarda el JWT en React
    setToken(respuesta.access_token);

    // Guarda el JWT en el navegador
    localStorage.setItem(
      "token",
      respuesta.access_token,
    );

    // Obtiene los datos completos del usuario
    const usuarioActual = await obtenerUsuario();

    // Guarda el usuario autenticado
    setUsuario(usuarioActual);
  };

  // Cierra la sesión actual
  const logout = () => {
    // Elimina los datos guardados de autenticación
    logoutService();

    // Limpia el usuario de React
    setUsuario(null);

    // Limpia el token de React
    setToken(null);
  };

  // Comparte la autenticación con toda la aplicación
  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Permite acceder al contexto desde otros componentes
export function useAuth() {
  // Obtiene el contexto de autenticación
  const context = useContext(AuthContext);

  // Comprueba que exista el proveedor
  if (!context) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider",
    );
  }

  // Devuelve los datos de autenticación
  return context;
}