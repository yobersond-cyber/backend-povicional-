
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

import { useEffect, useState } from "react";
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

import { obtenerAccesos } from "../services/acceso";

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

function InicioEstudiante({
  accesoAcademicoActivo,
}: {
  accesoAcademicoActivo: boolean;
}) {
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
      requiereAcceso: true,
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
      requiereAcceso: true,
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
      requiereAcceso: true,
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
      requiereAcceso: true,
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
      requiereAcceso: true,
    },
    {
      id: "incapacidades",
      titulo: "Incapacidades",
      descripcion:
        "Envía tus incapacidades y consulta su estado.",
      textoAccion: "Abrir sección",
      ruta: "/estudiante/incapacidades",
      icono: <FiAlertCircle aria-hidden="true" />,
      color: "incapacidades",
      requiereAcceso: false,
    },
    {
      id: "apelaciones",
      titulo: "Apelaciones",
      descripcion:
        "Apela las incapacidades que hayan sido rechazadas.",
      textoAccion: "Ver apelaciones",
      ruta: "/estudiante/apelaciones",
      icono: <FiActivity aria-hidden="true" />,
      color: "apelaciones",
      requiereAcceso: false,
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
      requiereAcceso: true,
    },
  ];

  const accesosVisibles = accesosRapidos.filter(
    (acceso) =>
      accesoAcademicoActivo || !acceso.requiereAcceso,
  );

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

            <h2>
              {accesoAcademicoActivo
                ? "Tu espacio académico"
                : "Gestión de incapacidades"}
            </h2>

            <p>
              {accesoAcademicoActivo
                ? "Entra directamente a la sección que necesitas."
                : "Desde aquí puedes enviar tus incapacidades y gestionar tus apelaciones."}
            </p>
          </div>

          <span className="student-section-count">
            {accesosVisibles.length} secciones
          </span>
        </div>

        <div className="role-home-grid student-quick-grid">

          {accesosVisibles.map((acceso) => (
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

      {accesoAcademicoActivo && (
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
      )}
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
  const { usuario } = useAuth();

  const [accesoAcademicoActivo, setAccesoAcademicoActivo] =
    useState(false);

  /* ==========================================
     CONSULTAR ESTADO DEL ACCESO ACADÉMICO
     ========================================== */

  useEffect(() => {
    let componenteActivo = true;

    const consultarAccesoAcademico = async () => {
      setAccesoAcademicoActivo(false);

      // Solo las cuentas de estudiante aprobadas
      // pueden consultar y utilizar el acceso académico.
      if (
        usuario?.tipo_de_usuario !== "estudiante" ||
        usuario?.estado_aprobacion !== "aprobada"
      ) {
        return;
      }

      try {
        const accesos = await obtenerAccesos();

        const tieneAccesoActivo = accesos.some(
          (acceso) => acceso.estado === "activo",
        );

        if (componenteActivo) {
          setAccesoAcademicoActivo(tieneAccesoActivo);
        }
      } catch (error) {
        console.error(
          "Error al consultar los accesos académicos:",
          error,
        );

        if (componenteActivo) {
          setAccesoAcademicoActivo(false);
        }
      }
    };

    consultarAccesoAcademico();

    return () => {
      componenteActivo = false;
    };
  }, [
    usuario?.id_usuario,
    usuario?.tipo_de_usuario,
    usuario?.estado_aprobacion,
  ]);

  /* ==========================================
     FILTRAR MENÚ SEGÚN EL ACCESO
     ========================================== */

  const menuDisponible = accesoAcademicoActivo
    ? menu
    : menu.filter((item) =>
        ["incapacidades", "apelaciones"].includes(item.id),
      );

  /* ==========================================
     MOSTRAR SECCIÓN SEGÚN PERMISOS
     ========================================== */

  function renderSeccion(seccion: string) {
    // Mientras no exista un acceso académico activo,
    // solo se permiten incapacidades y apelaciones.
    if (
      !accesoAcademicoActivo &&
      !["incapacidades", "apelaciones"].includes(seccion)
    ) {
      return <Incapacidades />;
    }

    switch (seccion) {
      case "inicio":
        return (
          <InicioEstudiante
            accesoAcademicoActivo={accesoAcademicoActivo}
          />
        );

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
        return accesoAcademicoActivo
          ? <InicioEstudiante accesoAcademicoActivo={true} />
          : <Incapacidades />;
    }
  }

  return (
    <RoleLayout
      titulo="Estudiante"
      subtitulo="Área estudiantil"
      variante="estudiante"
      menu={menuDisponible}
      seccionInicial="incapacidades"
      renderSeccion={renderSeccion}
    />
  );
}
