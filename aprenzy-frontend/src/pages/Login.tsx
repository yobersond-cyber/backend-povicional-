
import { useState, type FormEvent } from "react";
import Registro from "./Registro";
import {
  FiLock,
  FiMail,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiClock,
  FiXCircle,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";

function Login() {
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const { login } = useAuth();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const esPendiente = error.toLowerCase().includes("pendiente");
  const esRechazada =
    error.toLowerCase().includes("rechazada") ||
    error.toLowerCase().includes("rechazado");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(correo, password);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible iniciar sesión",
      );
    } finally {
      setLoading(false);
    }
  };

  if (mostrarRegistro) {
    return (
      <Registro
        onBackToLogin={() => setMostrarRegistro(false)}
      />
    );
  }

  return (
    <main className="login-container">
      <section className="login-card">

        <div className="login-logo">
          A
        </div>

        <h1>Bienvenido a Aprenzy</h1>

        <p className="login-description">
          Ingresa a tu cuenta para continuar.
        </p>

        <form onSubmit={handleSubmit}>

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
              autoComplete="email"
              required
            />
          </div>

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

          {error && (
            <div
              className="login-error"
              role="alert"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "12px",
                borderRadius: "8px",
                marginTop: "12px",
              }}
            >
              {esPendiente ? (
                <FiClock
                  size={20}
                  style={{ flexShrink: 0, marginTop: "2px" }}
                />
              ) : esRechazada ? (
                <FiXCircle
                  size={20}
                  style={{ flexShrink: 0, marginTop: "2px" }}
                />
              ) : (
                <FiAlertCircle
                  size={20}
                  style={{ flexShrink: 0, marginTop: "2px" }}
                />
              )}

              <span>
                {error}
              </span>
            </div>
          )}

          {esRechazada && (
            <p style={{ marginTop: "10px", fontSize: "14px" }}>
              Puedes volver a realizar tu registro con tus datos
              actualizados.
            </p>
          )}

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
            onClick={() => {
              setError("");
              setMostrarRegistro(true);
            }}
          >
            Regístrate aquí
          </button>
        </p>

      </section>
    </main>
  );
}

export default Login;
