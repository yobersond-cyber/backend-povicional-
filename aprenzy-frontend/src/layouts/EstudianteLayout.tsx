
import {
  FiActivity,
  FiAlertCircle,
  FiArrowRight,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClipboard,
  FiFileText,
  FiHome,
  FiShield,
  FiUser,
} from "react-icons/fi";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import RoleLayout, {
  type RoleMenuItem,
} from "../components/layout/RoleLayout";

import Accesos from "../pages/Accesos";
import ActividadesEstudiante from "../pages/ActividadesEstudiante";
import Apelaciones from "../pages/Apelaciones";
import CalificacionesEstudiante from "../pages/CalificacionesEstudiante";
import Entregas from "../pages/Entregas";
import Incapacidades from "../pages/Incapacidades";
import MaterialesEstudiante from "../pages/MaterialesEstudiante";
import Materias from "../pages/materias";

/* ==========================================
   MENÚ DEL ESTUDIANTE
   ========================================== */

const menu: RoleMenuItem[] = [
  {
    id: "inicio",
    nombre: "Inicio",
    icono: <FiHome />,
  },
  {
    id: "materias",
    nombre: "Mis materias",
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
    nombre: "Mis accesos",
    icono: <FiShield />,
  },
  {
    id: "perfil",
    nombre: "Mi perfil",
    icono: <FiUser />,
  },
];

/* ==========================================
   PANEL PRINCIPAL DEL ESTUDIANTE
   ========================================== */

function InicioEstudiante() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const primerNombre =
    usuario?.nombres_compl?.trim().split(/\s+/)[0] ||
    "estudiante";

  const fechaSinCapitalizar = new Intl.DateTimeFormat(
    "es-CO",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).format(new Date());

  const fechaActual =
    fechaSinCapitalizar.charAt(0).toUpperCase() +
    fechaSinCapitalizar.slice(1);

  const accesosRapidos = [
    {
      id: "materias",
      titulo: "Mis materias",
      descripcion:
        "Revisa las materias y la información de tu curso.",
      textoAccion: "Consultar materias",
      ruta: "/estudiante/materias",
      icono: <FiBookOpen aria-hidden="true" />,
      color: "materias",
    },
    {
      id: "materiales",
      titulo: "Materiales",
      descripcion:
        "Encuentra los recursos y documentos compartidos por tus docentes.",
      textoAccion: "Ver materiales",
      ruta: "/estudiante/materiales",
      icono: <FiFileText aria-hidden="true" />,
      color: "materiales",
    },
    {
      id: "actividades",
      titulo: "Actividades",
      descripcion:
        "Consulta las actividades académicas y sus instrucciones.",
      textoAccion: "Ver actividades",
      ruta: "/estudiante/actividades",
      icono: <FiClipboard aria-hidden="true" />,
      color: "actividades",
    },
    {
      id: "calificaciones",
      titulo: "Calificaciones",
      descripcion:
        "Revisa la información disponible sobre tus resultados.",
      textoAccion: "Consultar notas",
      ruta: "/estudiante/calificaciones",
      icono: <FiCheckCircle aria-hidden="true" />,
      color: "calificaciones",
    },
    {
      id: "entregas",
      titulo: "Entregas",
      descripcion:
        "Consulta el seguimiento de tus entregas académicas.",
      textoAccion: "Revisar entregas",
      ruta: "/estudiante/entregas",
      icono: <FiCalendar aria-hidden="true" />,
      color: "entregas",
    },
    {
      id: "incapacidades",
      titulo: "Incapacidades",
      descripcion:
        "Consulta y gestiona la información de tus incapacidades.",
      textoAccion: "Abrir sección",
      ruta: "/estudiante/incapacidades",
      icono: <FiAlertCircle aria-hidden="true" />,
      color: "incapacidades",
    },
    {
      id: "apelaciones",
      titulo: "Apelaciones",
      descripcion:
        "Consulta el estado de las apelaciones que hayas registrado.",
      textoAccion: "Ver apelaciones",
      ruta: "/estudiante/apelaciones",
      icono: <FiActivity aria-hidden="true" />,
      color: "apelaciones",
    },
    {
      id: "accesos",
      titulo: "Mis accesos",
      descripcion:
        "Consulta la información de acceso a los servicios académicos.",
      textoAccion: "Revisar accesos",
      ruta: "/estudiante/accesos",
      icono: <FiShield aria-hidden="true" />,
      color: "accesos",
    },
  ];

  return (
    <div className="role-home role-home-estudiante student-dashboard">

      {/* ENCABEZADO DE BIENVENIDA */}

      <section className="role-home-header student-welcome">
        <div className="student-welcome-content">

          <span className="role-home-badge student-welcome-badge">
            <FiBookOpen aria-hidden="true" />
            Área estudiantil
          </span>

          <p className="student-welcome-eyebrow">
            Tu espacio de aprendizaje
          </p>

          <h1>
            ¡Hola, {primerNombre}!
          </h1>

          <p className="student-welcome-description">
            Organiza tu jornada, encuentra tus materiales
            y mantente al día con las actividades de Aprenzy.
          </p>

          <div className="student-welcome-date">
            <FiCalendar aria-hidden="true" />
            <span>{fechaActual}</span>
          </div>

        </div>

        <div
          className="student-welcome-art"
          aria-hidden="true"
        >
          <div className="student-welcome-art-circle">
            <FiBookOpen />
          </div>

          <span className="student-welcome-art-dot student-welcome-art-dot-one" />

          <span className="student-welcome-art-dot student-welcome-art-dot-two" />
        </div>
      </section>

      {/* ACCESOS RÁPIDOS */}

      <section className="student-shortcuts-section">

        <div className="student-section-heading">
          <div>
            <span className="student-section-eyebrow">
              Accesos rápidos
            </span>

            <h2>Tu espacio académico</h2>

            <p>
              Entra directamente a la sección que necesitas.
            </p>
          </div>

          <span className="student-section-count">
            {accesosRapidos.length} secciones
          </span>
        </div>

        <div className="role-home-grid student-quick-grid">

          {accesosRapidos.map((acceso) => (
            <button
              key={acceso.id}
              type="button"
              className={
                `role-home-card student-quick-card ` +
                `student-quick-card-${acceso.color}`
              }
              onClick={() => navigate(acceso.ruta)}
              aria-label={
                `${acceso.titulo}: ${acceso.textoAccion}`
              }
            >
              <span className="student-quick-icon">
                {acceso.icono}
              </span>

              <div className="student-quick-copy">

                <strong>
                  {acceso.titulo}
                </strong>

                <span>
                  {acceso.descripcion}
                </span>

                <em>
                  {acceso.textoAccion}
                  <FiArrowRight aria-hidden="true" />
                </em>

              </div>
            </button>
          ))}

        </div>
      </section>

      {/* CONSEJO PARA EL ESTUDIANTE */}

      <section className="student-study-note">

        <div className="student-study-note-icon">
          <FiCheckCircle aria-hidden="true" />
        </div>

        <div>
          <h2>Un consejo para tu jornada</h2>

          <p>
            Revisa primero las actividades y sus fechas.
            Después consulta los materiales de apoyo
            para planear tus entregas con tiempo.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate("/estudiante/actividades")
          }
          className="student-study-note-button"
        >
          Ver actividades
          <FiArrowRight aria-hidden="true" />
        </button>

      </section>
    </div>
  );
}

