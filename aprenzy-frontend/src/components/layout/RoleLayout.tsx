
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  FiCheck,
  FiChevronRight,
  FiLogOut,
  FiMenu,
  FiShield,
  FiUser,
  FiX,
} from "react-icons/fi";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

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
  renderSeccion: (seccion: string) => ReactNode;
  children?: ReactNode;
  variante:
    | "admin"
    | "coordinador"
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
  const { usuario, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [confirmarCierre, setConfirmarCierre] = useState(false);

  const baseRuta =
    variante === "admin"
      ? "/administrador"
      : `/${variante}`;

  const rutaActual =
    location.pathname.replace(/\/+$/, "") || "/";

  const seccionDeRuta =
    rutaActual === baseRuta
      ? seccionInicial
      : rutaActual.startsWith(`${baseRuta}/`)
        ? rutaActual.slice(baseRuta.length + 1)
        : seccionInicial;

  const seccionActiva = menu.some(
    (opcion) => opcion.id === seccionDeRuta,
  )
    ? seccionDeRuta
    : seccionInicial;

  const nombreUsuario =
    usuario?.nombres_compl ?? "Usuario";

  const nombreCompleto =
    `${usuario?.nombres_compl ?? ""} ${
      usuario?.apellidos_compl ?? ""
    }`.trim();

  const opcionActiva = menu.find(
    (opcion) => opcion.id === seccionActiva,
  );

  function cambiarSeccion(seccion: string) {
    const destino =
      seccion === seccionInicial
        ? baseRuta
        : `${baseRuta}/${seccion}`;

    navigate(destino);
    setMenuAbierto(false);
  }

  // Abrir la ventana personalizada de confirmación.
  function cerrarSesion() {
    setConfirmarCierre(true);
  }

  // Cerrar la sesión solamente cuando se confirme.
  function confirmarCerrarSesion() {
    setConfirmarCierre(false);
    setMenuAbierto(false);
    logout();
    navigate("/", { replace: true });
  }

  // Permitir cerrar la ventana con la tecla Escape.
  useEffect(() => {
    if (!confirmarCierre) return;

    function manejarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setConfirmarCierre(false);
      }
    }

    window.addEventListener("keydown", manejarTecla);

    return () => {
      window.removeEventListener("keydown", manejarTecla);
    };
  }, [confirmarCierre]);

  return (
    <div className={`role-layout role-${variante}`}>

      {menuAbierto && (
        <div
          className="role-layout-overlay"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {/* MENÚ LATERAL */}

      <aside
        className={`role-layout-sidebar ${
          menuAbierto ? "role-layout-sidebar-open" : ""
        }`}
      >
        <div className="role-layout-brand">
          <div className="role-layout-logo">A</div>

          <div className="role-layout-brand-info">
            <strong>Aprenzy</strong>
            <span>{subtitulo}</span>
          </div>

          <button
            type="button"
            className="role-layout-mobile-close"
            onClick={() => setMenuAbierto(false)}
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
            <strong>{nombreUsuario}</strong>
            <span>{titulo}</span>
          </div>
        </div>

        <nav className="role-layout-nav">
          <div className="role-layout-nav-title">
            Menú principal
          </div>

          {menu.map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              className={`role-layout-nav-button ${
                seccionActiva === opcion.id
                  ? "role-layout-nav-active"
                  : ""
              }`}
              onClick={() => cambiarSeccion(opcion.id)}
            >
              <span className="role-layout-nav-icon">
                {opcion.icono}
              </span>

              <span className="role-layout-nav-label">
                {opcion.nombre}
              </span>

              {seccionActiva === opcion.id && (
                <FiChevronRight className="role-layout-nav-arrow" />
              )}
            </button>
          ))}
        </nav>

        <div className="role-layout-sidebar-footer">
          <button
            type="button"
            className="role-layout-logout"
            onClick={cerrarSesion}
          >
            <FiLogOut />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}

      <main className="role-layout-main">
        <header className="role-layout-topbar">
          <div className="role-layout-topbar-left">
            <button
              type="button"
              className="role-layout-mobile-menu"
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menú"
            >
              <FiMenu />
            </button>

            <div>
              <div className="role-layout-section-title">
                {opcionActiva?.nombre ?? "Inicio"}
              </div>

              <div className="role-layout-section-subtitle">
                {titulo}
              </div>
            </div>
          </div>

          <div className="role-layout-user">
            <div className="role-layout-user-text">
              <strong>
                {nombreCompleto || nombreUsuario}
              </strong>

              <span>{usuario?.correo ?? ""}</span>
            </div>

            <div className="role-layout-avatar">
              <FiUser />
            </div>
          </div>
        </header>

        <section className="role-layout-content">
          {children}
          {renderSeccion(seccionActiva)}
        </section>
      </main>

      {/* VENTANA PERSONALIZADA PARA CERRAR SESIÓN */}

      {confirmarCierre && (
        <div
          className="role-logout-modal-overlay"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) {
              setConfirmarCierre(false);
            }
          }}
        >
          <section
            className="role-logout-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="role-logout-title"
            aria-describedby="role-logout-description"
          >
            <button
              type="button"
              className="role-logout-modal-close"
              onClick={() => setConfirmarCierre(false)}
              aria-label="Cerrar ventana"
              autoFocus
            >
              <FiX />
            </button>

            <div className="role-logout-modal-icon">
              <FiLogOut aria-hidden="true" />
            </div>

            <span className="role-logout-modal-eyebrow">
              APRENZY
            </span>

            <h2 id="role-logout-title">
              ¿Deseas cerrar sesión?
            </h2>

            <p id="role-logout-description">
              Tu sesión actual se cerrará y volverás a la
              pantalla de inicio de sesión. Si todavía
              necesitas trabajar, puedes continuar en Aprenzy.
            </p>

            <div className="role-logout-modal-user">
              <span className="role-logout-modal-user-icon">
                <FiShield aria-hidden="true" />
              </span>

              <span>
                <strong>{nombreCompleto || nombreUsuario}</strong>
                <small>{titulo}</small>
              </span>
            </div>

            <div className="role-logout-modal-actions">
              <button
                type="button"
                className="role-logout-cancel"
                onClick={() => setConfirmarCierre(false)}
              >
                Seguir en Aprenzy
              </button>

              <button
                type="button"
                className="role-logout-confirm"
                onClick={confirmarCerrarSesion}
              >
                <FiCheck aria-hidden="true" />
                Sí, cerrar sesión
              </button>
            </div>

            <div className="role-logout-modal-footer">
              <FiShield aria-hidden="true" />
              Tu sesión está bajo tu control.
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
