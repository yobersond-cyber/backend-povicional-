import { useEffect, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

import {
  crearColegio,
  crearCoordinador,
  listarColegios,
  listarCoordinadores,
  obtenerColegio,
  type Colegio,
  type Coordinador,
  type DatosColegio,
  type DatosCoordinador,
} from "../services/administracion";

type Vista =
  | "colegios"
  | "crear-colegio"
  | "coordinadores"
  | "crear-coordinador"
  | "detalle";

const colegioVacio = (): DatosColegio => ({
  nombre_colegio: "",
  codigo_dane: "",
  nit: "",
  direccion: "",
  telefono: "",
  correo_institucional: "",
  municipio: "",
  departamento: "",
  estado: "activo",
});

const coordinadorVacio = (): DatosCoordinador => ({
  codigo_usuario: "",
  documento: "",
  nombres_compl: "",
  apellidos_compl: "",
  telefono: "",
  correo: "",
  contrasena: "",
});

function mensajeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

function normalizarTexto(valor: string | null | undefined) {
  return (valor ?? "").trim().toLowerCase();
}

export default function AdminInstituciones() {
  const [vista, setVista] = useState<Vista>("colegios");

  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [coordinadores, setCoordinadores] = useState<
    Coordinador[]
  >([]);

  const [colegioForm, setColegioForm] =
    useState<DatosColegio>(colegioVacio());

  const [coordinadorInicial, setCoordinadorInicial] =
    useState<DatosCoordinador>(coordinadorVacio());

  const [coordinadorForm, setCoordinadorForm] =
    useState<DatosCoordinador>(coordinadorVacio());

  const [idColegioSeleccionado, setIdColegioSeleccionado] =
    useState("");

  const [colegioSeleccionado, setColegioSeleccionado] =
    useState<Colegio | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [detalleCargando, setDetalleCargando] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [mostrarContrasenaInicial, setMostrarContrasenaInicial] =
    useState(false);

  const [mostrarContrasenaNueva, setMostrarContrasenaNueva] =
    useState(false);

  async function cargarDatos() {
    setCargando(true);
    setError("");

    try {
      const [listaColegios, listaCoordinadores] =
        await Promise.all([
          listarColegios(),
          listarCoordinadores(),
        ]);

      setColegios(listaColegios);
      setCoordinadores(listaCoordinadores);
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
      setVista("detalle");
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setDetalleCargando(false);
    }
  }

  async function guardarColegio(
    evento: React.FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    setError("");
    setMensaje("");

    if (!colegioForm.nombre_colegio.trim()) {
      setError("El nombre del colegio es obligatorio.");
      return;
    }

    if (
      !coordinadorInicial.codigo_usuario.trim() ||
      !coordinadorInicial.documento.trim() ||
      !coordinadorInicial.nombres_compl.trim() ||
      !coordinadorInicial.apellidos_compl.trim() ||
      !coordinadorInicial.telefono.trim() ||
      !coordinadorInicial.correo.trim() ||
      !coordinadorInicial.contrasena
    ) {
      setError(
        "Completa todos los campos obligatorios del coordinador.",
      );
      return;
    }

    setGuardando(true);

    try {
      await crearColegio({
        colegio: {
          ...colegioForm,
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
        coordinador: {
          ...coordinadorInicial,
          codigo_usuario:
            coordinadorInicial.codigo_usuario.trim(),
          documento: coordinadorInicial.documento.trim(),
          nombres_compl:
            coordinadorInicial.nombres_compl.trim(),
          apellidos_compl:
            coordinadorInicial.apellidos_compl.trim(),
          telefono: coordinadorInicial.telefono.trim(),
          correo: coordinadorInicial.correo.trim(),
        },
      });

      setColegioForm(colegioVacio());
      setCoordinadorInicial(coordinadorVacio());
      setMostrarContrasenaInicial(false);

      await cargarDatos();

      setMensaje(
        "El colegio y su coordinador inicial se crearon correctamente.",
      );

      setVista("colegios");
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function guardarCoordinador(
    evento: React.FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    setError("");
    setMensaje("");

    const idColegio = Number(idColegioSeleccionado);

    if (
      !Number.isInteger(idColegio) ||
      idColegio <= 0
    ) {
      setError("Selecciona un colegio válido.");
      return;
    }

    if (
      !coordinadorForm.codigo_usuario.trim() ||
      !coordinadorForm.documento.trim() ||
      !coordinadorForm.nombres_compl.trim() ||
      !coordinadorForm.apellidos_compl.trim() ||
      !coordinadorForm.telefono.trim() ||
      !coordinadorForm.correo.trim() ||
      !coordinadorForm.contrasena
    ) {
      setError(
        "Completa todos los campos obligatorios del coordinador.",
      );
      return;
    }

    setGuardando(true);

    try {
      await crearCoordinador({
        ...coordinadorForm,
        codigo_usuario: coordinadorForm.codigo_usuario.trim(),
        documento: coordinadorForm.documento.trim(),
        nombres_compl: coordinadorForm.nombres_compl.trim(),
        apellidos_compl:
          coordinadorForm.apellidos_compl.trim(),
        telefono: coordinadorForm.telefono.trim(),
        correo: coordinadorForm.correo.trim(),
        id_colegio: idColegio,
      });

      setCoordinadorForm(coordinadorVacio());
      setIdColegioSeleccionado("");
      setMostrarContrasenaNueva(false);

      await cargarDatos();

      setMensaje("El coordinador se creó correctamente.");
      setVista("coordinadores");
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
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

  const coordinadoresFiltrados = coordinadores.filter(
    (coordinador) => {
      const texto = normalizarTexto(busqueda);

      const nombre =
        `${coordinador.nombres_compl} ${coordinador.apellidos_compl}`;

      const colegio = colegios.find(
        (item) => item.id_colegio === coordinador.id_colegio,
      );

      return (
        normalizarTexto(nombre).includes(texto) ||
        normalizarTexto(coordinador.documento).includes(texto) ||
        normalizarTexto(coordinador.codigo_usuario).includes(texto) ||
        normalizarTexto(coordinador.correo).includes(texto) ||
        normalizarTexto(colegio?.nombre_colegio).includes(texto)
      );
    },
  );

  const colegiosActivos = colegios.filter(
    (colegio) => colegio.estado === "activo",
  );

  return (
    <div className="admin-instituciones">
      <style>{`
        .admin-instituciones {
          color: #1e293b;
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 4px 0 24px;
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
          font-size: clamp(24px, 3vw, 32px);
          margin: 8px 0;
          color: #0f172a;
        }

        .ai-subtitle {
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
          max-width: 650px;
        }

        .ai-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 22px;
        }

        .ai-stat {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 19px;
          min-width: 0;
        }

        .ai-stat-label {
          color: #64748b;
          font-size: 13px;
          margin-bottom: 10px;
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
          border: 1px solid #e2e8f0;
          background: #fff;
          border-radius: 9px;
          padding: 11px 15px;
          cursor: pointer;
          color: #475569;
          white-space: nowrap;
          font-weight: 600;
          font-size: 13px;
        }

        .ai-tab:hover {
          border-color: #a5b4fc;
          color: #4338ca;
        }

        .ai-tab-active {
          color: #fff;
          background: #4f46e5;
          border-color: #4f46e5;
        }

        .ai-panel {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 22px;
          min-width: 0;
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
          font-size: 19px;
          margin: 0 0 6px;
          color: #0f172a;
        }

        .ai-panel-heading p {
          color: #64748b;
          font-size: 13px;
          margin: 0;
          line-height: 1.5;
        }

        .ai-search {
          width: 100%;
          max-width: 360px;
          padding: 11px 13px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          font-size: 14px;
          outline: none;
        }

        .ai-search:focus,
        .ai-field input:focus,
        .ai-field select:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px #6366f11c;
        }

        .ai-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .ai-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 680px;
          font-size: 13px;
        }

        .ai-table th {
          text-align: left;
          padding: 12px;
          color: #64748b;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          font-weight: 700;
          white-space: nowrap;
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
          color: #64748b;
          font-size: 12px;
          margin-top: 4px;
        }

        .ai-status {
          display: inline-block;
          border-radius: 30px;
          padding: 5px 9px;
          font-size: 11px;
          font-weight: 700;
          text-transform: capitalize;
          background: #f1f5f9;
          color: #475569;
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
          border: 1px solid #cbd5e1;
          background: #fff;
          color: #334155;
          border-radius: 8px;
          padding: 10px 13px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .ai-button:hover {
          background: #f8fafc;
        }

        .ai-button-primary {
          background: #4f46e5;
          color: white;
          border-color: #4f46e5;
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
          gap: 7px;
          min-width: 0;
        }

        .ai-field label {
          font-weight: 700;
          font-size: 13px;
          color: #334155;
        }

        .ai-field input,
        .ai-field select {
          width: 100%;
          min-width: 0;
          padding: 11px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: white;
          color: #0f172a;
          outline: none;
          font: inherit;
          font-size: 14px;
        }

        .ai-span {
          grid-column: 1 / -1;
        }

        .ai-form-section {
          grid-column: 1 / -1;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          margin-top: 4px;
        }

        .ai-form-section h3 {
          margin: 0 0 5px;
          font-size: 16px;
        }

        .ai-form-section p {
          color: #64748b;
          font-size: 13px;
          margin: 0;
          line-height: 1.5;
        }

        .ai-form-actions {
          grid-column: 1 / -1;
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
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        .ai-alert-success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        .ai-empty {
          text-align: center;
          color: #64748b;
          padding: 35px 15px;
          font-size: 14px;
        }

        .ai-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .ai-detail-item span {
          color: #64748b;
          font-size: 12px;
          display: block;
          margin-bottom: 5px;
        }

        .ai-detail-item strong {
          overflow-wrap: anywhere;
          font-size: 14px;
          color: #0f172a;
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
        }
      `}</style>

      <header className="ai-header">
        <div>
          <span className="ai-eyebrow">
            Administración global
          </span>

          <h1 className="ai-title">
            Colegios y coordinadores
          </h1>

          <p className="ai-subtitle">
            Administra las instituciones de Aprenzy y las
            cuentas de sus coordinadores desde un solo lugar.
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
          <div className="ai-stat-label">
            Total de colegios
          </div>

          <div className="ai-stat-number">
            {colegios.length}
          </div>
        </div>

        <div className="ai-stat">
          <div className="ai-stat-label">
            Colegios activos
          </div>

          <div className="ai-stat-number">
            {colegiosActivos.length}
          </div>
        </div>

        <div className="ai-stat">
          <div className="ai-stat-label">
            Coordinadores registrados
          </div>

          <div className="ai-stat-number">
            {coordinadores.length}
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
          Crear colegio
        </button>

        <button
          type="button"
          className={`ai-tab ${
            vista === "coordinadores" ? "ai-tab-active" : ""
          }`}
          onClick={() => cambiarVista("coordinadores")}
        >
          Consultar coordinadores
        </button>

        <button
          type="button"
          className={`ai-tab ${
            vista === "crear-coordinador"
              ? "ai-tab-active"
              : ""
          }`}
          onClick={() => cambiarVista("crear-coordinador")}
        >
          Crear coordinador
        </button>
      </nav>

      {error && (
        <div className="ai-alert ai-alert-error" role="alert">
          <strong>Error: </strong>
          {error}
        </div>
      )}

      {mensaje && (
        <div
          className="ai-alert ai-alert-success"
          role="status"
        >
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
                    Consulta los colegios registrados en Aprenzy.
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
                          <strong>
                            {colegio.nombre_colegio}
                          </strong>

                          <div className="ai-muted">
                            ID: {colegio.id_colegio}
                          </div>
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
                          ]
                            .filter(Boolean)
                            .join(", ") || "No registrada"}
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
                              void consultarColegio(
                                colegio.id_colegio,
                              )
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
                            No hay colegios que coincidan con
                            la búsqueda.
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
                  <h2>
                    {colegioSeleccionado.nombre_colegio}
                  </h2>

                  <p>
                    Detalle de la institución seleccionada.
                  </p>
                </div>

                <button
                  type="button"
                  className="ai-button"
                  onClick={() => cambiarVista("colegios")}
                >
                  Volver al listado
                </button>
              </div>

              <div className="ai-detail-grid">
                <div className="ai-detail-item">
                  <span>ID del colegio</span>
                  <strong>
                    {colegioSeleccionado.id_colegio}
                  </strong>
                </div>

                <div className="ai-detail-item">
                  <span>Estado</span>
                  <strong>{colegioSeleccionado.estado}</strong>
                </div>

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
                    ]
                      .filter(Boolean)
                      .join(", ") || "No registrados"}
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
                  <h2>Registrar colegio</h2>

                  <p>
                    Se creará el colegio y su coordinador inicial
                    en una sola operación.
                  </p>
                </div>
              </div>

              <form
                className="ai-form"
                onSubmit={guardarColegio}
              >
                <div className="ai-form-section">
                  <h3>Datos de la institución</h3>

                  <p>
                    El nombre es obligatorio. Los demás datos
                    institucionales son opcionales.
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
                  <label htmlFor="ai-departamento">
                    Departamento
                  </label>

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

                <div className="ai-field">
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

                <div className="ai-field">
                  <label htmlFor="ai-estado-colegio">Estado</label>

                  <select
                    id="ai-estado-colegio"
                    value={colegioForm.estado}
                    onChange={(evento) =>
                      setColegioForm({
                        ...colegioForm,
                        estado: evento.target.value as
                          | "activo"
                          | "inactivo",
                      })
                    }
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>

                <div className="ai-form-section">
                  <h3>Coordinador inicial</h3>

                  <p>
                    Esta cuenta quedará asociada al colegio
                    que estás creando.
                  </p>
                </div>

                <div className="ai-field">
                  <label htmlFor="ai-coord-codigo">
                    Código de usuario *
                  </label>

                  <input
                    id="ai-coord-codigo"
                    required
                    maxLength={20}
                    value={coordinadorInicial.codigo_usuario}
                    onChange={(evento) =>
                      setCoordinadorInicial({
                        ...coordinadorInicial,
                        codigo_usuario: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="ai-field">
                  <label htmlFor="ai-coord-documento">
                    Documento *
                  </label>

                  <input
                    id="ai-coord-documento"
                    required
                    maxLength={20}
                    value={coordinadorInicial.documento}
                    onChange={(evento) =>
                      setCoordinadorInicial({
                        ...coordinadorInicial,
                        documento: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="ai-field">
                  <label htmlFor="ai-coord-nombres">Nombres *</label>

                  <input
                    id="ai-coord-nombres"
                    required
                    maxLength={80}
                    value={coordinadorInicial.nombres_compl}
                    onChange={(evento) =>
                      setCoordinadorInicial({
                        ...coordinadorInicial,
                        nombres_compl: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="ai-field">
                  <label htmlFor="ai-coord-apellidos">
                    Apellidos *
                  </label>

                  <input
                    id="ai-coord-apellidos"
                    required
                    maxLength={80}
                    value={coordinadorInicial.apellidos_compl}
                    onChange={(evento) =>
                      setCoordinadorInicial({
                        ...coordinadorInicial,
                        apellidos_compl: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="ai-field">
                  <label htmlFor="ai-coord-telefono">
                    Teléfono *
                  </label>

                  <input
                    id="ai-coord-telefono"
                    required
                    maxLength={20}
                    value={coordinadorInicial.telefono}
                    onChange={(evento) =>
                      setCoordinadorInicial({
                        ...coordinadorInicial,
                        telefono: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="ai-field">
                  <label htmlFor="ai-coord-correo">Correo *</label>

                  <input
                    id="ai-coord-correo"
                    type="email"
                    required
                    value={coordinadorInicial.correo}
                    onChange={(evento) =>
                      setCoordinadorInicial({
                        ...coordinadorInicial,
                        correo: evento.target.value,
                      })
                    }
                  />
                </div>

                {/* CONTRASEÑA DEL COORDINADOR INICIAL */}
                <div className="ai-field ai-span">
                  <label htmlFor="ai-coord-contrasena">
                    Contraseña inicial *
                  </label>

                  <div className="ai-password-control">
                    <input
                      id="ai-coord-contrasena"
                      type={
                        mostrarContrasenaInicial
                          ? "text"
                          : "password"
                      }
                      required
                      minLength={6}
                      maxLength={255}
                      autoComplete="new-password"
                      value={coordinadorInicial.contrasena}
                      onChange={(evento) =>
                        setCoordinadorInicial({
                          ...coordinadorInicial,
                          contrasena: evento.target.value,
                        })
                      }
                    />

                    <button
                      type="button"
                      className="ai-password-toggle"
                      aria-label={
                        mostrarContrasenaInicial
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      title={
                        mostrarContrasenaInicial
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      onClick={() =>
                        setMostrarContrasenaInicial(
                          (visible) => !visible,
                        )
                      }
                    >
                      {mostrarContrasenaInicial ? (
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
                      ? "Creando colegio..."
                      : "Crear colegio y coordinador"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {vista === "coordinadores" && (
            <section className="ai-panel">
              <div className="ai-panel-heading">
                <div>
                  <h2>Coordinadores registrados</h2>

                  <p>
                    Consulta las cuentas y las instituciones
                    a las que pertenecen.
                  </p>
                </div>

                <input
                  className="ai-search"
                  type="search"
                  placeholder="Buscar nombre, documento, correo o colegio..."
                  value={busqueda}
                  onChange={(evento) =>
                    setBusqueda(evento.target.value)
                  }
                  aria-label="Buscar coordinadores"
                />
              </div>

              <div className="ai-table-wrap">
                <table className="ai-table">
                  <thead>
                    <tr>
                      <th>Coordinador</th>
                      <th>Documento</th>
                      <th>Correo</th>
                      <th>Colegio</th>
                    </tr>
                  </thead>

                  <tbody>
                    {coordinadoresFiltrados.map(
                      (coordinador) => {
                        const colegio = colegios.find(
                          (item) =>
                            item.id_colegio ===
                            coordinador.id_colegio,
                        );

                        return (
                          <tr key={coordinador.id_usuario}>
                            <td>
                              <strong>
                                {coordinador.nombres_compl}{" "}
                                {coordinador.apellidos_compl}
                              </strong>

                              <div className="ai-muted">
                                Código: {coordinador.codigo_usuario}
                              </div>
                            </td>

                            <td>{coordinador.documento}</td>
                            <td>{coordinador.correo}</td>

                            <td>
                              {colegio?.nombre_colegio ??
                                `Colegio ID ${coordinador.id_colegio}`}
                            </td>
                          </tr>
                        );
                      },
                    )}

                    {coordinadoresFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={4}>
                          <div className="ai-empty">
                            No hay coordinadores que coincidan
                            con la búsqueda.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {vista === "crear-coordinador" && (
            <section className="ai-panel">
              <div className="ai-panel-heading">
                <div>
                  <h2>Registrar coordinador</h2>

                  <p>
                    Selecciona un colegio activo y crea una
                    cuenta para su coordinador.
                  </p>
                </div>
              </div>

              <form
                className="ai-form"
                onSubmit={guardarCoordinador}
              >
                <div className="ai-field ai-span">
                  <label htmlFor="ai-colegio-existente">
                    Colegio al que pertenecerá *
                  </label>

                  <select
                    id="ai-colegio-existente"
                    required
                    value={idColegioSeleccionado}
                    onChange={(evento) =>
                      setIdColegioSeleccionado(
                        evento.target.value,
                      )
                    }
                  >
                    <option value="">
                      Selecciona un colegio activo
                    </option>

                    {colegiosActivos.map((colegio) => (
                      <option
                        key={colegio.id_colegio}
                        value={colegio.id_colegio}
                      >
                        {colegio.nombre_colegio}
                      </option>
                    ))}
                  </select>

                  {colegiosActivos.length === 0 && (
                    <span className="ai-muted">
                      Primero debes registrar o activar un colegio.
                    </span>
                  )}
                </div>

                <div className="ai-field">
                  <label htmlFor="ai-nuevo-codigo">
                    Código de usuario *
                  </label>

                  <input
                    id="ai-nuevo-codigo"
                    required
                    maxLength={20}
                    value={coordinadorForm.codigo_usuario}
                    onChange={(evento) =>
                      setCoordinadorForm({
                        ...coordinadorForm,
                        codigo_usuario: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="ai-field">
                  <label htmlFor="ai-nuevo-documento">
                    Documento *
                  </label>

                  <input
                    id="ai-nuevo-documento"
                    required
                    maxLength={20}
                    value={coordinadorForm.documento}
                    onChange={(evento) =>
                      setCoordinadorForm({
                        ...coordinadorForm,
                        documento: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="ai-field">
                  <label htmlFor="ai-nuevo-nombres">Nombres *</label>

                  <input
                    id="ai-nuevo-nombres"
                    required
                    maxLength={80}
                    value={coordinadorForm.nombres_compl}
                    onChange={(evento) =>
                      setCoordinadorForm({
                        ...coordinadorForm,
                        nombres_compl: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="ai-field">
                  <label htmlFor="ai-nuevo-apellidos">
                    Apellidos *
                  </label>

                  <input
                    id="ai-nuevo-apellidos"
                    required
                    maxLength={80}
                    value={coordinadorForm.apellidos_compl}
                    onChange={(evento) =>
                      setCoordinadorForm({
                        ...coordinadorForm,
                        apellidos_compl: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="ai-field">
                  <label htmlFor="ai-nuevo-telefono">
                    Teléfono *
                  </label>

                  <input
                    id="ai-nuevo-telefono"
                    required
                    maxLength={20}
                    value={coordinadorForm.telefono}
                    onChange={(evento) =>
                      setCoordinadorForm({
                        ...coordinadorForm,
                        telefono: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="ai-field">
                  <label htmlFor="ai-nuevo-correo">Correo *</label>

                  <input
                    id="ai-nuevo-correo"
                    type="email"
                    required
                    value={coordinadorForm.correo}
                    onChange={(evento) =>
                      setCoordinadorForm({
                        ...coordinadorForm,
                        correo: evento.target.value,
                      })
                    }
                  />
                </div>

                {/* CONTRASEÑA DEL NUEVO COORDINADOR */}
                <div className="ai-field ai-span">
                  <label htmlFor="ai-nuevo-contrasena">
                    Contraseña inicial *
                  </label>

                  <div className="ai-password-control">
                    <input
                      id="ai-nuevo-contrasena"
                      type={
                        mostrarContrasenaNueva
                          ? "text"
                          : "password"
                      }
                      required
                      minLength={6}
                      maxLength={255}
                      autoComplete="new-password"
                      value={coordinadorForm.contrasena}
                      onChange={(evento) =>
                        setCoordinadorForm({
                          ...coordinadorForm,
                          contrasena: evento.target.value,
                        })
                      }
                    />

                    <button
                      type="button"
                      className="ai-password-toggle"
                      aria-label={
                        mostrarContrasenaNueva
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      title={
                        mostrarContrasenaNueva
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      onClick={() =>
                        setMostrarContrasenaNueva(
                          (visible) => !visible,
                        )
                      }
                    >
                      {mostrarContrasenaNueva ? (
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
                    onClick={() =>
                      cambiarVista("coordinadores")
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="ai-button ai-button-primary"
                    disabled={
                      guardando ||
                      colegiosActivos.length === 0
                    }
                  >
                    {guardando
                      ? "Creando coordinador..."
                      : "Crear coordinador"}
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