import {
  useState,
  type ReactNode,
} from "react";

import {
  FiAlertCircle,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiChevronRight,
  FiClipboard,
  FiFileText,
  FiHome,
  FiLogOut,
  FiMenu,
  FiPieChart,
  FiShield,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";

import Actividades from "./Actividades";
import Accesos from "./Accesos";
import Apelaciones from "./Apelaciones";
import Calificaciones from "./calificaciones";
import Cursos from "./Curso";
import Docentes from "./Docentes";
import Entregas from "./Entregas";
import Estudiantes from "./Estudiantes";
import Estadisticas from "./Estadisticas";
import Historial from "./Historial";
import Incapacidades from "./Incapacidades";
import Materiales from "./Material";
import Materias from "./materias";

// Define las secciones disponibles
type Seccion =
  | "inicio"
  | "perfil"
  | "materias"
  | "materiales"
  | "actividades"
  | "calificaciones"
  | "entregas"
  | "incapacidades"
  | "apelaciones"
  | "accesos"
  | "estudiantes"
  | "docentes"
  | "cursos"
  | "historial"
  | "estadisticas";

// Define una opción del menú
interface OpcionMenu {
  id: Seccion;
  nombre: string;
  icono: ReactNode;
}

// Dashboard principal
export default function Dashboard() {
  const {
    usuario,
    logout,
  } = useAuth();

  const [
    seccionActiva,
    setSeccionActiva,
  ] = useState<Seccion>(
    "inicio",
  );

  const [
    menuAbierto,
    setMenuAbierto,
  ] = useState(false);

  // Obtiene el rol actual
  const rol =
    usuario?.tipo_de_usuario ??
    "estudiante";

  // Obtiene el nombre del usuario
  const nombreUsuario =
    usuario?.nombres_compl ??
    "Usuario";

  // Construye el menú según el rol
  function obtenerMenu(): OpcionMenu[] {
    // Menú del estudiante
    if (
      rol === "estudiante"
    ) {
      return [
        {
          id: "inicio",
          nombre: "Inicio",
          icono: <FiHome />,
        },
        {
          id: "materias",
          nombre: "Materias",
          icono: <FiBookOpen />,
        },
        {
          id: "materiales",
          nombre: "Materiales",
          icono: <FiFileText />,
        },
        {
          id: "actividades",
          nombre: "Actividades",
          icono: <FiClipboard />,
        },
        {
          id: "calificaciones",
          nombre: "Calificaciones",
          icono: <FiCheckCircle />,
        },
        {
          id: "entregas",
          nombre: "Entregas",
          icono: <FiCalendar />,
        },
        {
          id: "incapacidades",
          nombre: "Incapacidades",
          icono: <FiAlertCircle />,
        },
        {
          id: "apelaciones",
          nombre: "Apelaciones",
          icono: <FiFileText />,
        },
        {
          id: "accesos",
          nombre: "Accesos",
          icono: <FiShield />,
        },
        {
          id: "perfil",
          nombre: "Mi perfil",
          icono: <FiUser />,
        },
      ];
    }

    // Menú del docente
    if (
      rol === "docente"
    ) {
      return [
        {
          id: "inicio",
          nombre: "Inicio",
          icono: <FiHome />,
        },
        {
          id: "materias",
          nombre: "Materias",
          icono: <FiBookOpen />,
        },
        {
          id: "materiales",
          nombre: "Materiales",
          icono: <FiFileText />,
        },
        {
          id: "actividades",
          nombre: "Actividades",
          icono: <FiClipboard />,
        },
        {
          id: "entregas",
          nombre: "Entregas",
          icono: <FiCalendar />,
        },
        {
          id: "calificaciones",
          nombre: "Calificaciones",
          icono: <FiCheckCircle />,
        },
        {
          id: "perfil",
          nombre: "Mi perfil",
          icono: <FiUser />,
        },
      ];
    }

    // Menú del administrador
    return [
      {
        id: "inicio",
        nombre: "Inicio",
        icono: <FiHome />,
      },
      {
        id: "estudiantes",
        nombre: "Estudiantes",
        icono: <FiUsers />,
      },
      {
        id: "docentes",
        nombre: "Docentes",
        icono: <FiUser />,
      },
      {
        id: "cursos",
        nombre: "Cursos",
        icono: <FiBookOpen />,
      },
      {
        id: "incapacidades",
        nombre: "Incapacidades",
        icono: <FiAlertCircle />,
      },
      {
        id: "apelaciones",
        nombre: "Apelaciones",
        icono: <FiFileText />,
      },
      {
        id: "accesos",
        nombre: "Accesos",
        icono: <FiShield />,
      },
      {
        id: "historial",
        nombre: "Historial",
        icono: <FiCalendar />,
      },
      {
        id: "estadisticas",
        nombre: "Estadísticas",
        icono: <FiPieChart />,
      },
      {
        id: "perfil",
        nombre: "Mi perfil",
        icono: <FiUser />,
      },
    ];
  }

  // Obtiene el menú actual
  const menu =
    obtenerMenu();

  // Cambia la sección activa
  function cambiarSeccion(
    seccion: Seccion,
  ) {
    setSeccionActiva(
      seccion,
    );

    setMenuAbierto(false);
  }

  // Cierra la sesión
  function cerrarSesion() {
    const confirmar =
      window.confirm(
        "¿Deseas cerrar sesión?",
      );

    if (!confirmar) {
      return;
    }

    logout();
  }

  // Obtiene el título de la sección
  function obtenerTituloSeccion(): string {
    const opcion =
      menu.find(
        (item) =>
          item.id ===
          seccionActiva,
      );

    return (
      opcion?.nombre ??
      "Inicio"
    );
  }

  // Renderiza la sección seleccionada
  function renderSeccion() {
    if (
      seccionActiva ===
      "materias"
    ) {
      return <Materias />;
    }

    if (
      seccionActiva ===
      "materiales"
    ) {
      return <Materiales />;
    }

    if (
      seccionActiva ===
      "actividades"
    ) {
      return <Actividades />;
    }

    if (
      seccionActiva ===
      "calificaciones"
    ) {
      return <Calificaciones />;
    }

    if (
      seccionActiva ===
      "entregas"
    ) {
      return <Entregas />;
    }

    if (
      seccionActiva ===
      "incapacidades"
    ) {
      return <Incapacidades />;
    }

    if (
      seccionActiva ===
      "apelaciones"
    ) {
      return <Apelaciones />;
    }

    if (
      seccionActiva ===
      "accesos"
    ) {
      return <Accesos />;
    }

    if (
      seccionActiva ===
      "estudiantes"
    ) {
      return <Estudiantes />;
    }

    if (
      seccionActiva ===
      "docentes"
    ) {
      return <Docentes />;
    }

    if (
      seccionActiva ===
      "cursos"
    ) {
      return <Cursos />;
    }

    if (
      seccionActiva ===
      "historial"
    ) {
      return <Historial />;
    }

    if (
      seccionActiva ===
      "estadisticas"
    ) {
      return <Estadisticas />;
    }

    // Muestra el perfil
    if (
      seccionActiva ===
      "perfil"
    ) {
      return (
        <Perfil
          nombre={
            usuario?.nombres_compl ??
            "Usuario"
          }
          apellidos={
            usuario?.apellidos_compl ??
            ""
          }
          correo={
            usuario?.correo ??
            ""
          }
          codigo={
            usuario?.codigo_usuario ??
            ""
          }
          rol={rol}
        />
      );
    }

    // Muestra el inicio
    return (
      <Inicio
        nombre={nombreUsuario}
        rol={rol}
      />
    );
  }

  return (
    <div className="dashboard">
      {/* Overlay para móvil */}
      {menuAbierto && (
        <div
          className="dashboard-overlay"
          onClick={() =>
            setMenuAbierto(false)
          }
        />
      )}

      {/* Barra lateral */}
      <aside
        className={`dashboard-sidebar ${
          menuAbierto
            ? "dashboard-sidebar-open"
            : ""
        }`}
      >
        {/* Logo */}
        <div className="dashboard-brand">
          <div className="dashboard-brand-logo">
            A
          </div>

          <div className="dashboard-brand-info">
            <div className="dashboard-brand-name">
              Aprenzy
            </div>

            <div className="dashboard-brand-subtitle">
              Plataforma académica
            </div>
          </div>

          <button
            type="button"
            className="dashboard-close-mobile"
            onClick={() =>
              setMenuAbierto(false)
            }
            aria-label="Cerrar menú"
          >
            <FiX />
          </button>
        </div>

        {/* Navegación */}
        <nav className="dashboard-nav">
          <div className="dashboard-nav-title">
            Menú principal
          </div>

          {menu.map(
            (opcion) => (
              <button
                key={
                  opcion.id
                }
                type="button"
                className={`dashboard-nav-button ${
                  seccionActiva ===
                  opcion.id
                    ? "dashboard-nav-active"
                    : ""
                }`}
                onClick={() =>
                  cambiarSeccion(
                    opcion.id,
                  )
                }
              >
                <span className="dashboard-nav-icon">
                  {opcion.icono}
                </span>

                <span className="dashboard-nav-label">
                  {opcion.nombre}
                </span>

                {seccionActiva ===
                  opcion.id && (
                  <FiChevronRight className="dashboard-nav-arrow" />
                )}
              </button>
            ),
          )}
        </nav>

        {/* Usuario */}
        <div className="dashboard-sidebar-footer">
          <div className="dashboard-user-mini">
            <div className="dashboard-user-avatar">
              <FiUser />
            </div>

            <div className="dashboard-user-info">
              <div className="dashboard-user-name">
                {nombreUsuario}
              </div>

              <div className="dashboard-user-role">
                {rol}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="dashboard-logout"
            onClick={
              cerrarSesion
            }
          >
            <FiLogOut />

            <span>
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="dashboard-main">
        {/* Barra superior */}
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-left">
            <button
              type="button"
              className="dashboard-menu-mobile"
              onClick={() =>
                setMenuAbierto(
                  true,
                )
              }
              aria-label="Abrir menú"
            >
              <FiMenu />
            </button>

            <div>
              <div className="dashboard-section-title">
                {
                  obtenerTituloSeccion()
                }
              </div>

              <div className="dashboard-section-role">
                {rol}
              </div>
            </div>
          </div>

          <div className="dashboard-topbar-user">
            <div className="dashboard-topbar-user-text">
              <strong>
                {nombreUsuario}
              </strong>

              <span>
                {usuario?.correo ??
                  ""}
              </span>
            </div>

            <div className="dashboard-topbar-avatar">
              <FiUser />
            </div>
          </div>
        </header>

        {/* Contenido */}
        <section className="dashboard-content">
          {renderSeccion()}
        </section>
      </main>
    </div>
  );
}

// Pantalla inicial
interface InicioProps {
  nombre: string;
  rol: string;
}

function Inicio({
  nombre,
  rol,
}: InicioProps) {
  return (
    <div className="inicio-page">
      {/* Bienvenida */}
      <section className="inicio-welcome">
        <span>
          Panel principal
        </span>

        <h1>
          Hola, {nombre}
        </h1>

        <p>
          Bienvenido a Aprenzy.
          Gestiona tu actividad
          académica desde este
          panel.
        </p>
      </section>

      {/* Tarjetas informativas */}
      <section className="inicio-grid">
        <div className="inicio-card">
          <div className="inicio-card-icon">
            <FiBookOpen />
          </div>

          <h3>
            Gestión académica
          </h3>

          <p>
            Consulta materias,
            actividades y recursos
            académicos disponibles.
          </p>
        </div>

        <div className="inicio-card">
          <div className="inicio-card-icon">
            <FiCalendar />
          </div>

          <h3>
            Actividades
          </h3>

          <p>
            Revisa fechas límite,
            entregas y seguimiento
            de las actividades.
          </p>
        </div>

        <div className="inicio-card">
          <div className="inicio-card-icon">
            <FiShield />
          </div>

          <h3>
            Acceso académico
          </h3>

          <p>
            Consulta el estado de
            tus autorizaciones y
            acceso académico.
          </p>
        </div>

        {rol ===
          "administrador" && (
          <div className="inicio-card">
            <div className="inicio-card-icon">
              <FiUsers />
            </div>

            <h3>
              Administración
            </h3>

            <p>
              Gestiona estudiantes,
              docentes, cursos y
              procesos institucionales.
            </p>
          </div>
        )}

        {rol ===
          "docente" && (
          <div className="inicio-card">
            <div className="inicio-card-icon">
              <FiClipboard />
            </div>

            <h3>
              Seguimiento
            </h3>

            <p>
              Administra actividades,
              entregas y calificaciones
              de tus estudiantes.
            </p>
          </div>
        )}

        {rol ===
          "estudiante" && (
          <div className="inicio-card">
            <div className="inicio-card-icon">
              <FiCheckCircle />
            </div>

            <h3>
              Calificaciones
            </h3>

            <p>
              Consulta las notas
              registradas para tus
              actividades académicas.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

// Pantalla de perfil
interface PerfilProps {
  nombre: string;
  apellidos: string;
  correo: string;
  codigo: string;
  rol: string;
}

function Perfil({
  nombre,
  apellidos,
  correo,
  codigo,
  rol,
}: PerfilProps) {
  return (
    <div className="perfil-page">
      <div className="perfil-card">
        {/* Encabezado */}
        <div className="perfil-header">
          <div className="perfil-avatar">
            <FiUser />
          </div>

          <div>
            <h1>
              {nombre} {apellidos}
            </h1>

            <p>
              {rol}
            </p>
          </div>
        </div>

        {/* Información */}
        <div className="perfil-grid">
          <div className="perfil-item">
            <span>
              Código de usuario
            </span>

            <strong>
              {codigo || "-"}
            </strong>
          </div>

          <div className="perfil-item">
            <span>
              Rol
            </span>

            <strong>
              {rol}
            </strong>
          </div>

          <div className="perfil-item">
            <span>
              Nombres
            </span>

            <strong>
              {nombre || "-"}
            </strong>
          </div>

          <div className="perfil-item">
            <span>
              Apellidos
            </span>

            <strong>
              {apellidos || "-"}
            </strong>
          </div>

          <div className="perfil-item">
            <span>
              Correo
            </span>

            <strong>
              {correo || "-"}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}