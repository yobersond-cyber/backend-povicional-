import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

import {
  actualizarEstadoColegio,
  crearColegio,
  listarColegios,
  obtenerColegio,
  type Colegio,
  type DatosColegio,
  type DatosRector,
  type EstadoColegio,
} from "../services/administracion";

type Vista = "colegios" | "crear-colegio" | "detalle";

const colegioVacio = (): DatosColegio => ({
  nombre_colegio: "",
  codigo_dane: "",
  nit: "",
  direccion: "",
  telefono: "",
  correo_institucional: "",
  municipio: "",
  departamento: "",
});

const rectorVacio = (): DatosRector => ({
  documento: "",
  nombres_compl: "",
  apellidos_compl: "",
  telefono: "",
  correo: "",
  contrasena: "",
});

function mensajeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Ocurrió un error inesperado.";
}

function normalizarTexto(valor: string | null | undefined) {
  return (valor ?? "").trim().toLowerCase();
}

export default function AdminInstituciones() {
  const [vista, setVista] = useState<Vista>("colegios");

  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [colegioForm, setColegioForm] =
    useState<DatosColegio>(colegioVacio());
  const [rectorForm, setRectorForm] =
    useState<DatosRector>(rectorVacio());

  const [colegioSeleccionado, setColegioSeleccionado] =
    useState<Colegio | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [detalleCargando, setDetalleCargando] = useState(false);
  const [actualizandoEstado, setActualizandoEstado] = useState(false);

  const [mostrarContrasena, setMostrarContrasena] =
    useState(false);

  const [nuevoEstado, setNuevoEstado] =
    useState<EstadoColegio>("activo");

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function cargarDatos() {
    setCargando(true);
    setError("");

    try {
      const datos = await listarColegios();
      setColegios(datos);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargarDatos();
  }, []);

  function cambiarVista(nuevaVista: Vista) {
    setVista(nuevaVista);
    setError("");
    setMensaje("");
    setBusqueda("");
  }

  async function consultarColegio(idColegio: number) {
    setDetalleCargando(true);
    setError("");
    setMensaje("");

    try {
      const detalle = await obtenerColegio(idColegio);

      setColegioSeleccionado(detalle);
      setNuevoEstado(detalle.estado);
      setVista("detalle");
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setDetalleCargando(false);
    }
  }

  async function guardarColegio(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();
    setError("");
    setMensaje("");

    if (!colegioForm.nombre_colegio.trim()) {
      setError("El nombre del colegio es obligatorio.");
      return;
    }

    if (
      !rectorForm.documento.trim() ||
      !rectorForm.nombres_compl.trim() ||
      !rectorForm.apellidos_compl.trim() ||
      !rectorForm.telefono.trim() ||
      !rectorForm.correo.trim() ||
      !rectorForm.contrasena
    ) {
      setError("Completa todos los campos obligatorios del rector.");
      return;
    }

    if (rectorForm.contrasena.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setGuardando(true);

    try {
      await crearColegio({
        colegio: {
          nombre_colegio: colegioForm.nombre_colegio.trim(),
          codigo_dane: colegioForm.codigo_dane?.trim() || null,
          nit: colegioForm.nit?.trim() || null,
          direccion: colegioForm.direccion?.trim() || null,
          telefono: colegioForm.telefono?.trim() || null,
          correo_institucional:
            colegioForm.correo_institucional?.trim() || null,
          municipio: colegioForm.municipio?.trim() || null,
          departamento: colegioForm.departamento?.trim() || null,
        },
        rector: {
          documento: rectorForm.documento.trim(),
          nombres_compl: rectorForm.nombres_compl.trim(),
          apellidos_compl: rectorForm.apellidos_compl.trim(),
          telefono: rectorForm.telefono.trim(),
          correo: rectorForm.correo.trim(),
          contrasena: rectorForm.contrasena,
        },
      });

      setColegioForm(colegioVacio());
      setRectorForm(rectorVacio());
      setMostrarContrasena(false);

      await cargarDatos();

      setMensaje(
        "El colegio y su rector se crearon correctamente.",
      );
      setVista("colegios");
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function guardarEstadoColegio() {
    if (!colegioSeleccionado) return;

    if (nuevoEstado === colegioSeleccionado.estado) {
      setMensaje("El colegio ya tiene ese estado.");
      setError("");
      return;
    }

    setActualizandoEstado(true);
    setError("");
    setMensaje("");

    try {
      const actualizado = await actualizarEstadoColegio(
        colegioSeleccionado.id_colegio,
        nuevoEstado,
      );

      setColegioSeleccionado(actualizado);

      setColegios((actuales) =>
        actuales.map((colegio) =>
          colegio.id_colegio === actualizado.id_colegio
            ? actualizado
            : colegio,
        ),
      );

      setMensaje(
        nuevoEstado === "activo"
          ? "El colegio fue activado correctamente."
          : "El colegio fue desactivado correctamente.",
      );
    } catch (err) {
      setError(mensajeError(err));
      setNuevoEstado(colegioSeleccionado.estado);
    } finally {
      setActualizandoEstado(false);
    }
  }

  const colegiosFiltrados = colegios.filter((colegio) => {
    const texto = normalizarTexto(busqueda);

    return (
      normalizarTexto(colegio.nombre_colegio).includes(texto) ||
      normalizarTexto(colegio.codigo_dane).includes(texto) ||
      normalizarTexto(colegio.nit).includes(texto) ||
      normalizarTexto(colegio.municipio).includes(texto) ||
      normalizarTexto(colegio.departamento).includes(texto)
    );
  });

  const colegiosActivos = colegios.filter(
    (colegio) => colegio.estado === "activo",
  );

  const colegiosInactivos = colegios.filter(
    (colegio) => colegio.estado === "inactivo",
  );

  return (
    <div className="admin-instituciones">
      <style>{`
        .admin-instituciones {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 4px 0 28px;
          color: #1e293b;
          box-sizing: border-box;
        }

        .admin-instituciones * {
          box-sizing: border-box;
        }

        .ai-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .ai-eyebrow {
          color: #4f46e5;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.1px;
          text-transform: uppercase;
        }

        .ai-title {
          margin: 8px 0;
          color: #0f172a;
          font-size: clamp(24px, 3vw, 32px);
        }

        .ai-subtitle {
          max-width: 650px;
          margin: 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .ai-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 22px;
        }

        .ai-stat {
          min-width: 0;
          padding: 19px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
        }

        .ai-stat-label {
          margin-bottom: 10px;
          color: #64748b;
          font-size: 13px;
        }

        .ai-stat-number {
          color: #0f172a;
          font-size: 29px;
          line-height: 1;
          font-weight: 800;
        }

        .ai-tabs {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 6px;
          margin-bottom: 18px;
        }

        .ai-tab {
          padding: 11px 15px;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          background: #fff;
          color: #475569;
          cursor: pointer;
          white-space: nowrap;
          font-size: 13px;
          font-weight: 600;
        }

        .ai-tab:hover {
          border-color: #a5b4fc;
          color: #4338ca;
        }

        .ai-tab-active {
          border-color: #4f46e5;
          background: #4f46e5;
          color: #fff;
        }

        .ai-panel {
          min-width: 0;
          padding: 22px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #fff;
        }

        .ai-panel-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .ai-panel-heading h2 {
          margin: 0 0 6px;
          color: #0f172a;
          font-size: 19px;
        }

        .ai-panel-heading p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }

        .ai-search {
          width: 100%;
          max-width: 360px;
          padding: 11px 13px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          outline: none;
          font-size: 14px;
        }

        .ai-search:focus,
        .ai-field input:focus,
        .ai-field select:focus,
        .ai-state-select:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px #6366f11c;
        }

        .ai-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .ai-table {
          width: 100%;
          min-width: 650px;
          border-collapse: collapse;
          font-size: 13px;
        }

        .ai-table th {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #64748b;
          text-align: left;
          white-space: nowrap;
          font-weight: 700;
        }

        .ai-table td {
          padding: 14px 12px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .ai-table tr:last-child td {
          border-bottom: none;
        }

        .ai-muted {
          margin-top: 4px;
          color: #64748b;
          font-size: 12px;
        }

        .ai-status {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 30px;
          background: #f1f5f9;
          color: #475569;
          font-size: 11px;
          font-weight: 700;
          text-transform: capitalize;
        }

        .ai-status-active {
          background: #dcfce7;
          color: #166534;
        }

        .ai-status-inactive {
          background: #fee2e2;
          color: #991b1b;
        }

        .ai-button {
          padding: 10px 13px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #fff;
          color: #334155;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
        }

        .ai-button:hover {
          background: #f8fafc;
        }

        .ai-button-primary {
          border-color: #4f46e5;
          background: #4f46e5;
          color: #fff;
        }

        .ai-button-primary:hover {
          background: #4338ca;
        }

        .ai-button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .ai-form {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 17px;
        }

        .ai-field {
          display: flex;
          flex-direction: column;
          min-width: 0;
          gap: 7px;
        }

        .ai-field label {
          color: #334155;
          font-size: 13px;
          font-weight: 700;
        }

        .ai-field input,
        .ai-field select,
        .ai-state-select {
          width: 100%;
          min-width: 0;
          padding: 11px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #fff;
          color: #0f172a;
          outline: none;
          font: inherit;
          font-size: 14px;
        }

        .ai-span,
        .ai-form-section,
        .ai-form-actions {
          grid-column: 1 / -1;
        }

        .ai-form-section {
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          margin-top: 4px;
        }

        .ai-form-section h3 {
          margin: 0 0 5px;
          color: #0f172a;
          font-size: 16px;
        }

        .ai-form-section p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }

        .ai-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          padding-top: 8px;
        }

        .ai-alert {
          padding: 13px 15px;
          border-radius: 9px;
          margin-bottom: 17px;
          font-size: 13px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .ai-alert-error {
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #991b1b;
        }

        .ai-alert-success {
          border: 1px solid #bbf7d0;
          background: #f0fdf4;
          color: #166534;
        }

        .ai-empty {
          padding: 35px 15px;
          color: #64748b;
          text-align: center;
          font-size: 14px;
        }

        .ai-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .ai-detail-item span {
          display: block;
          margin-bottom: 5px;
          color: #64748b;
          font-size: 12px;
        }

        .ai-detail-item strong {
          color: #0f172a;
          overflow-wrap: anywhere;
          font-size: 14px;
        }

        .ai-state-box {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          flex-wrap: wrap;
          padding: 17px;
          border: 1px solid #e2e8f0;
          border-radius: 11px;
          background: #f8fafc;
          margin-bottom: 22px;
        }

        .ai-state-field {
          flex: 1;
          min-width: 190px;
          max-width: 340px;
        }

        .ai-state-field label {
          display: block;
          margin-bottom: 7px;
          color: #334155;
          font-size: 13px;
          font-weight: 700;
        }

        .ai-password-control {
          position: relative;
          display: flex;
          align-items: center;
        }

        .ai-password-control input {
          padding-right: 46px;
        }

        .ai-password-toggle {
          position: absolute;
          right: 5px;
          display: grid;
          width: 36px;
          height: 36px;
          place-items: center;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          font-size: 18px;
        }

        .ai-password-toggle:hover {
          background: #f1f5f9;
          color: #4338ca;
        }

        @media (max-width: 720px) {
          .ai-stats {
            grid-template-columns: 1fr;
          }

          .ai-form,
          .ai-detail-grid {
            grid-template-columns: 1fr;
          }

          .ai-panel {
            padding: 15px;
          }

          .ai-form-section,
          .ai-form-actions,
          .ai-span {
            grid-column: 1;
          }

          .ai-form-actions {
            flex-wrap: wrap;
          }

          .ai-form-actions button {
            flex: 1;
          }

          .ai-search {
            max-width: none;
          }

          .ai-state-field {
            max-width: none;
          }

          .ai-state-box > button {
            width: 100%;
          }
        }
      `}</style>

      <header className="ai-header">
        <div>
          <span className="ai-eyebrow">
            Administración global
          </span>

          <h1 className="ai-title">
            Colegios y rectores
          </h1>

          <p className="ai-subtitle">
            Administra las instituciones de APRENZY y registra
            el rector responsable de cada colegio.
          </p>
        </div>

        <button
          type="button"
          className="ai-button"
          onClick={() => void cargarDatos()}
          disabled={cargando}
        >
          {cargando ? "Actualizando..." : "Actualizar datos"}
        </button>
      </header>

      <section className="ai-stats">
        <div className="ai-stat">
          <div className="ai-stat-label">Total de colegios</div>
          <div className="ai-stat-number">{colegios.length}</div>
        </div>

        <div className="ai-stat">
          <div className="ai-stat-label">Colegios activos</div>
          <div className="ai-stat-number">
            {colegiosActivos.length}
          </div>
        </div>

        <div className="ai-stat">
          <div className="ai-stat-label">Colegios inactivos</div>
          <div className="ai-stat-number">
            {colegiosInactivos.length}
          </div>
        </div>
      </section>

      <nav className="ai-tabs" aria-label="Administración">
        <button
          type="button"
          className={`ai-tab ${
            vista === "colegios" || vista === "detalle"
              ? "ai-tab-active"
              : ""
          }`}
          onClick={() => cambiarVista("colegios")}
        >
          Consultar colegios
        </button>

        <button
          type="button"
          className={`ai-tab ${
            vista === "crear-colegio" ? "ai-tab-active" : ""
          }`}
          onClick={() => cambiarVista("crear-colegio")}
        >
          Crear colegio y rector
        </button>
      </nav>

      {error && (
        <div className="ai-alert ai-alert-error" role="alert">
          <strong>Error: </strong>
          {error}
        </div>
      )}

      {mensaje && (
        <div className="ai-alert ai-alert-success" role="status">
          {mensaje}
        </div>
      )}

      {cargando ? (
        <section className="ai-panel">
          <div className="ai-empty">
            Cargando información desde el servidor...
          </div>
        </section>
      ) : (
        <>
          {vista === "colegios" && (
            <section className="ai-panel">
              <div className="ai-panel-heading">
                <div>
                  <h2>Instituciones registradas</h2>
                  <p>
                    Consulta los colegios registrados en APRENZY.
                  </p>
                </div>

                <input
                  className="ai-search"
                  type="search"
                  placeholder="Buscar por nombre, NIT o municipio..."
                  value={busqueda}
                  onChange={(evento) =>
                    setBusqueda(evento.target.value)
                  }
                  aria-label="Buscar colegios"
                />
              </div>

              <div className="ai-table-wrap">
                <table className="ai-table">
                  <thead>
                    <tr>
                      <th>Colegio</th>
                      <th>Identificación</th>
                      <th>Ubicación</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {colegiosFiltrados.map((colegio) => (
                      <tr key={colegio.id_colegio}>
                        <td>
                          <strong>{colegio.nombre_colegio}</strong>
                        </td>

                        <td>
                          <div>
                            NIT: {colegio.nit || "No registrado"}
                          </div>
                          <div className="ai-muted">
                            DANE: {colegio.codigo_dane || "No registrado"}
                          </div>
                        </td>

                        <td>
                          {[
                            colegio.municipio,
                            colegio.departamento,
                          ].filter(Boolean).join(", ") || "No registrada"}
                        </td>

                        <td>
                          <span
                            className={`ai-status ${
                              colegio.estado === "activo"
                                ? "ai-status-active"
                                : "ai-status-inactive"
                            }`}
                          >
                            {colegio.estado}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="ai-button"
                            disabled={detalleCargando}
                            onClick={() =>
                              void consultarColegio(colegio.id_colegio)
                            }
                          >
                            {detalleCargando
                              ? "Consultando..."
                              : "Ver detalle"}
                          </button>
                        </td>
                      </tr>
                    ))}

                    {colegiosFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={5}>
                          <div className="ai-empty">
                            No hay colegios que coincidan con la búsqueda.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {vista === "detalle" && colegioSeleccionado && (
            <section className="ai-panel">
              <div className="ai-panel-heading">
                <div>
                  <h2>{colegioSeleccionado.nombre_colegio}</h2>
                  <p>Detalle de la institución seleccionada.</p>
                </div>

                <button
                  type="button"
                  className="ai-button"
                  onClick={() => cambiarVista("colegios")}
                >
                  Volver al listado
                </button>
              </div>

              <div className="ai-state-box">
                <div className="ai-state-field">
                  <label htmlFor="ai-estado-detalle">
                    Estado de la institución
                  </label>

                  <select
                    id="ai-estado-detalle"
                    className="ai-state-select"
                    value={nuevoEstado}
                    disabled={actualizandoEstado}
                    onChange={(evento) =>
                      setNuevoEstado(
                        evento.target.value as EstadoColegio,
                      )
                    }
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>

                <button
                  type="button"
                  className="ai-button ai-button-primary"
                  disabled={
                    actualizandoEstado ||
                    nuevoEstado === colegioSeleccionado.estado
                  }
                  onClick={() => void guardarEstadoColegio()}
                >
                  {actualizandoEstado
                    ? "Guardando..."
                    : "Guardar estado"}
                </button>

                <span
                  className={`ai-status ${
                    colegioSeleccionado.estado === "activo"
                      ? "ai-status-active"
                      : "ai-status-inactive"
                  }`}
                >
                  Estado actual: {colegioSeleccionado.estado}
                </span>
              </div>

              <div className="ai-detail-grid">
                <div className="ai-detail-item">
                  <span>Código DANE</span>
                  <strong>
                    {colegioSeleccionado.codigo_dane || "No registrado"}
                  </strong>
                </div>

                <div className="ai-detail-item">
                  <span>NIT</span>
                  <strong>
                    {colegioSeleccionado.nit || "No registrado"}
                  </strong>
                </div>

                <div className="ai-detail-item">
                  <span>Dirección</span>
                  <strong>
                    {colegioSeleccionado.direccion || "No registrada"}
                  </strong>
                </div>

                <div className="ai-detail-item">
                  <span>Teléfono</span>
                  <strong>
                    {colegioSeleccionado.telefono || "No registrado"}
                  </strong>
                </div>

                <div className="ai-detail-item">
                  <span>Correo institucional</span>
                  <strong>
                    {colegioSeleccionado.correo_institucional ||
                      "No registrado"}
                  </strong>
                </div>

                <div className="ai-detail-item">
                  <span>Municipio y departamento</span>
                  <strong>
                    {[
                      colegioSeleccionado.municipio,
                      colegioSeleccionado.departamento,
                    ].filter(Boolean).join(", ") || "No registrados"}
                  </strong>
                </div>

                <div className="ai-detail-item">
                  <span>Fecha de creación</span>
                  <strong>
                    {colegioSeleccionado.fecha_creacion
                      ? new Date(
                          colegioSeleccionado.fecha_creacion,
                        ).toLocaleDateString("es-CO")
                      : "No disponible"}
                  </strong>
                </div>
              </div>
            </section>
          )}

          {vista === "crear-colegio" && (
            <section className="ai-panel">
              <div className="ai-panel-heading">
                <div>
                  <h2>Registrar colegio y rector</h2>
                  <p>
                    Ambos se crearán juntos y quedarán asociados
                    automáticamente.
                  </p>
                </div>
              </div>

              <form className="ai-form" onSubmit={guardarColegio}>
                <div className="ai-form-section">
                  <h3>Datos de la institución</h3>
                  <p>
                    Registra la información del colegio.
                    El estado inicial será activo automáticamente.
                  </p>
                </div>

                <div className="ai-field ai-span">
                  <label htmlFor="ai-nombre-colegio">
                    Nombre del colegio *
                  </label>
                  <input
                    id="ai-nombre-colegio"
                    required
                    maxLength={250}
                    value={colegioForm.nombre_colegio}
                    onChange={(evento) =>
                      setColegioForm({
                        ...colegioForm,
                        nombre_colegio: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="ai-field">
                  <label htmlFor="ai-dane">Código DANE</label>
                  <input
                    id="ai-dane"
                    maxLength={20}
                    value={colegioForm.codigo_dane ?? ""}
                    onChange={(evento) =>
                      setColegioForm({
                        ...colegioForm,
                        codigo_dane: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="ai-field">
                  <label htmlFor="ai-nit">NIT</label>
                  <input
                    id="ai-nit"
                    maxLength={20}
                    value={colegioForm.nit ?? ""}
                    onChange={(evento) =>
                      setColegioForm({
                        ...colegioForm,
                        nit: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="ai-field">
                  <label htmlFor="ai-direccion">Dirección</label>
                  <input
                    id="ai-direccion"
                    maxLength={250}
                    value={colegioForm.direccion ?? ""}
                    onChange={(evento) =>
                      setColegioForm({
                        ...colegioForm,
                        direccion: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="ai-field">
                  <label htmlFor="ai-telefono-colegio">
                    Teléfono institucional
                  </label>
                  <input
                    id="ai-telefono-colegio"
                    maxLength={20}
                    value={colegioForm.telefono ?? ""}
                    onChange={(evento) =>
                      setColegioForm({
                        ...colegioForm,
                        telefono: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="ai-field">
                  <label htmlFor="ai-municipio">Municipio</label>
                  <input
                    id="ai-municipio"
                    maxLength={100}
                    value={colegioForm.municipio ?? ""}
                    onChange={(evento) =>
                      setColegioForm({
                        ...colegioForm,
                        municipio: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="ai-field">
                  <label htmlFor="ai-departamento">Departamento</label>
                  <input
                    id="ai-departamento"
                    maxLength={100}
                    value={colegioForm.departamento ?? ""}
                    onChange={(evento) =>
                      setColegioForm({
                        ...colegioForm,
                        departamento: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="ai-field ai-span">
                  <label htmlFor="ai-correo-colegio">
                    Correo institucional
                  </label>
                  <input
                    id="ai-correo-colegio"
                    type="email"
                    value={colegioForm.correo_institucional ?? ""}
                    onChange={(evento) =>
                      setColegioForm({
                        ...colegioForm,
                        correo_institucional: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="ai-form-section">
                  <h3>Datos del rector</h3>
                  <p>
                    El rector será el responsable de administrar
                    este colegio dentro de APRENZY.
                  </p>
                </div>

                <div className="ai-field">
                  <label htmlFor="ai-rector-documento">
                    Documento *
                  </label>
                  <input
                    id="ai-rector-documento"
                    required
                    maxLength={20}
                    value={rectorForm.documento}
                    onChange={(evento) =>
                      setRectorForm({
                        ...rectorForm,
                        documento: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="ai-field">
                  <label htmlFor="ai-rector-nombres">Nombres *</label>
                  <input
                    id="ai-rector-nombres"
                    required
                    maxLength={80}
                    value={rectorForm.nombres_compl}
                    onChange={(evento) =>
                      setRectorForm({
                        ...rectorForm,
                        nombres_compl: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="ai-field">
                  <label htmlFor="ai-rector-apellidos">Apellidos *</label>
                  <input
                    id="ai-rector-apellidos"
                    required
                    maxLength={80}
                    value={rectorForm.apellidos_compl}
                    onChange={(evento) =>
                      setRectorForm({
                        ...rectorForm,
                        apellidos_compl: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="ai-field">
                  <label htmlFor="ai-rector-telefono">Teléfono *</label>
                  <input
                    id="ai-rector-telefono"
                    required
                    maxLength={20}
                    value={rectorForm.telefono}
                    onChange={(evento) =>
                      setRectorForm({
                        ...rectorForm,
                        telefono: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="ai-field ai-span">
                  <label htmlFor="ai-rector-correo">
                    Correo electrónico *
                  </label>
                  <input
                    id="ai-rector-correo"
                    type="email"
                    required
                    value={rectorForm.correo}
                    onChange={(evento) =>
                      setRectorForm({
                        ...rectorForm,
                        correo: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="ai-field ai-span">
                  <label htmlFor="ai-rector-contrasena">
                    Contraseña inicial *
                  </label>

                  <div className="ai-password-control">
                    <input
                      id="ai-rector-contrasena"
                      type={mostrarContrasena ? "text" : "password"}
                      required
                      minLength={6}
                      maxLength={255}
                      autoComplete="new-password"
                      value={rectorForm.contrasena}
                      onChange={(evento) =>
                        setRectorForm({
                          ...rectorForm,
                          contrasena: evento.target.value,
                        })
                      }
                    />

                    <button
                      type="button"
                      className="ai-password-toggle"
                      aria-label={
                        mostrarContrasena
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      title={
                        mostrarContrasena
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      onClick={() =>
                        setMostrarContrasena((visible) => !visible)
                      }
                    >
                      {mostrarContrasena ? (
                        <FiEyeOff aria-hidden="true" />
                      ) : (
                        <FiEye aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="ai-form-actions">
                  <button
                    type="button"
                    className="ai-button"
                    disabled={guardando}
                    onClick={() => cambiarVista("colegios")}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="ai-button ai-button-primary"
                    disabled={guardando}
                  >
                    {guardando
                      ? "Creando colegio y rector..."
                      : "Crear colegio y rector"}
                  </button>
                </div>
              </form>
            </section>
          )}
        </>
      )}
    </div>
  );
}