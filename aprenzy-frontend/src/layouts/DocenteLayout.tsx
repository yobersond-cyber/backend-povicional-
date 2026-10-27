
import {
  FiActivity,
  FiArrowRight,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClipboard,
  FiFileText,
  FiHome,
  FiUser,
  FiUsers,
} from "react-icons/fi";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import RoleLayout, {
  type RoleMenuItem,
} from "../components/layout/RoleLayout";

import Actividades from "../pages/Actividades";
import Calificaciones from "../pages/calificaciones";
import Entregas from "../pages/Entregas";
import Materiales from "../pages/Material";
import Materias from "../pages/materias";
import EstudiantesDocente from "../pages/EstudiantesDocente";

/* ==========================================
   MENÚ DEL DOCENTE
   ========================================== */

const menu: RoleMenuItem[] = [
  { id: "inicio", nombre: "Inicio", icono: <FiHome /> },
  { id: "materias", nombre: "Mis materias", icono: <FiBookOpen /> },
  { id: "estudiantes", nombre: "Mis estudiantes", icono: <FiUsers /> },
  { id: "materiales", nombre: "Materiales", icono: <FiFileText /> },
  { id: "actividades", nombre: "Actividades", icono: <FiClipboard /> },
  { id: "entregas", nombre: "Entregas", icono: <FiCalendar /> },
  { id: "calificaciones", nombre: "Calificaciones", icono: <FiCheckCircle /> },
  { id: "perfil", nombre: "Mi perfil", icono: <FiUser /> },
];

/* ==========================================
   INICIO DEL DOCENTE
   ========================================== */

