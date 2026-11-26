
import { useEffect, useState, type FormEvent } from "react";
import {
  FiUser,
  FiMail,
  FiLock,
  FiHash,
  FiPhone,
  FiBookOpen,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

import {
  obtenerColegiosDisponibles,
  obtenerCursosDisponibles,
  registrarEstudiante,
  type ColegioDisponible,
  type CursoDisponible,
} from "../services/usuario";

interface RegistroProps {
  onBackToLogin: () => void;
}

interface FormularioRegistro {
  id_colegio: string;
  id_curso: string;
  documento: string;
  nombres_compl: string;
  apellidos_compl: string;
  telefono: string;
  correo: string;
  contrasena: string;
  confirmarContrasena: string;
}

const formularioInicial: FormularioRegistro = {
  id_colegio: "",
  id_curso: "",
  documento: "",
  nombres_compl: "",
  apellidos_compl: "",
  telefono: "",
  correo: "",
  contrasena: "",
  confirmarContrasena: "",
};

export default function Registro({ onBackToLogin }: RegistroProps) {
  const [formulario, setFormulario] =
    useState<FormularioRegistro>(formularioInicial);

  const [colegios, setColegios] = useState<ColegioDisponible[]>([]);
  const [cursos, setCursos] = useState<CursoDisponible[]>([]);

  const [cargandoColegios, setCargandoColegios] = useState(true);
  const [cargandoCursos, setCargandoCursos] = useState(false);
  const [registrando, setRegistrando] = useState(false);

  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  useEffect(() => {
    let activo = true;

    const cargarColegios = async () => {
      try {
        setCargandoColegios(true);
        setError("");

        const resultado = await obtenerColegiosDisponibles();

        if (!activo) return;

        setColegios(resultado);

        if (resultado.length === 0) {
          setError(
            "Actualmente no hay colegios disponibles para realizar el registro."
          );
        }
      } catch (err) {
        if (!activo) return;

        setError(
          err instanceof Error
            ? err.message
            : "No fue posible cargar los colegios disponibles."
        );
      } finally {
        if (activo) {
          setCargandoColegios(false);
        }
      }
    };

    cargarColegios();

    return () => {
      activo = false;
    };
  }, []);

  const manejarCambio = (
    campo: keyof FormularioRegistro,
    valor: string
  ) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));

    setError("");
    setMensajeExito("");
  };

  const manejarCambioColegio = async (idColegio: string) => {
    setFormulario((actual) => ({
      ...actual,
      id_colegio: idColegio,
      id_curso: "",
    }));

    setCursos([]);
    setError("");
    setMensajeExito("");

    if (!idColegio) return;

    try {
      setCargandoCursos(true);

      const resultado = await obtenerCursosDisponibles(
        Number(idColegio)
      );

      setCursos(resultado);

      if (resultado.length === 0) {
        setError(
          "El colegio seleccionado no tiene cursos disponibles para el registro."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar los cursos del colegio seleccionado."
      );
    } finally {
      setCargandoCursos(false);
    }
  };

  const manejarRegistro = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setMensajeExito("");

    if (
      !formulario.id_colegio ||
      !formulario.id_curso ||
      !formulario.documento.trim() ||
      !formulario.nombres_compl.trim() ||
      !formulario.apellidos_compl.trim() ||
      !formulario.telefono.trim() ||
      !formulario.correo.trim() ||
      !formulario.contrasena
    ) {
      setError("Por favor completa todos los campos obligatorios.");
      return;
    }

    if (formulario.contrasena.length < 6) {
      setError("La contraseña debe tener mínimo 6 caracteres.");
      return;
    }

    if (formulario.contrasena !== formulario.confirmarContrasena) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setRegistrando(true);

      await registrarEstudiante({
        id_colegio: Number(formulario.id_colegio),
        id_curso: Number(formulario.id_curso),
        documento: formulario.documento.trim(),
        nombres_compl: formulario.nombres_compl.trim(),
        apellidos_compl: formulario.apellidos_compl.trim(),
        telefono: formulario.telefono.trim(),
        correo: formulario.correo.trim().toLowerCase(),
        contrasena: formulario.contrasena,
      });

      setMensajeExito(
        "¡Solicitud enviada correctamente! Tu cuenta quedó pendiente de aprobación por parte del coordinador de tu colegio. Podrás iniciar sesión cuando sea aprobada."
      );

      setFormulario(formularioInicial);
      setCursos([]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible enviar tu solicitud de registro."
      );
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <div className="login-container register-container">
      <div className="login-card register-card">
        <div className="login-logo">
          <h1>APRENZY</h1>
        </div>

        <p className="login-description">
          Crea tu cuenta de estudiante y comienza tu experiencia académica
          con APRENZY.
        </p>

        <div className="role-description">
          <strong>Registro de estudiante</strong>
          <p>
            Completa tus datos y selecciona tu colegio y curso. Tu cuenta
            será revisada por el coordinador de tu institución.
          </p>
        </div>

        <form onSubmit={manejarRegistro}>
          <div className="register-grid">
            <div className="register-field">
              <label htmlFor="nombres_compl">Nombres</label>

              <div className="register-input-wrapper">
                <FiUser />
                <input
                  id="nombres_compl"
                  type="text"
                  placeholder="Ingresa tus nombres"
                  value={formulario.nombres_compl}
                  onChange={(e) =>
                    manejarCambio("nombres_compl", e.target.value)
                  }
                  autoComplete="given-name"
                  required
                />
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="apellidos_compl">Apellidos</label>

              <div className="register-input-wrapper">
                <FiUser />
                <input
                  id="apellidos_compl"
                  type="text"
                  placeholder="Ingresa tus apellidos"
                  value={formulario.apellidos_compl}
                  onChange={(e) =>
                    manejarCambio("apellidos_compl", e.target.value)
                  }
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="documento">Documento de identidad</label>

              <div className="register-input-wrapper">
                <FiHash />
                <input
                  id="documento"
                  type="text"
                  placeholder="Número de documento"
                  value={formulario.documento}
                  onChange={(e) =>
                    manejarCambio("documento", e.target.value)
                  }
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="telefono">Teléfono</label>

              <div className="register-input-wrapper">
                <FiPhone />
                <input
                  id="telefono"
                  type="tel"
                  placeholder="Número de teléfono"
                  value={formulario.telefono}
                  onChange={(e) =>
                    manejarCambio("telefono", e.target.value)
                  }
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            <div className="register-field register-field-full">
              <label htmlFor="correo">Correo electrónico</label>

              <div className="register-input-wrapper">
                <FiMail />
                <input
                  id="correo"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={formulario.correo}
                  onChange={(e) =>
                    manejarCambio("correo", e.target.value)
                  }
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="register-field register-field-full">
              <label htmlFor="id_colegio">Colegio</label>

              <div className="register-input-wrapper">
                <FiBookOpen />

                <select
                  id="id_colegio"
                  value={formulario.id_colegio}
                  onChange={(e) =>
                    manejarCambioColegio(e.target.value)
                  }
                  disabled={cargandoColegios || registrando}
                  required
                >
                  <option value="">
                    {cargandoColegios
                      ? "Cargando colegios..."
                      : "Selecciona tu colegio"}
                  </option>

                  {colegios.map((colegio) => (
                    <option
                      key={colegio.id_colegio}
                      value={colegio.id_colegio}
                    >
                      {colegio.nombre_colegio}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="register-field register-field-full">
              <label htmlFor="id_curso">Curso</label>

              <div className="register-input-wrapper">
                <FiBookOpen />

                <select
                  id="id_curso"
                  value={formulario.id_curso}
                  onChange={(e) =>
                    manejarCambio("id_curso", e.target.value)
                  }
                  disabled={
                    !formulario.id_colegio ||
                    cargandoCursos ||
                    cursos.length === 0 ||
                    registrando
                  }
                  required
                >
                  <option value="">
                    {!formulario.id_colegio
                      ? "Primero selecciona tu colegio"
                      : cargandoCursos
                        ? "Cargando cursos..."
                        : cursos.length === 0
                          ? "No hay cursos disponibles"
                          : "Selecciona tu curso"}
                  </option>

                  {cursos.map((curso) => (
                    <option
                      key={curso.id_curso}
                      value={curso.id_curso}
                    >
                      {`Grado ${curso.grado} - Curso ${curso.numero_curso} · ${curso.jornada}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="contrasena">Contraseña</label>

              <div className="register-password-control">
                <FiLock />

                <input
                  id="contrasena"
                  type={mostrarContrasena ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={formulario.contrasena}
                  onChange={(e) =>
                    manejarCambio("contrasena", e.target.value)
                  }
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() =>
                    setMostrarContrasena(!mostrarContrasena)
                  }
                  aria-label={
                    mostrarContrasena
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {mostrarContrasena ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="confirmarContrasena">
                Confirmar contraseña
              </label>

              <div className="register-password-control">
                <FiLock />

                <input
                  id="confirmarContrasena"
                  type={mostrarConfirmacion ? "text" : "password"}
                  placeholder="Repite tu contraseña"
                  value={formulario.confirmarContrasena}
                  onChange={(e) =>
                    manejarCambio(
                      "confirmarContrasena",
                      e.target.value
                    )
                  }
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() =>
                    setMostrarConfirmacion(!mostrarConfirmacion)
                  }
                  aria-label={
                    mostrarConfirmacion
                      ? "Ocultar confirmación"
                      : "Mostrar confirmación"
                  }
                >
                  {mostrarConfirmacion ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          {mensajeExito && (
            <div className="register-success" role="status">
              {mensajeExito}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={
              registrando ||
              cargandoColegios ||
              cargandoCursos ||
              colegios.length === 0
            }
          >
            {registrando
              ? "Enviando solicitud..."
              : "Crear cuenta de estudiante"}
          </button>
        </form>

        <div className="register-switch">
          <p>¿Ya tienes una cuenta?</p>

          <button
            type="button"
            onClick={onBackToLogin}
            disabled={registrando}
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
