import { useState, type FormEvent } from "react";
import { FiLock, FiMail } from "react-icons/fi";

// Importa el servicio de autenticación
/* import { login } from "../services/auth"; */

//importar el contexto de autenticacion
import { useAuth } from "../context/AuthContext";

// Componente de inicio de sesión
function Login() {
  //obtiene la funcion de inico de sesion de el contexto 
  const { login } = useAuth();

  // Guarda el correo escrito por el usuario
  const [correo, setCorreo] = useState("");

  // Guarda la contraseña escrita por el usuario
  const [password, setPassword] = useState("");

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

          <div className="input-container">
            <FiLock />

            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
            />
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
      </section>
    </main>
  );
}

// Exporta el componente Login
export default Login;