/* ==========================================
   PERFIL DEL ESTUDIANTE
   ========================================== */

function PerfilEstudiante() {
  const { usuario } = useAuth();

  const nombreCompleto = [
    usuario?.nombres_compl,
    usuario?.apellidos_compl,
  ]
    .filter(Boolean)
    .join(" ") || "Estudiante";

  const datosPerfil = [
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
    <div className="role-home role-home-estudiante student-profile-page">

      <section className="student-profile-hero">
        <div className="student-profile-avatar">
          <FiUser aria-hidden="true" />
        </div>

        <div>
          <span className="student-section-eyebrow">
            Perfil personal
          </span>

          <h1>{nombreCompleto}</h1>

          <p>
            Consulta los datos registrados en tu cuenta de Aprenzy.
          </p>
        </div>
      </section>

      <section className="student-profile-panel">

        <div className="student-section-heading">
          <div>
            <h2>Información de tu cuenta</h2>

            <p>
              Si algún dato no es correcto, comunícate
              con el coordinador de tu institución.
            </p>
          </div>
        </div>

        <div className="student-profile-grid">

          {datosPerfil.map((dato) => (
            <div
              className="student-profile-field"
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
   NAVEGACIÓN DEL ESTUDIANTE
   ========================================== */

export default function EstudianteLayout() {

  function renderSeccion(seccion: string) {
    switch (seccion) {
      case "inicio":
        return <InicioEstudiante />;

      case "materias":
        return <Materias />;

      case "materiales":
        return <MaterialesEstudiante />;

      case "actividades":
        return <ActividadesEstudiante />;

      case "calificaciones":
        return <CalificacionesEstudiante />;

      case "entregas":
        return <Entregas />;

      case "incapacidades":
        return <Incapacidades />;

      case "apelaciones":
        return <Apelaciones />;

      case "accesos":
        return <Accesos />;

      case "perfil":
        return <PerfilEstudiante />;

      default:
        return <InicioEstudiante />;
    }
  }

  return (
    <RoleLayout
      titulo="Estudiante"
      subtitulo="Área estudiantil"
      variante="estudiante"
      menu={menu}
      seccionInicial="inicio"
      renderSeccion={renderSeccion}
    />
  );
}
