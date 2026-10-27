
import {
  FiAlertCircle,
  FiArrowRight,
  FiBookOpen,
  FiCalendar,
  FiFileText,
  FiHome,
  FiPieChart,
  FiShield,
  FiUser,
  FiUsers,
} from "react-icons/fi";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import RoleLayout, {
  type RoleMenuItem,
} from "../components/layout/RoleLayout";

import Accesos from "../pages/Accesos";
import Apelaciones from "../pages/Apelaciones";
import AsignarMaterias from "../pages/AsignarMaterias";
import Cursos from "../pages/Curso";
import Docentes from "../pages/Docentes";
import Estadisticas from "../pages/Estadisticas";
import Estudiantes from "../pages/Estudiantes";
import Historial from "../pages/Historial";
import Incapacidades from "../pages/Incapacidades";
import Materias from "../pages/materias";

/* ==========================================
   MENÚ DEL COORDINADOR
   ========================================== */

const menu: RoleMenuItem[] = [
  { id: "inicio", nombre: "Inicio", icono: <FiHome /> },
  { id: "estudiantes", nombre: "Estudiantes", icono: <FiUsers /> },
  { id: "docentes", nombre: "Docentes", icono: <FiUser /> },
  { id: "asignar-materias", nombre: "Asignar materias", icono: <FiBookOpen /> },
  { id: "cursos", nombre: "Cursos", icono: <FiBookOpen /> },
  { id: "materias", nombre: "Materias", icono: <FiBookOpen /> },
  { id: "incapacidades", nombre: "Incapacidades", icono: <FiAlertCircle /> },
  { id: "apelaciones", nombre: "Apelaciones", icono: <FiFileText /> },
  { id: "accesos", nombre: "Accesos", icono: <FiShield /> },
  { id: "historial", nombre: "Historial", icono: <FiCalendar /> },
  { id: "estadisticas", nombre: "Estadísticas", icono: <FiPieChart /> },
  { id: "perfil", nombre: "Mi perfil", icono: <FiUser /> },
];

/* ==========================================
   INICIO
   ========================================== */

