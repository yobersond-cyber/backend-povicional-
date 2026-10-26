import {
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClipboard,
  FiFileText,
  FiHome,
  FiUser,
} from "react-icons/fi";

import RoleLayout, {
  type RoleMenuItem,
} from "../components/layout/RoleLayout";

import Actividades from "../pages/Actividades";
import Calificaciones from "../pages/calificaciones";
import Entregas from "../pages/Entregas";
import Materiales from "../pages/Material";
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

function InicioDocente() {
  return (
    <div className="role-home role-home-docente">
      <div className="role-home-header">
        <span className="role-home-badge">
          Área docente
        </span>

        <h1>
          Panel del docente
        </h1>

        <p>
          Consulta tus materias,
          administra actividades,
          materiales, entregas y
          calificaciones.
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
              Consulta tus materias
              asignadas.
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
              Gestiona actividades
              académicas.
            </span>
          </div>
        </div>

        <div className="role-home-card">
          <FiFileText />

          <div>
            <strong>
              Materiales
            </strong>

            <span>
              Publica material para
              tus estudiantes.
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
              Gestiona las notas de
              tus estudiantes.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PerfilDocente() {
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

export default function DocenteLayout() {
  function renderSeccion(
    seccion: string,
  ) {
    switch (seccion) {
      case "inicio":
        return <InicioDocente />;

      case "materias":
        return <Materias />;

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
      renderSeccion={
        renderSeccion
      }
    />
  );
}