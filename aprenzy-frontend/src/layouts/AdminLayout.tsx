
import {
  FiArrowRight,
  FiBookOpen,
  FiCalendar,
  FiHome,
  FiShield,
  FiUsers,
} from "react-icons/fi";

import { useNavigate } from "react-router-dom";

import RoleLayout, {
  type RoleMenuItem,
} from "../components/layout/RoleLayout";

import AdminInstituciones from "../pages/AdminInstituciones";

/* ==========================================
   MENÚ DEL ADMINISTRADOR GLOBAL
   ========================================== */

const menu: RoleMenuItem[] = [
  {
    id: "inicio",
    nombre: "Inicio",
    icono: <FiHome />,
  },
  {
    id: "instituciones",
    nombre: "Colegios y coordinadores",
    icono: <FiBookOpen />,
  },
];

/* ==========================================
   INICIO DEL ADMINISTRADOR
   ========================================== */

function InicioAdministrador() {
  const navigate = useNavigate();

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

      {/* BIENVENIDA */}

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
            Gestiona las instituciones educativas de Aprenzy
            y las cuentas de sus coordinadores desde un único
            espacio de administración.
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

      {/* ACCESOS PRINCIPALES */}

      <section className="admin-home-section">

        <header className="admin-home-section-heading">
          <div>
            <span className="admin-home-section-eyebrow">
              Gestión centralizada
            </span>

            <h2>Administración institucional</h2>

            <p>
              Accede a las herramientas disponibles para
              administrar colegios y coordinadores.
            </p>
          </div>

          <span className="admin-home-section-label">
            Panel global
          </span>
        </header>

        <div className="admin-home-grid">

          {/* COLEGIOS Y COORDINADORES */}

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

              <strong>Colegios y coordinadores</strong>

              <span className="admin-home-card-description">
                Consulta colegios, registra nuevas instituciones
                y administra las cuentas de los coordinadores.
              </span>

              <span className="admin-home-card-action">
                Abrir gestión
                <FiArrowRight aria-hidden="true" />
              </span>
            </span>
          </button>

          {/* COORDINADORES */}

          <button
            type="button"
            className="admin-home-card"
            onClick={() =>
              navigate("/administrador/instituciones")
            }
          >
            <span className="admin-home-card-icon">
              <FiUsers aria-hidden="true" />
            </span>

            <span className="admin-home-card-content">
              <span className="admin-home-card-kicker">
                CUENTAS
              </span>

              <strong>Administración de coordinadores</strong>

              <span className="admin-home-card-description">
                Accede al módulo donde puedes consultar,
                crear y asociar coordinadores a los colegios.
              </span>

              <span className="admin-home-card-action">
                Ir al módulo
                <FiArrowRight aria-hidden="true" />
              </span>
            </span>
          </button>

          {/* SEGURIDAD Y CONTROL */}

          <article className="admin-home-card admin-home-card-information">
            <span className="admin-home-card-icon">
              <FiShield aria-hidden="true" />
            </span>

            <span className="admin-home-card-content">
              <span className="admin-home-card-kicker">
                CONTROL GLOBAL
              </span>

              <strong>Administración segura</strong>

              <span className="admin-home-card-description">
                Utiliza tu cuenta administrativa para gestionar
                las instituciones y el acceso de sus responsables.
              </span>

              <span className="admin-home-card-status">
                <span className="admin-home-status-dot" />
                Área administrativa
              </span>
            </span>
          </article>

        </div>
      </section>

      {/* AVISO INFORMATIVO */}

      <section className="admin-home-note">
        <span className="admin-home-note-icon">
          <FiShield aria-hidden="true" />
        </span>

        <div className="admin-home-note-content">
          <strong>Control de las instituciones</strong>

          <p>
            Para registrar una institución, entra en
            Colegios y coordinadores. Allí encontrarás los
            formularios y las opciones de consulta existentes.
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

/* ==========================================
   CONTENIDO DEL PANEL
   ========================================== */

export default function AdminLayout() {
  function renderSeccion(seccion: string) {
    switch (seccion) {
      case "inicio":
        return <InicioAdministrador />;

      case "instituciones":
        return <AdminInstituciones />;

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
