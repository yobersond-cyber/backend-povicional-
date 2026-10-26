import {
  FiAlertCircle,
  FiBookOpen,
  FiCalendar,
  FiFileText,
  FiHome,
  FiPieChart,
  FiShield,
  FiUser,
  FiUsers,
} from "react-icons/fi";

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

const menu: RoleMenuItem[] = [
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
    id: "asignar-materias",
    nombre: "Asignar materias",
    icono: <FiBookOpen />,
  },
  {
    id: "cursos",
    nombre: "Cursos",
    icono: <FiBookOpen />,
  },
  {
    id: "materias",
    nombre: "Materias",
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
];

function InicioAdministrador() {
  return (
    <div className="role-home role-home-admin">
      <div className="role-home-header">
        <span className="role-home-badge">
          Administración
        </span>

        <h1>
          Panel administrativo
        </h1>

        <p>
          Gestiona estudiantes,
          docentes, cursos,
          materias y los procesos
          académicos de Aprenzy.
        </p>
      </div>

      <div className="role-home-grid">
        <div className="role-home-card">
          <FiUsers />

          <div>
            <strong>
              Estudiantes
            </strong>

            <span>
              Crear y administrar
              estudiantes.
            </span>
          </div>
        </div>

        <div className="role-home-card">
          <FiUser />

          <div>
            <strong>
              Docentes
            </strong>

            <span>
              Gestionar docentes y
              asignaciones.
            </span>
          </div>
        </div>

        <div className="role-home-card">
          <FiBookOpen />

          <div>
            <strong>
              Cursos y materias
            </strong>

            <span>
              Organizar la estructura
              académica.
            </span>
          </div>
        </div>

        <div className="role-home-card">
          <FiShield />

          <div>
            <strong>
              Accesos
            </strong>

            <span>
              Consultar los accesos
              académicos.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  function renderSeccion(
    seccion: string,
  ) {
    switch (seccion) {
      case "inicio":
        return (
          <InicioAdministrador />
        );

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

      default:
        return (
          <InicioAdministrador />
        );
    }
  }

  return (
    <RoleLayout
      titulo="Administrador"
      subtitulo="Gestión institucional"
      variante="admin"
      menu={menu}
      seccionInicial="inicio"
      renderSeccion={
        renderSeccion
      }
    />
  );
}