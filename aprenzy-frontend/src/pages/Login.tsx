import { useState, type FormEvent } from "react";
import Registro from "./Registro";
import {
  FiLock,
  FiMail,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

// Importa el servicio de autenticación
/* import { login } from "../services/auth"; */

//importar el contexto de autenticacion
import { useAuth } from "../context/AuthContext";

// Componente de inicio de sesión
function Login() {
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  //obtiene la funcion de inico de sesion de el contexto 
  const { login } = useAuth();

  // Guarda el correo escrito por el usuario
  const [correo, setCorreo] = useState("");

  // Guarda la contraseña escrita por el usuario
  const [password, setPassword] = useState("");

  // Controla si la contraseña está visible
  const [mostrarPassword, setMostrarPassword] = useState(false);

  // Guarda el mensaje de error del login
  const [error, setError] = useState("");

  // Indica si el formulario está enviándose
  const [loading, setLoading] = useState(false);

  // Procesa el envío del formulario
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    // Evita recargar la página
    event.preventDefault();

    // Limpia errores anteriores
    setError("");

// Activa el estado de carga
setLoading(true);

try {
  // Envía las credenciales al backend
  await login(correo, password);
} catch (error) {
  // Muestra el error al usuario
  setError(
    error instanceof Error
      ? error.message
      : "No fue posible iniciar sesión",
  );
} finally {
  // Finaliza el estado de carga
  setLoading(false);
}
  };

  // Alterna entre el inicio de sesión y el registro dinámico por rol
  if (mostrarRegistro) {
    return <Registro onBackToLogin={() => setMostrarRegistro(false)} />;
  }

  // Renderiza la interfaz del login
  return (
    <main className="login-container">
      <section className="login-card">

        {/* Logo de Aprenzy */}
        <div className="login-logo">
          A
        </div>

        {/* Título principal */}
        <h1>Bienvenido a Aprenzy</h1>

        {/* Descripción del formulario */}
        <p className="login-description">
          Ingresa a tu cuenta para continuar.
        </p>

        {/* Formulario de autenticación */}
        <form onSubmit={handleSubmit}>

          {/* Campo de correo */}
          <label htmlFor="correo">
            Correo
          </label>

          <div className="input-container">
            <FiMail />

            <input
              id="correo"
              type="email"
              placeholder="correo@ejemplo.com"
              value={correo}
              onChange={(event) =>
                setCorreo(event.target.value)
              }
              required
            />
          </div>

          
{/* Campo de contraseña */}
<label htmlFor="password">
  Contraseña
</label>

<div className="input-container password-input-container">
  <FiLock aria-hidden="true" />

  <input
    id="password"
    type={mostrarPassword ? "text" : "password"}
    placeholder="••••••••"
    value={password}
    onChange={(event) =>
      setPassword(event.target.value)
    }
    autoComplete="current-password"
    required
  />

  <button
    type="button"
    className="password-toggle"
    onClick={() =>
      setMostrarPassword((visible) => !visible)
    }
    aria-label={
      mostrarPassword
        ? "Ocultar contraseña"
        : "Mostrar contraseña"
    }
    title={
      mostrarPassword
        ? "Ocultar contraseña"
        : "Mostrar contraseña"
    }
  >
    {mostrarPassword ? (
      <FiEyeOff aria-hidden="true" />
    ) : (
      <FiEye aria-hidden="true" />
    )}
  </button>
</div>


          {/* Mensaje de error */}
          {error && (
            <p className="login-error">
              {error}
            </p>
          )}

          {/* Botón de inicio de sesión */}
          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Iniciando sesión..."
              : "Iniciar sesión"}
          </button>

        </form>

        <p className="register-switch">
          ¿No tienes cuenta?{" "}
          <button
            type="button"
            className="text-button"
            onClick={() => setMostrarRegistro(true)}
          >
            Regístrate aquí
          </button>
        </p>
      </section>
    </main>
  );
}

// Exporta el componente Login
export default Login;