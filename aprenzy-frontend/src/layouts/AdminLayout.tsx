import {
  FiHome,
  FiUsers,
  FiShield,
  FiBookOpen,
} from "react-icons/fi";

import RoleLayout, {
  type RoleMenuItem,
} from "../components/layout/RoleLayout";

import AdminInstituciones from "../pages/AdminInstituciones";

// ============================================
// MENÚ DEL ADMINISTRADOR GLOBAL
// ============================================

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

// ============================================
// PÁGINA INICIAL
// ============================================

function InicioAdministrador() {
  return (
    <div className="role-home role-home-admin">
      <div className="role-home-header">
        <span className="role-home-badge">
          Administración global
        </span>

        <h1>Panel del administrador</h1>

        <p>
          Administra las instituciones educativas
          de Aprenzy y las cuentas de sus
          coordinadores desde un solo lugar.
        </p>
      </div>

      <div className="role-home-grid">
        <button
          type="button"
          className="role-home-card"
          onClick={() => {
            window.location.href =
              "/administrador/instituciones";
          }}
        >
          <FiBookOpen />

          <div>
            <strong>Colegios</strong>

            <span>
              Consultar y registrar instituciones
              educativas.
            </span>
          </div>
        </button>

        <button
          type="button"
          className="role-home-card"
          onClick={() => {
            window.location.href =
              "/administrador/instituciones";
          }}
        >
          <FiUsers />

          <div>
            <strong>Coordinadores</strong>

            <span>
              Consultar y crear cuentas de
              coordinadores para los colegios.
            </span>
          </div>
        </button>

        <div className="role-home-card">
          <FiShield />

          <div>
            <strong>Acceso administrativo</strong>

            <span>
              Gestiona las instituciones desde
              tu cuenta de administrador global.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CONTENIDO DEL PANEL
// ============================================

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