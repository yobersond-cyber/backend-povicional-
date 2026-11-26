
import {
  FiArrowRight,
  FiBookOpen,
  FiCalendar,
  FiHome,
  FiShield,
  FiUsers,
  FiBarChart2,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
} from "react-icons/fi";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import RoleLayout, {
  type RoleMenuItem,
} from "../components/layout/RoleLayout";

import AdminInstituciones from "../pages/AdminInstituciones";

import {
  obtenerResumenInstitucional,
  type ResumenInstitucional,
} from "../services/administracion";

const menu: RoleMenuItem[] = [
  {
    id: "inicio",
    nombre: "Inicio",
    icono: <FiHome />,
  },
  {
    id: "instituciones",
    nombre: "Colegios y rectores",
    icono: <FiBookOpen />,
  },
  {
    id: "administradores",
    nombre: "Administradores",
    icono: <FiUsers />,
  },
];

function InicioAdministrador() {
  const navigate = useNavigate();

  const [resumen, setResumen] =
    useState<ResumenInstitucional | null>(null);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarResumen = async () => {
    try {
      setCargando(true);
      setError("");

      const datos = await obtenerResumenInstitucional();

      setResumen(datos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar las estadísticas.",
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarResumen();
  }, []);

  const fechaFormateada = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const fecha =
    fechaFormateada.charAt(0).toUpperCase() +
    fechaFormateada.slice(1);

  return (
    <div className="role-home role-home-admin admin-dashboard">
      <section className="admin-home-hero">
        <div className="admin-home-hero-copy">
          <span className="admin-home-badge">
            <FiShield aria-hidden="true" />
            Administrador global
          </span>

          <p className="admin-home-eyebrow">
            Centro de control institucional
          </p>

          <h1>Panel del administrador</h1>

          <p className="admin-home-description">
            Administra los colegios registrados en Aprenzy
            y consulta el estado general de las instituciones
            desde un solo lugar.
          </p>

          <div className="admin-home-meta">
            <span>
              <FiCalendar aria-hidden="true" />
              {fecha}
            </span>

            <span>
              <FiShield aria-hidden="true" />
              Acceso administrativo global
            </span>
          </div>
        </div>

        <div
          className="admin-home-hero-art"
          aria-hidden="true"
        >
          <div className="admin-home-hero-icon">
            <FiShield />
          </div>

          <span className="admin-home-hero-dot admin-home-dot-one" />
          <span className="admin-home-hero-dot admin-home-dot-two" />
        </div>
      </section>

      <section className="admin-home-section">
        <header className="admin-home-section-heading">
          <div>
            <span className="admin-home-section-eyebrow">
              Gestión centralizada
            </span>

            <h2>Administración de Aprenzy</h2>

            <p>
              Gestiona las instituciones y consulta
              los indicadores generales de la plataforma.
            </p>
          </div>

          <span className="admin-home-section-label">
            Panel global
          </span>
        </header>

        <div className="admin-home-grid">
          <button
            type="button"
            className="admin-home-card admin-home-card-primary"
            onClick={() =>
              navigate("/administrador/instituciones")
            }
          >
            <span className="admin-home-card-icon">
              <FiBookOpen aria-hidden="true" />
            </span>

            <span className="admin-home-card-content">
              <span className="admin-home-card-kicker">
                INSTITUCIONES
              </span>

              <strong>Colegios y rectores</strong>

              <span className="admin-home-card-description">
                Registra colegios, consulta sus detalles
                y administra el estado de las instituciones.
              </span>

              <span className="admin-home-card-action">
                Abrir gestión
                <FiArrowRight aria-hidden="true" />
              </span>
            </span>
          </button>

          <button
            type="button"
            className="admin-home-card"
            onClick={() =>
              navigate("/administrador/administradores")
            }
          >
            <span className="admin-home-card-icon">
              <FiUsers aria-hidden="true" />
            </span>

            <span className="admin-home-card-content">
              <span className="admin-home-card-kicker">
                SEGURIDAD
              </span>

              <strong>Administradores</strong>

              <span className="admin-home-card-description">
                Consulta la información sobre los permisos
                y el acceso administrativo global.
              </span>

              <span className="admin-home-card-action">
                Ver información
                <FiArrowRight aria-hidden="true" />
              </span>
            </span>
          </button>

          <article className="admin-home-card admin-home-card-information">
            <span className="admin-home-card-icon">
              <FiBarChart2 aria-hidden="true" />
            </span>

            <span className="admin-home-card-content">
              <span className="admin-home-card-kicker">
                ESTADÍSTICAS
              </span>

              <strong>Control institucional</strong>

              <span className="admin-home-card-description">
                Consulta los indicadores actuales de los
                colegios registrados en la plataforma.
              </span>

              <span className="admin-home-card-status">
                <span className="admin-home-status-dot" />
                Datos institucionales
              </span>
            </span>
          </article>
        </div>
      </section>

      <section className="admin-home-section">
        <header className="admin-home-section-heading">
          <div>
            <span className="admin-home-section-eyebrow">
              Indicadores generales
            </span>

            <h2>Estadísticas institucionales</h2>

            <p>
              Información calculada a partir de los colegios
              registrados en Aprenzy.
            </p>
          </div>

          <button
            type="button"
            className="admin-home-note-button"
            onClick={() => void cargarResumen()}
            disabled={cargando}
          >
            <FiRefreshCw aria-hidden="true" />
            Actualizar
          </button>
        </header>

        {cargando ? (
          <div className="admin-home-card admin-home-card-information">
            <span className="admin-home-card-content">
              <strong>Cargando estadísticas...</strong>
              <span className="admin-home-card-description">
                Consultando la información institucional.
              </span>
            </span>
          </div>
        ) : error ? (
          <div className="admin-home-card admin-home-card-information">
            <span className="admin-home-card-content">
              <strong>No se pudieron cargar las estadísticas</strong>

              <span className="admin-home-card-description">
                {error}
              </span>

              <button
                type="button"
                className="admin-home-note-button"
                onClick={() => void cargarResumen()}
              >
                Intentar nuevamente
                <FiRefreshCw aria-hidden="true" />
              </button>
            </span>
          </div>
        ) : resumen ? (
          <div className="admin-home-grid">
            <article className="admin-home-card">
              <span className="admin-home-card-icon">
                <FiBookOpen aria-hidden="true" />
              </span>

              <span className="admin-home-card-content">
                <span className="admin-home-card-kicker">
                  TOTAL REGISTRADO
                </span>

                <strong className="admin-home-stat-number">
                  {resumen.totalColegios}
                </strong>

                <span className="admin-home-card-description">
                  Colegios registrados en Aprenzy.
                </span>
              </span>
            </article>

            <article className="admin-home-card">
              <span className="admin-home-card-icon">
                <FiCheckCircle aria-hidden="true" />
              </span>

              <span className="admin-home-card-content">
                <span className="admin-home-card-kicker">
                  INSTITUCIONES ACTIVAS
                </span>

                <strong className="admin-home-stat-number">
                  {resumen.colegiosActivos}
                </strong>

                <span className="admin-home-card-description">
                  Colegios habilitados actualmente.
                </span>
              </span>
            </article>

            <article className="admin-home-card">
              <span className="admin-home-card-icon">
                <FiXCircle aria-hidden="true" />
              </span>

              <span className="admin-home-card-content">
                <span className="admin-home-card-kicker">
                  INSTITUCIONES INACTIVAS
                </span>

                <strong className="admin-home-stat-number">
                  {resumen.colegiosInactivos}
                </strong>

                <span className="admin-home-card-description">
                  Colegios deshabilitados actualmente.
                </span>
              </span>
            </article>
          </div>
        ) : null}
      </section>

      <section className="admin-home-note">
        <span className="admin-home-note-icon">
          <FiShield aria-hidden="true" />
        </span>

        <div className="admin-home-note-content">
          <strong>Administración institucional</strong>

          <p>
            Cada colegio tendrá su propio rector, quien
            será responsable de gestionar coordinadores,
            docentes y estudiantes de su institución.
          </p>
        </div>

        <button
          type="button"
          className="admin-home-note-button"
          onClick={() =>
            navigate("/administrador/instituciones")
          }
        >
          Continuar
          <FiArrowRight aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}

function Administradores() {
  return (
    <div className="role-home">
      <section className="admin-home-section">
        <header className="admin-home-section-heading">
          <div>
            <span className="admin-home-section-eyebrow">
              Seguridad de la plataforma
            </span>

            <h2>Administración global</h2>

            <p>
              Información sobre el acceso administrativo
              y la protección de las cuentas globales.
            </p>
          </div>
        </header>

        <div className="admin-home-card admin-home-card-information">
          <span className="admin-home-card-icon">
            <FiShield aria-hidden="true" />
          </span>

          <span className="admin-home-card-content">
            <strong>Permisos administrativos</strong>

            <span className="admin-home-card-description">
              El administrador global tiene permisos para
              gestionar las instituciones y sus rectores.
              La creación de otros administradores globales
              no está habilitada desde este panel.
            </span>
          </span>
        </div>

        <div className="admin-home-card admin-home-card-information">
          <span className="admin-home-card-icon">
            <FiUsers aria-hidden="true" />
          </span>

          <span className="admin-home-card-content">
            <strong>Usuarios institucionales</strong>

            <span className="admin-home-card-description">
              Los rectores administran los coordinadores,
              docentes y estudiantes de sus respectivos
              colegios. Cada institución mantiene separados
              sus usuarios y sus datos.
            </span>
          </span>
        </div>
      </section>
    </div>
  );
}

export default function AdminLayout() {
  function renderSeccion(seccion: string) {
    switch (seccion) {
      case "inicio":
        return <InicioAdministrador />;

      case "instituciones":
        return <AdminInstituciones />;

      case "administradores":
        return <Administradores />;

      default:
        return <InicioAdministrador />;
    }
  }

  return (
    <RoleLayout
      titulo="Administrador global"
      subtitulo="Gestión administrativa"
      variante="admin"
      menu={menu}
      seccionInicial="inicio"
      renderSeccion={renderSeccion}
    />
  );
}
