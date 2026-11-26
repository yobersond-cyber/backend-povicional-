
import { useEffect, useState, type FormEvent } from "react";

import {
  FiBookOpen,
  FiHome,
  FiRefreshCw,
  FiUser,
  FiUserPlus,
  FiUsers,
  FiCalendar,
} from "react-icons/fi";

import RoleLayout, {
  type RoleMenuItem,
} from "./RoleLayout";

import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../services/api";

interface UsuarioInstitucional {
  id_usuario: number;
  id_colegio: number | null;
  documento: string;
  nombres_compl: string;
  apellidos_compl: string;
  telefono: string;
  correo: string;
  tipo_de_usuario: string;
  jornada?: string | null;
  estado_aprobacion?: string;
}

interface RespuestaAPI<T> {
  success?: boolean;
  mensaje?: string;
  data?: T | null;
}

interface CoordinadorFormulario {
  documento: string;
  nombres_compl: string;
  apellidos_compl: string;
  telefono: string;
  correo: string;
  contrasena: string;
}

const formularioInicial: CoordinadorFormulario = {
  documento: "",
  nombres_compl: "",
  apellidos_compl: "",
  telefono: "",
  correo: "",
  contrasena: "",
};

const menu: RoleMenuItem[] = [
  {
    id: "inicio",
    nombre: "Inicio",
    icono: <FiHome />,
  },
  {
    id: "coordinadores",
    nombre: "Coordinadores",
    icono: <FiUserPlus />,
  },
  {
    id: "docentes",
    nombre: "Docentes",
    icono: <FiUsers />,
  },
  {
    id: "perfil",
    nombre: "Mi perfil",
    icono: <FiUser />,
  },
];

async function obtenerListaUsuarios(
  endpoint: string,
): Promise<UsuarioInstitucional[]> {
  const respuesta = await apiFetch(endpoint) as
    | RespuestaAPI<UsuarioInstitucional[]>
    | UsuarioInstitucional[];

  if (Array.isArray(respuesta)) {
    return respuesta;
  }

  if (respuesta.success === false) {
    throw new Error(
      respuesta.mensaje || "No fue posible obtener los usuarios.",
    );
  }

  return Array.isArray(respuesta.data)
    ? respuesta.data
    : [];
}

