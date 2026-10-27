import {
  FiAlertCircle,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClipboard,
  FiFileText,
  FiHome,
  FiShield,
  FiUser,
} from "react-icons/fi";

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

function InicioEstudiante() {
  return (
    <div className="role-home role-home-estudiante">
      <div className="role-home-header">
        <span className="role-home-badge">
          Área estudiantil
        </span>

        <h1>
          Panel del estudiante
        </h1>

        <p>
          Consulta tus materias,
          actividades, materiales,
          calificaciones y estado de
          tus accesos académicos.
        </p>
      </div>

      <div className="role-home-grid">
        <div className="role-home-card">
          <FiBookOpen />

          <div>
            <strong>
              Mis materias
            </strong>

            <span>
              Consulta las materias de
              tu curso.
            </span>
          </div>
        </div>

        <div className="role-home-card">
          <FiClipboard />

          <div>
            <strong>
              Actividades
            </strong>

            <span>
              Revisa las actividades
              pendientes.
            </span>
          </div>
        </div>

        <div className="role-home-card">
          <FiCheckCircle />

          <div>
            <strong>
              Calificaciones
            </strong>

            <span>
              Consulta tus resultados
              académicos.
            </span>
          </div>
        </div>

        <div className="role-home-card">
          <FiShield />

          <div>
            <strong>
              Acceso académico
            </strong>

            <span>
              Consulta el estado y
              tiempo de tu acceso.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PerfilEstudiante() {
  return (
    <div className="role-home">
      <div className="role-home-header">
        <span className="role-home-badge">
          Perfil
        </span>

        <h1>
          Mi perfil
        </h1>

        <p>
          Consulta la información de
          tu cuenta.
        </p>
      </div>
    </div>
  );
}

export default function EstudianteLayout() {
  function renderSeccion(
    seccion: string,
  ) {
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
      renderSeccion={
        renderSeccion
      }
    />
  );
}