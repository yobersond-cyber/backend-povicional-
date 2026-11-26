
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  login as loginService,
  logout as logoutService,
} from "../services/auth";

import {
  obtenerUsuario,
  type Usuario,
} from "../services/usuario";

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

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [token, setToken] = useState<string | null>(null);

  const [usuario, setUsuario] =
    useState<Usuario | null>(null);

  const [loading, setLoading] = useState(true);

  // Recuperar y validar la sesión existente.
  useEffect(() => {
    let activo = true;

    const recuperarSesion = async () => {
      const tokenGuardado = localStorage.getItem("token");

      if (!tokenGuardado) {
        if (activo) {
          setToken(null);
          setUsuario(null);
          setLoading(false);
        }
        return;
      }

      try {
        const usuarioActual = await obtenerUsuario();

        if (!usuarioActual?.id_usuario ||
            !usuarioActual?.tipo_de_usuario) {
          throw new Error("Los datos del usuario no son válidos.");
        }

        if (!activo) return;

        localStorage.setItem(
          "rol",
          usuarioActual.tipo_de_usuario,
        );

        setToken(tokenGuardado);
        setUsuario(usuarioActual);
      } catch {
        logoutService();

        if (!activo) return;

        setToken(null);
        setUsuario(null);
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    };

    recuperarSesion();

    return () => {
      activo = false;
    };
  }, []);

  // Iniciar sesión y validar los datos del usuario.
  const login = async (
    correo: string,
    contrasena: string,
  ) => {
    setLoading(true);

    try {
      const respuesta = await loginService({
        correo,
        contrasena,
      });

      if (!respuesta.access_token) {
        throw new Error(
          "El servidor no devolvió un token de acceso.",
        );
      }

      localStorage.setItem(
        "token",
        respuesta.access_token,
      );

      const usuarioActual = await obtenerUsuario();

      if (
        !usuarioActual?.id_usuario ||
        !usuarioActual?.tipo_de_usuario
      ) {
        throw new Error(
          "No fue posible validar los datos del usuario.",
        );
      }

      if (
        usuarioActual.id_usuario !== respuesta.id_usuario ||
        usuarioActual.tipo_de_usuario !== respuesta.tipo_de_usuario
      ) {
        throw new Error(
          "Los datos de autenticación no coinciden con el usuario.",
        );
      }

      localStorage.setItem(
        "rol",
        usuarioActual.tipo_de_usuario,
      );

      setUsuario(usuarioActual);
      setToken(respuesta.access_token);
    } catch (error) {
      logoutService();

      setToken(null);
      setUsuario(null);

      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Cerrar sesión.
  const logout = () => {
    logoutService();

    setUsuario(null);
    setToken(null);
    setLoading(false);
  };

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

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider",
    );
  }

  return context;
}