function InicioRector() {
  const { usuario } = useAuth();

  const [usuarios, setUsuarios] = useState<UsuarioInstitucional[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const primerNombre =
    usuario?.nombres_compl?.trim().split(/\s+/)[0] || "rector";

  const cargarResumen = async () => {
    try {
      setCargando(true);
      setError("");

      const datos = await obtenerListaUsuarios("/usuarios");

      setUsuarios(datos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar el resumen institucional.",
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarResumen();
  }, []);

  const coordinadores = usuarios.filter(
    (u) => u.tipo_de_usuario === "coordinador",
  ).length;

  const docentes = usuarios.filter(
    (u) => u.tipo_de_usuario === "docente",
  ).length;

  const estudiantes = usuarios.filter(
    (u) => u.tipo_de_usuario === "estudiante",
  ).length;

  const fecha = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="role-home role-home-rector">
      <section className="coordinator-welcome">
        <div className="coordinator-welcome-content">
          <span className="coordinator-badge">
            <FiBookOpen aria-hidden="true" />
            Administración institucional
          </span>

          <p className="coordinator-eyebrow">
            Panel de rectoría
          </p>

          <h1>¡Bienvenido, {primerNombre}!</h1>

          <p className="coordinator-description">
            Administra los coordinadores de tu institución,
            consulta el equipo docente y supervisa la organización
            institucional desde Aprenzy.
          </p>

          <div className="coordinator-profile-description">
            <FiCalendar aria-hidden="true" />
            {fecha.charAt(0).toUpperCase() + fecha.slice(1)}
          </div>
        </div>

        <div className="coordinator-hero-art" aria-hidden="true">
          <div className="coordinator-hero-icon">
            <FiBookOpen />
          </div>
        </div>
      </section>

      <section className="coordinator-access-section">
        <div className="coordinator-section-heading">
          <div>
            <span className="coordinator-section-eyebrow">
              Gestión institucional
            </span>

            <h2>Resumen de tu institución</h2>

            <p>
              Consulta el personal y los estudiantes registrados
              en tu colegio.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void cargarResumen()}
            disabled={cargando}
          >
            <FiRefreshCw />
            Actualizar
          </button>
        </div>

        {cargando ? (
          <p>Cargando información institucional...</p>
        ) : error ? (
          <div>
            <p role="alert" className="form-error">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void cargarResumen()}
            >
              Intentar nuevamente
            </button>
          </div>
        ) : (
          <div className="coordinator-access-grid">
            <article className="coordinator-access-card">
              <span className="coordinator-access-icon">
                <FiUserPlus />
              </span>

              <span className="coordinator-access-copy">
                <strong>{coordinadores}</strong>
                <span>Coordinadores registrados</span>
              </span>
            </article>

            <article className="coordinator-access-card">
              <span className="coordinator-access-icon">
                <FiUsers />
              </span>

              <span className="coordinator-access-copy">
                <strong>{docentes}</strong>
                <span>Docentes registrados</span>
              </span>
            </article>

            <article className="coordinator-access-card">
              <span className="coordinator-access-icon">
                <FiBookOpen />
              </span>

              <span className="coordinator-access-copy">
                <strong>{estudiantes}</strong>
                <span>Estudiantes registrados</span>
              </span>
            </article>
          </div>
        )}
      </section>

      <section className="coordinator-access-section">
        <div className="coordinator-section-heading">
          <div>
            <span className="coordinator-section-eyebrow">
              Accesos directos
            </span>

            <h2>Administración del colegio</h2>

            <p>
              Selecciona una sección para gestionar
              el equipo de tu institución.
            </p>
          </div>
        </div>

        <div className="coordinator-access-grid">
          <div className="coordinator-access-card">
            <span className="coordinator-access-icon">
              <FiUserPlus />
            </span>

            <span className="coordinator-access-copy">
              <strong>Coordinadores</strong>
              <span>
                Registra y consulta los coordinadores de tu colegio.
              </span>
            </span>
          </div>

          <div className="coordinator-access-card">
            <span className="coordinator-access-icon">
              <FiUsers />
            </span>

            <span className="coordinator-access-copy">
              <strong>Docentes</strong>
              <span>
                Consulta los docentes vinculados a tu institución.
              </span>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function CoordinadoresRector() {
  const [coordinadores, setCoordinadores] = useState<
    UsuarioInstitucional[]
  >([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [formulario, setFormulario] =
    useState<CoordinadorFormulario>(formularioInicial);

  async function cargarCoordinadores() {
    try {
      setCargando(true);
      setError("");

      const datos = await obtenerListaUsuarios(
        "/usuarios/coordinadores",
      );

      setCoordinadores(datos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar los coordinadores.",
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargarCoordinadores();
  }, []);

  function actualizarCampo(
    campo: keyof CoordinadorFormulario,
    valor: string,
  ) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  async function registrarCoordinador(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    setError("");
    setMensaje("");

    if (
      !formulario.documento.trim() ||
      !formulario.nombres_compl.trim() ||
      !formulario.apellidos_compl.trim() ||
      !formulario.telefono.trim() ||
      !formulario.correo.trim() ||
      !formulario.contrasena.trim()
    ) {
      setError("Completa todos los campos del formulario.");
      return;
    }

    try {
      setGuardando(true);

      const respuesta = await apiFetch("/usuarios", {
        method: "POST",
        body: JSON.stringify({
          documento: formulario.documento.trim(),
          nombres_compl: formulario.nombres_compl.trim(),
          apellidos_compl: formulario.apellidos_compl.trim(),
          telefono: formulario.telefono.trim(),
          correo: formulario.correo.trim(),
          contrasena: formulario.contrasena,
          tipo_de_usuario: "coordinador",
        }),
      }) as RespuestaAPI<UsuarioInstitucional>;

      if (respuesta.success === false) {
        throw new Error(
          respuesta.mensaje || "No fue posible registrar el coordinador.",
        );
      }

      setFormulario(formularioInicial);
      setMensaje("El coordinador fue registrado correctamente.");

      await cargarCoordinadores();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible registrar el coordinador.",
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="role-home role-home-rector">
      <section className="coordinator-profile-panel">
        <h2>Registrar coordinador</h2>

        <p className="coordinator-profile-description">
          Crea una cuenta de coordinador para tu institución.
          El colegio se asigna automáticamente según tu cuenta.
        </p>

        <form onSubmit={registrarCoordinador}>
          <div className="coordinator-profile-grid">
            <label className="coordinator-profile-field">
              <span>Documento</span>
              <input
                type="text"
                value={formulario.documento}
                onChange={(e) =>
                  actualizarCampo("documento", e.target.value)
                }
                autoComplete="off"
                required
              />
            </label>

            <label className="coordinator-profile-field">
              <span>Nombres</span>
              <input
                type="text"
                value={formulario.nombres_compl}
                onChange={(e) =>
                  actualizarCampo("nombres_compl", e.target.value)
                }
                autoComplete="given-name"
                required
              />
            </label>

            <label className="coordinator-profile-field">
              <span>Apellidos</span>
              <input
                type="text"
                value={formulario.apellidos_compl}
                onChange={(e) =>
                  actualizarCampo("apellidos_compl", e.target.value)
                }
                autoComplete="family-name"
                required
              />
            </label>

            <label className="coordinator-profile-field">
              <span>Teléfono</span>
              <input
                type="tel"
                value={formulario.telefono}
                onChange={(e) =>
                  actualizarCampo("telefono", e.target.value)
                }
                autoComplete="tel"
                required
              />
            </label>

            <label className="coordinator-profile-field">
              <span>Correo electrónico</span>
              <input
                type="email"
                value={formulario.correo}
                onChange={(e) =>
                  actualizarCampo("correo", e.target.value)
                }
                autoComplete="email"
                required
              />
            </label>

            <label className="coordinator-profile-field">
              <span>Contraseña inicial</span>
              <input
                type="password"
                value={formulario.contrasena}
                onChange={(e) =>
                  actualizarCampo("contrasena", e.target.value)
                }
                autoComplete="new-password"
                required
                minLength={6}
              />
            </label>
          </div>

          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}

          {mensaje && (
            <p role="status" className="form-success">
              {mensaje}
            </p>
          )}

          <button
            type="submit"
            className="coordinator-reminder-button"
            disabled={guardando}
          >
            <FiUserPlus />
            {guardando ? "Registrando..." : "Registrar coordinador"}
          </button>
        </form>
      </section>

      <section className="coordinator-profile-panel">
        <div className="coordinator-section-heading">
          <div>
            <h2>Coordinadores registrados</h2>
            <p>
              Consulta las cuentas de coordinación de tu institución.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void cargarCoordinadores()}
            disabled={cargando}
            aria-label="Actualizar coordinadores"
          >
            <FiRefreshCw />
            Actualizar
          </button>
        </div>

        {cargando ? (
          <p>Cargando coordinadores...</p>
        ) : error && coordinadores.length === 0 ? (
          <p role="alert" className="form-error">
            {error}
          </p>
        ) : coordinadores.length === 0 ? (
          <p>No hay coordinadores registrados.</p>
        ) : (
          <>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}

            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Documento</th>
                    <th>Correo</th>
                    <th>Teléfono</th>
                  </tr>
                </thead>

                <tbody>
                  {coordinadores.map((coordinador) => (
                    <tr key={coordinador.id_usuario}>
                      <td>
                        {coordinador.nombres_compl}{" "}
                        {coordinador.apellidos_compl}
                      </td>
                      <td>{coordinador.documento}</td>
                      <td>{coordinador.correo}</td>
                      <td>{coordinador.telefono}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function DocentesRector() {
  const [docentes, setDocentes] = useState<UsuarioInstitucional[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarDocentes() {
    try {
      setCargando(true);
      setError("");

      const usuarios = await obtenerListaUsuarios(
        "/usuarios/docentes",
      );

      setDocentes(usuarios);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar los docentes.",
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargarDocentes();
  }, []);

  return (
    <div className="role-home role-home-rector">
      <section className="coordinator-profile-panel">
        <div className="coordinator-section-heading">
          <div>
            <h2>Docentes de la institución</h2>

            <p className="coordinator-profile-description">
              Consulta los docentes vinculados a tu colegio.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void cargarDocentes()}
            disabled={cargando}
          >
            <FiRefreshCw />
            Actualizar
          </button>
        </div>

        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}

        {cargando ? (
          <p>Cargando docentes...</p>
        ) : docentes.length === 0 ? (
          <p>No hay docentes registrados.</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Jornada</th>
                </tr>
              </thead>

              <tbody>
                {docentes.map((docente) => (
                  <tr key={docente.id_usuario}>
                    <td>
                      {docente.nombres_compl}{" "}
                      {docente.apellidos_compl}
                    </td>
                    <td>{docente.documento}</td>
                    <td>{docente.correo}</td>
                    <td>{docente.telefono}</td>
                    <td>{docente.jornada || "No asignada"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function PerfilRector() {
  const { usuario } = useAuth();

  const datos = [
    {
      etiqueta: "Nombres",
      valor: usuario?.nombres_compl || "No registrados",
    },
    {
      etiqueta: "Apellidos",
      valor: usuario?.apellidos_compl || "No registrados",
    },
    {
      etiqueta: "Documento",
      valor: usuario?.documento || "No registrado",
    },
    {
      etiqueta: "Correo",
      valor: usuario?.correo || "No registrado",
    },
    {
      etiqueta: "Teléfono",
      valor: usuario?.telefono || "No registrado",
    },
    {
      etiqueta: "Rol",
      valor: "Rector",
    },
  ];

  return (
    <div className="role-home role-home-rector coordinator-profile">
      <section className="coordinator-profile-hero">
        <div className="coordinator-profile-avatar">
          <FiUser aria-hidden="true" />
        </div>

        <div>
          <span className="coordinator-section-eyebrow">
            Perfil institucional
          </span>

          <h1>
            {usuario?.nombres_compl || "Rector"}{" "}
            {usuario?.apellidos_compl || ""}
          </h1>

          <p>Información de tu cuenta.</p>
        </div>
      </section>

      <section className="coordinator-profile-panel">
        <h2>Información personal</h2>

        <div className="coordinator-profile-grid">
          {datos.map((dato) => (
            <div
              className="coordinator-profile-field"
              key={dato.etiqueta}
            >
              <span>{dato.etiqueta}</span>
              <strong>{dato.valor}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function RectorLayout() {
  function renderSeccion(seccion: string) {
    switch (seccion) {
      case "inicio":
        return <InicioRector />;

      case "coordinadores":
        return <CoordinadoresRector />;

      case "docentes":
        return <DocentesRector />;

      case "perfil":
        return <PerfilRector />;

      default:
        return <InicioRector />;
    }
  }

  return (
    <RoleLayout
      titulo="Rector"
      subtitulo="Administración institucional"
      variante="rector"
      menu={menu}
      seccionInicial="inicio"
      renderSeccion={renderSeccion}
    />
  );
}