function InicioDocente() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const primerNombre =
    usuario?.nombres_compl?.trim().split(/\s+/)[0] ||
    "docente";

  const fechaFormateada = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const fecha =
    fechaFormateada.charAt(0).toUpperCase() +
    fechaFormateada.slice(1);

  const accesos = [
    {
      id: "materias",
      titulo: "Mis materias",
      descripcion: "Consulta tus materias y asignaciones académicas.",
      accion: "Consultar materias",
      ruta: "/docente/materias",
      icono: <FiBookOpen />,
    },
    {
      id: "estudiantes",
      titulo: "Mis estudiantes",
      descripcion: "Consulta los estudiantes disponibles para tu cuenta.",
      accion: "Ver estudiantes",
      ruta: "/docente/estudiantes",
      icono: <FiUsers />,
    },
    {
      id: "materiales",
      titulo: "Materiales",
      descripcion: "Accede a la sección de recursos para tus estudiantes.",
      accion: "Gestionar materiales",
      ruta: "/docente/materiales",
      icono: <FiFileText />,
    },
    {
      id: "actividades",
      titulo: "Actividades",
      descripcion: "Organiza y consulta las actividades académicas.",
      accion: "Abrir actividades",
      ruta: "/docente/actividades",
      icono: <FiClipboard />,
    },
    {
      id: "entregas",
      titulo: "Entregas",
      descripcion: "Consulta la sección de seguimiento de entregas.",
      accion: "Consultar entregas",
      ruta: "/docente/entregas",
      icono: <FiCalendar />,
    },
    {
      id: "calificaciones",
      titulo: "Calificaciones",
      descripcion: "Accede a la gestión de resultados académicos.",
      accion: "Consultar calificaciones",
      ruta: "/docente/calificaciones",
      icono: <FiCheckCircle />,
    },
  ];

  return (
    <div className="role-home role-home-docente teacher-dashboard">

      <section className="role-home-header teacher-welcome">
        <div className="teacher-welcome-content">
          <span className="role-home-badge teacher-badge">
            <FiBookOpen />
            Área docente
          </span>

          <p className="teacher-eyebrow">
            Gestión académica
          </p>

          <h1>¡Bienvenido, {primerNombre}!</h1>

          <p className="teacher-description">
            Tu espacio para organizar las materias, compartir
            recursos, acompañar a tus estudiantes y gestionar
            las actividades académicas.
          </p>

          <div className="teacher-date">
            <FiCalendar />
            <span>{fecha}</span>
          </div>
        </div>

        <div className="teacher-hero-art" aria-hidden="true">
          <div className="teacher-hero-icon">
            <FiBookOpen />
          </div>
          <span className="teacher-hero-dot teacher-dot-one" />
          <span className="teacher-hero-dot teacher-dot-two" />
        </div>
      </section>

      <section className="teacher-access-section">
        <div className="teacher-section-heading">
          <div>
            <span className="teacher-section-eyebrow">
              Tu espacio de trabajo
            </span>

            <h2>Accesos rápidos</h2>

            <p>
              Entra directamente a las herramientas docentes.
            </p>
          </div>

          <span className="teacher-section-count">
            {accesos.length} secciones
          </span>
        </div>

        <div className="role-home-grid teacher-access-grid">
          {accesos.map((acceso) => (
            <button
              type="button"
              key={acceso.id}
              className="role-home-card teacher-access-card"
              onClick={() => navigate(acceso.ruta)}
            >
              <span className="teacher-access-icon">
                {acceso.icono}
              </span>

              <div className="teacher-access-copy">
                <strong>{acceso.titulo}</strong>

                <span>{acceso.descripcion}</span>

                <em>
                  {acceso.accion}
                  <FiArrowRight />
                </em>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="teacher-reminder">
        <div className="teacher-reminder-icon">
          <FiActivity />
        </div>

        <div className="teacher-reminder-copy">
          <h2>Organiza tu jornada</h2>

          <p>
            Consulta tus actividades y revisa las entregas
            para mantener organizado el seguimiento académico.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/docente/actividades")}
          className="teacher-reminder-button"
        >
          Ver actividades
          <FiArrowRight />
        </button>
      </section>
    </div>
  );
}

/* ==========================================
   PERFIL DEL DOCENTE
   ========================================== */

function PerfilDocente() {
  const { usuario } = useAuth();

  const nombreCompleto = [
    usuario?.nombres_compl,
    usuario?.apellidos_compl,
  ]
    .filter(Boolean)
    .join(" ") || "Docente";

  const datos = [
    {
      etiqueta: "Nombres",
      valor: usuario?.nombres_compl || "No registrado",
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
      etiqueta: "Código de usuario",
      valor: usuario?.codigo_usuario || "No registrado",
    },
    {
      etiqueta: "Correo electrónico",
      valor: usuario?.correo || "No registrado",
    },
    {
      etiqueta: "Teléfono",
      valor: usuario?.telefono || "No registrado",
    },
    {
      etiqueta: "Jornada",
      valor: usuario?.jornada || "No registrada",
    },
    {
      etiqueta: "Institución",
      valor:
        usuario?.id_colegio != null
          ? `Institución ${usuario.id_colegio}`
          : "No asignada",
    },
  ];

  return (
    <div className="role-home role-home-docente teacher-profile">
      <section className="teacher-profile-hero">
        <div className="teacher-profile-avatar">
          <FiUser />
        </div>

        <div>
          <span className="teacher-section-eyebrow">
            Cuenta docente
          </span>

          <h1>{nombreCompleto}</h1>

          <p>
            Consulta la información registrada en tu cuenta.
          </p>
        </div>
      </section>

      <section className="teacher-profile-panel">
        <div className="teacher-section-heading">
          <div>
            <h2>Información personal</h2>

            <p>
              Si algún dato es incorrecto, solicita su actualización
              al administrador correspondiente.
            </p>
          </div>
        </div>

        <div className="teacher-profile-grid">
          {datos.map((dato) => (
            <div
              className="teacher-profile-field"
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

/* ==========================================
   NAVEGACIÓN PRINCIPAL
   ========================================== */

export default function DocenteLayout() {
  function renderSeccion(seccion: string) {
    switch (seccion) {
      case "inicio":
        return <InicioDocente />;

      case "materias":
        return <Materias />;

      case "estudiantes":
        return <EstudiantesDocente />;

      case "materiales":
        return <Materiales />;

      case "actividades":
        return <Actividades />;

      case "entregas":
        return <Entregas />;

      case "calificaciones":
        return <Calificaciones />;

      case "perfil":
        return <PerfilDocente />;

      default:
        return <InicioDocente />;
    }
  }

  return (
    <RoleLayout
      titulo="Docente"
      subtitulo="Área docente"
      variante="docente"
      menu={menu}
      seccionInicial="inicio"
      renderSeccion={renderSeccion}
    />
  );
}