function InicioCoordinador() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const primerNombre =
    usuario?.nombres_compl?.trim().split(/\s+/)[0] ||
    "coordinador";

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
      id: "estudiantes",
      titulo: "Estudiantes",
      descripcion: "Consulta y administra las cuentas estudiantiles.",
      accion: "Gestionar estudiantes",
      ruta: "/coordinador/estudiantes",
      icono: <FiUsers />,
    },
    {
      id: "docentes",
      titulo: "Docentes",
      descripcion: "Administra la información de los docentes.",
      accion: "Gestionar docentes",
      ruta: "/coordinador/docentes",
      icono: <FiUser />,
    },
    {
      id: "cursos",
      titulo: "Cursos",
      descripcion: "Organiza los cursos de tu institución.",
      accion: "Consultar cursos",
      ruta: "/coordinador/cursos",
      icono: <FiBookOpen />,
    },
    {
      id: "asignar-materias",
      titulo: "Asignar materias",
      descripcion: "Accede a la asignación académica.",
      accion: "Administrar asignaciones",
      ruta: "/coordinador/asignar-materias",
      icono: <FiFileText />,
    },
    {
      id: "incapacidades",
      titulo: "Incapacidades",
      descripcion: "Consulta la sección de incapacidades.",
      accion: "Consultar registros",
      ruta: "/coordinador/incapacidades",
      icono: <FiAlertCircle />,
    },
    {
      id: "estadisticas",
      titulo: "Estadísticas",
      descripcion: "Consulta los indicadores disponibles.",
      accion: "Ver estadísticas",
      ruta: "/coordinador/estadisticas",
      icono: <FiPieChart />,
    },
  ];

  return (
    <div className="role-home role-home-coordinador coordinator-dashboard">

      <section className="coordinator-welcome">
        <div className="coordinator-welcome-content">

          <span className="coordinator-badge">
            <FiBookOpen aria-hidden="true" />
            Gestión académica
          </span>

          <p className="coordinator-eyebrow">
            Administración institucional
          </p>

          <h1>¡Bienvenido, {primerNombre}!</h1>

          <p className="coordinator-description">
            Organiza los procesos académicos, gestiona docentes
            y estudiantes, y consulta la información de tu institución
            desde un solo lugar.
          </p>

          <div className="coordinator-date">
            <FiCalendar aria-hidden="true" />
            <span>{fecha}</span>
          </div>
        </div>

        <div className="coordinator-hero-art" aria-hidden="true">
          <div className="coordinator-hero-icon">
            <FiBookOpen />
          </div>
          <span className="coordinator-dot coordinator-dot-one" />
          <span className="coordinator-dot coordinator-dot-two" />
        </div>
      </section>

      <section className="coordinator-access-section">

        <div className="coordinator-section-heading">
          <div>
            <span className="coordinator-section-eyebrow">
              Centro de gestión
            </span>

            <h2>Accesos principales</h2>

            <p>
              Selecciona una herramienta para continuar tu trabajo.
            </p>
          </div>

          <span className="coordinator-section-count">
            {accesos.length} secciones
          </span>
        </div>

        <div className="coordinator-access-grid">
          {accesos.map((acceso) => (
            <button
              type="button"
              key={acceso.id}
              className="coordinator-access-card"
              onClick={() => navigate(acceso.ruta)}
            >
              <span className="coordinator-access-icon">
                {acceso.icono}
              </span>

              <span className="coordinator-access-copy">
                <strong>{acceso.titulo}</strong>

                <span>{acceso.descripcion}</span>

                <em>
                  {acceso.accion}
                  <FiArrowRight aria-hidden="true" />
                </em>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="coordinator-reminder">
        <div className="coordinator-reminder-icon">
          <FiShield aria-hidden="true" />
        </div>

        <div className="coordinator-reminder-copy">
          <h2>Mantén organizada tu institución</h2>

          <p>
            Revisa periódicamente los registros y las asignaciones
            para mantener actualizada la gestión académica.
          </p>
        </div>

        <button
          type="button"
          className="coordinator-reminder-button"
          onClick={() => navigate("/coordinador/historial")}
        >
          Ver historial
          <FiArrowRight aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}

/* ==========================================
   PERFIL
   ========================================== */

function PerfilCoordinador() {
  const { usuario } = useAuth();

  const nombreCompleto = [
    usuario?.nombres_compl,
    usuario?.apellidos_compl,
  ]
    .filter(Boolean)
    .join(" ") || "Coordinador";

  const datos = [
    { etiqueta: "Nombres", valor: usuario?.nombres_compl || "No registrados" },
    { etiqueta: "Apellidos", valor: usuario?.apellidos_compl || "No registrados" },
    { etiqueta: "Documento", valor: usuario?.documento || "No registrado" },
    { etiqueta: "Código de usuario", valor: usuario?.codigo_usuario || "No registrado" },
    { etiqueta: "Correo", valor: usuario?.correo || "No registrado" },
    { etiqueta: "Teléfono", valor: usuario?.telefono || "No registrado" },
    {
      etiqueta: "Institución",
      valor: usuario?.id_colegio != null
        ? `Institución ${usuario.id_colegio}`
        : "No asignada",
    },
  ];

  return (
    <div className="role-home role-home-coordinador coordinator-profile">
      <section className="coordinator-profile-hero">
        <div className="coordinator-profile-avatar">
          <FiUser aria-hidden="true" />
        </div>

        <div>
          <span className="coordinator-section-eyebrow">
            Perfil de usuario
          </span>

          <h1>{nombreCompleto}</h1>

          <p>
            Consulta los datos registrados de tu cuenta.
          </p>
        </div>
      </section>

      <section className="coordinator-profile-panel">
        <h2>Información personal</h2>

        <p className="coordinator-profile-description">
          Si necesitas corregir tus datos, solicita la actualización
          al administrador correspondiente.
        </p>

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

/* ==========================================
   NAVEGACIÓN PRINCIPAL
   ========================================== */

export default function CoordinadorLayout() {
  function renderSeccion(seccion: string) {
    switch (seccion) {
      case "inicio":
        return <InicioCoordinador />;

      case "estudiantes":
        return <Estudiantes />;

      case "docentes":
        return <Docentes />;

      case "asignar-materias":
        return <AsignarMaterias />;

      case "cursos":
        return <Cursos />;

      case "materias":
        return <Materias />;

      case "incapacidades":
        return <Incapacidades />;

      case "apelaciones":
        return <Apelaciones />;

      case "accesos":
        return <Accesos />;

      case "historial":
        return <Historial />;

      case "estadisticas":
        return <Estadisticas />;

      case "perfil":
        return <PerfilCoordinador />;

      default:
        return <InicioCoordinador />;
    }
  }

  return (
    <RoleLayout
      titulo="Coordinador"
      subtitulo="Gestión académica"
      variante="coordinador"
      menu={menu}
      seccionInicial="inicio"
      renderSeccion={renderSeccion}
    />
  );
}
