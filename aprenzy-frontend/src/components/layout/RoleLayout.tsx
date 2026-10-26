import {
  useState,
  type ReactNode,
} from "react";

import {
  FiChevronRight,
  FiLogOut,
  FiMenu,
  FiUser,
  FiX,
} from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";

export interface RoleMenuItem {
  id: string;
  nombre: string;
  icono: ReactNode;
}

interface RoleLayoutProps {
  titulo: string;
  subtitulo: string;
  menu: RoleMenuItem[];
  seccionInicial: string;
  renderSeccion: (
    seccion: string,
  ) => ReactNode;
  children?: ReactNode;
  variante:
    | "admin"
    | "docente"
    | "estudiante";
}

export default function RoleLayout({
  titulo,
  subtitulo,
  menu,
  seccionInicial,
  renderSeccion,
  children,
  variante,
}: RoleLayoutProps) {
  const {
    usuario,
    logout,
  } = useAuth();

  const [
    seccionActiva,
    setSeccionActiva,
  ] = useState(
    seccionInicial,
  );

  const [
    menuAbierto,
    setMenuAbierto,
  ] = useState(false);

  const nombreUsuario =
    usuario?.nombres_compl ??
    "Usuario";

  const nombreCompleto =
    `${usuario?.nombres_compl ?? ""} ${
      usuario?.apellidos_compl ?? ""
    }`.trim();

  const opcionActiva =
    menu.find(
      (opcion) =>
        opcion.id ===
        seccionActiva,
    );

  function cambiarSeccion(
    seccion: string,
  ) {
    setSeccionActiva(seccion);
    setMenuAbierto(false);
  }

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

  return (
    <div
      className={`role-layout role-${variante}`}
    >
      {menuAbierto && (
        <div
          className="role-layout-overlay"
          onClick={() =>
            setMenuAbierto(false)
          }
        />
      )}

      <aside
        className={`role-layout-sidebar ${
          menuAbierto
            ? "role-layout-sidebar-open"
            : ""
        }`}
      >
        <div className="role-layout-brand">
          <div className="role-layout-logo">
            A
          </div>

          <div className="role-layout-brand-info">
            <strong>
              Aprenzy
            </strong>

            <span>
              {subtitulo}
            </span>
          </div>

          <button
            type="button"
            className="role-layout-mobile-close"
            onClick={() =>
              setMenuAbierto(false)
            }
            aria-label="Cerrar menú"
          >
            <FiX />
          </button>
        </div>

        <div className="role-layout-role-card">
          <div className="role-layout-role-icon">
            <FiUser />
          </div>

          <div>
            <strong>
              {nombreUsuario}
            </strong>

            <span>
              {titulo}
            </span>
          </div>
        </div>

        <nav className="role-layout-nav">
          <div className="role-layout-nav-title">
            Menú principal
          </div>

          {menu.map(
            (opcion) => (
              <button
                key={opcion.id}
                type="button"
                className={`role-layout-nav-button ${
                  seccionActiva ===
                  opcion.id
                    ? "role-layout-nav-active"
                    : ""
                }`}
                onClick={() =>
                  cambiarSeccion(
                    opcion.id,
                  )
                }
              >
                <span className="role-layout-nav-icon">
                  {opcion.icono}
                </span>

                <span className="role-layout-nav-label">
                  {opcion.nombre}
                </span>

                {seccionActiva ===
                  opcion.id && (
                  <FiChevronRight className="role-layout-nav-arrow" />
                )}
              </button>
            ),
          )}
        </nav>

        <div className="role-layout-sidebar-footer">
          <button
            type="button"
            className="role-layout-logout"
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

      <main className="role-layout-main">
        <header className="role-layout-topbar">
          <div className="role-layout-topbar-left">
            <button
              type="button"
              className="role-layout-mobile-menu"
              onClick={() =>
                setMenuAbierto(true)
              }
              aria-label="Abrir menú"
            >
              <FiMenu />
            </button>

            <div>
              <div className="role-layout-section-title">
                {opcionActiva?.nombre ??
                  "Inicio"}
              </div>

              <div className="role-layout-section-subtitle">
                {titulo}
              </div>
            </div>
          </div>

          <div className="role-layout-user">
            <div className="role-layout-user-text">
              <strong>
                {nombreCompleto ||
                  nombreUsuario}
              </strong>

              <span>
                {usuario?.correo ??
                  ""}
              </span>
            </div>

            <div className="role-layout-avatar">
              <FiUser />
            </div>
          </div>
        </header>

        <section className="role-layout-content">
          {children}

          {renderSeccion(
            seccionActiva,
          )}
        </section>
      </main>
    </div>
  );
}