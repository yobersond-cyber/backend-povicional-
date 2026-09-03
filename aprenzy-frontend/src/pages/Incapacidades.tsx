import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  FiCheckCircle,
  FiEdit2,
  FiFileText,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiX,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";

import {
  actualizarIncapacidad,
  cambiarEstadoIncapacidad,
  crearIncapacidad,
  obtenerIncapacidad,
  obtenerIncapacidades,
  type Incapacidad,
} from "../services/incapacidad";

// Representa el formulario de una incapacidad
interface FormularioIncapacidad {
  numero_radicado: string;
  fecha_inicio: string;
  fecha_fin: string;
  archivo: string;
  motivo: string;
}

// Obtiene el texto visual del estado
function obtenerTextoEstado(
  estado: Incapacidad["estado"],
): string {
  if (estado === "pendiente") {
    return "Pendiente";
  }

  if (estado === "aprobada") {
    return "Aprobada";
  }

  if (estado === "rechazada") {
    return "Rechazada";
  }

  return "Finalizada";
}

// Obtiene la clase visual del estado
function obtenerClaseEstado(
  estado: Incapacidad["estado"],
): string {
  if (estado === "aprobada") {
    return "incapacidad-estado aprobada";
  }

  if (estado === "rechazada") {
    return "incapacidad-estado rechazada";
  }

  if (estado === "finalizada") {
    return "incapacidad-estado finalizada";
  }

  return "incapacidad-estado pendiente";
}

// Formatea una fecha para mostrarla
function formatearFecha(fecha: string): string {
  if (!fecha) {
    return "-";
  }

  const fechaNormalizada =
    fecha.includes("T")
      ? fecha.split("T")[0]
      : fecha;

  const partes = fechaNormalizada.split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// Convierte una fecha recibida por el backend a input date
function convertirFechaInput(
  fecha: string,
): string {
  if (!fecha) {
    return "";
  }

  return fecha.includes("T")
    ? fecha.split("T")[0]
    : fecha;
}

// Crea un formulario vacío
function formularioInicial(): FormularioIncapacidad {
  return {
    numero_radicado: "",
    fecha_inicio: "",
    fecha_fin: "",
    archivo: "",
    motivo: "",
  };
}

export default function Incapacidades() {
  const { usuario } = useAuth();

  const esAdministrador =
    usuario?.tipo_de_usuario === "administrador";

  const [incapacidades, setIncapacidades] =
    useState<Incapacidad[]>([]);

  const [busqueda, setBusqueda] =
    useState("");

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [formulario, setFormulario] =
    useState<FormularioIncapacidad>(
      formularioInicial(),
    );

  const [incapacidadEditando, setIncapacidadEditando] =
    useState<Incapacidad | null>(null);

  const [motivoCambio, setMotivoCambio] =
    useState("");

  // Obtiene los IDs de incapacidades creadas por este navegador
  function obtenerIdsLocales(): number[] {
    const guardado =
      localStorage.getItem(
        "aprenzy_incapacidades",
      );

    if (!guardado) {
      return [];
    }

    try {
      const ids = JSON.parse(guardado);

      if (!Array.isArray(ids)) {
        return [];
      }

      return ids.filter(
        (id): id is number =>
          typeof id === "number",
      );
    } catch {
      return [];
    }
  }

  // Guarda un ID de incapacidad en el navegador
  function guardarIdLocal(id: number) {
    const ids = obtenerIdsLocales();

    if (!ids.includes(id)) {
      ids.push(id);

      localStorage.setItem(
        "aprenzy_incapacidades",
        JSON.stringify(ids),
      );
    }
  }

  // Carga las incapacidades
  async function cargarIncapacidades() {
    setCargando(true);
    setError("");

    try {
      if (esAdministrador) {
        // El administrador puede listar todas
        const datos =
          await obtenerIncapacidades();

        setIncapacidades(datos);
        return;
      }

      // El backend no tiene un endpoint de listado
      // para estudiantes, por eso recuperamos
      // las incapacidades que este navegador conoce.
      const ids = obtenerIdsLocales();

      if (ids.length === 0) {
        setIncapacidades([]);
        return;
      }

      const resultados =
        await Promise.allSettled(
          ids.map((id) =>
            obtenerIncapacidad(id),
          ),
        );

      const datos = resultados
        .filter(
          (
            resultado,
          ): resultado is PromiseFulfilledResult<Incapacidad> =>
            resultado.status === "fulfilled",
        )
        .map(
          (resultado) =>
            resultado.value,
        );

      setIncapacidades(datos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar las incapacidades.",
      );
    } finally {
      setCargando(false);
    }
  }

  // Carga la información al entrar al módulo
  useEffect(() => {
    void cargarIncapacidades();
  }, [esAdministrador]);

  // Filtra las incapacidades por búsqueda
  const incapacidadesFiltradas =
    useMemo(() => {
      const texto =
        busqueda.trim().toLowerCase();

      if (!texto) {
        return incapacidades;
      }

      return incapacidades.filter(
        (incapacidad) =>
          incapacidad.numero_radicado
            .toLowerCase()
            .includes(texto) ||
          incapacidad.motivo
            .toLowerCase()
            .includes(texto) ||
          incapacidad.estado
            .toLowerCase()
            .includes(texto) ||
          String(
            incapacidad.id_usuario,
          ).includes(texto),
      );
    }, [incapacidades, busqueda]);

  // Actualiza un campo del formulario
  function actualizarCampo(
    campo: keyof FormularioIncapacidad,
    valor: string,
  ) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  // Abre el formulario para crear
  function abrirFormularioCrear() {
    setError("");
    setMensaje("");
    setIncapacidadEditando(null);
    setMotivoCambio("");
    setFormulario(
      formularioInicial(),
    );
    setMostrarFormulario(true);
  }

  // Abre el formulario para editar
  function abrirFormularioEditar(
    incapacidad: Incapacidad,
  ) {
    setError("");
    setMensaje("");
    setIncapacidadEditando(incapacidad);
    setMotivoCambio("");

    setFormulario({
      numero_radicado:
        incapacidad.numero_radicado,
      fecha_inicio:
        convertirFechaInput(
          incapacidad.fecha_inicio,
        ),
      fecha_fin:
        convertirFechaInput(
          incapacidad.fecha_fin,
        ),
      archivo: incapacidad.archivo,
      motivo: incapacidad.motivo,
    });

    setMostrarFormulario(true);
  }

  // Cierra el formulario
  function cerrarFormulario() {
    if (guardando) {
      return;
    }

    setMostrarFormulario(false);
    setIncapacidadEditando(null);
    setMotivoCambio("");
    setFormulario(
      formularioInicial(),
    );
  }

  // Valida las fechas del formulario
  function validarFechas(): boolean {
    if (
      formulario.fecha_inicio &&
      formulario.fecha_fin &&
      formulario.fecha_fin <
        formulario.fecha_inicio
    ) {
      setError(
        "La fecha de fin no puede ser anterior a la fecha de inicio.",
      );

      return false;
    }

    return true;
  }

  // Envía el formulario
  async function manejarSubmit(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    setError("");
    setMensaje("");

    if (!usuario) {
      setError(
        "No se encontró el usuario autenticado.",
      );

      return;
    }

    if (!validarFechas()) {
      return;
    }

    if (
      !formulario.numero_radicado.trim() &&
      !incapacidadEditando
    ) {
      setError(
        "El número de radicado es obligatorio.",
      );

      return;
    }

    if (
      !formulario.fecha_inicio ||
      !formulario.fecha_fin ||
      !formulario.archivo.trim() ||
      !formulario.motivo.trim()
    ) {
      setError(
        "Completa todos los campos obligatorios.",
      );

      return;
    }

    if (
      incapacidadEditando &&
      !motivoCambio.trim()
    ) {
      setError(
        "Debes indicar el motivo del cambio.",
      );

      return;
    }

    setGuardando(true);

    try {
      if (incapacidadEditando) {
        // Actualiza una incapacidad como administrador
        await actualizarIncapacidad(
          incapacidadEditando.id_incapacidad,
          {
            fecha_inicio:
              formulario.fecha_inicio,
            fecha_fin:
              formulario.fecha_fin,
            archivo:
              formulario.archivo.trim(),
            motivo:
              formulario.motivo.trim(),
            estado:
              incapacidadEditando.estado,
            motivo_cambio:
              motivoCambio.trim(),
            id_usuario_cambio:
              usuario.id_usuario,
          },
        );

        setMensaje(
          "Incapacidad actualizada correctamente.",
        );
      } else {
        // Registra una nueva incapacidad
        const creada =
          await crearIncapacidad({
            numero_radicado:
              formulario.numero_radicado.trim(),
            fecha_inicio:
              formulario.fecha_inicio,
            fecha_fin:
              formulario.fecha_fin,
            archivo:
              formulario.archivo.trim(),
            motivo:
              formulario.motivo.trim(),
            id_usuario:
              usuario.id_usuario,
          });

        // Guarda el ID para poder consultarla posteriormente
        guardarIdLocal(
          creada.id_incapacidad,
        );

        setMensaje(
          "Incapacidad radicada correctamente.",
        );
      }

      cerrarFormulario();
      await cargarIncapacidades();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible guardar la incapacidad.",
      );
    } finally {
      setGuardando(false);
    }
  }

  // Cambia el estado de una incapacidad
  async function cambiarEstado(
    incapacidad: Incapacidad,
    estado: Incapacidad["estado"],
  ) {
    const confirmado =
      window.confirm(
        `¿Deseas cambiar el estado a "${obtenerTextoEstado(
          estado,
        )}"?`,
      );

    if (!confirmado) {
      return;
    }

    setError("");
    setMensaje("");

    try {
      await cambiarEstadoIncapacidad(
        incapacidad.id_incapacidad,
        estado,
      );

      setMensaje(
        "Estado actualizado correctamente.",
      );

      await cargarIncapacidades();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cambiar el estado.",
      );
    }
  }

  return (
    <div className="incapacidades-page">
      <style>
        {`
          .incapacidades-page {
            width: 100%;
          }

          .incapacidades-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 22px;
          }

          .incapacidades-header h1 {
            margin: 0;
            color: #172033;
            font-size: 28px;
          }

          .incapacidades-header p {
            margin: 7px 0 0;
            color: #667085;
            line-height: 1.5;
          }

          .incapacidades-header-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .incapacidades-button {
            border: 0;
            border-radius: 9px;
            padding: 10px 14px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            cursor: pointer;
            font-weight: 600;
          }

          .incapacidades-button.primary {
            background: #4f46e5;
            color: #fff;
          }

          .incapacidades-button.secondary {
            background: #fff;
            color: #344054;
            border: 1px solid #d0d5dd;
          }

          .incapacidades-button.danger {
            background: #fff1f2;
            color: #b42318;
          }

          .incapacidades-button.success {
            background: #ecfdf3;
            color: #027a48;
          }

          .incapacidades-button.warning {
            background: #fffaeb;
            color: #b54708;
          }

          .incapacidades-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .incapacidades-alert {
            border-radius: 10px;
            padding: 12px 14px;
            margin-bottom: 16px;
            line-height: 1.5;
          }

          .incapacidades-alert.error {
            background: #fef3f2;
            color: #b42318;
            border: 1px solid #fecdca;
          }

          .incapacidades-alert.success {
            background: #ecfdf3;
            color: #027a48;
            border: 1px solid #abefc6;
          }

          .incapacidades-toolbar {
            background: #fff;
            border: 1px solid #e8ecf1;
            border-radius: 14px;
            padding: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            margin-bottom: 18px;
          }

          .incapacidades-search {
            flex: 1;
            max-width: 520px;
            position: relative;
          }

          .incapacidades-search svg {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #98a2b3;
          }

          .incapacidades-search input {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #d0d5dd;
            border-radius: 9px;
            padding: 10px 12px 10px 38px;
            outline: none;
            color: #172033;
          }

          .incapacidades-search input:focus,
          .incapacidades-form input:focus,
          .incapacidades-form textarea:focus {
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px #eef2ff;
          }

          .incapacidades-counter {
            color: #667085;
            font-size: 14px;
          }

          .incapacidades-list {
            display: grid;
            gap: 16px;
          }

          .incapacidad-card {
            background: #fff;
            border: 1px solid #e8ecf1;
            border-radius: 14px;
            padding: 20px;
          }

          .incapacidad-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 15px;
          }

          .incapacidad-card-title {
            margin: 0;
            color: #172033;
            font-size: 18px;
          }

          .incapacidad-card-id {
            margin-top: 4px;
            color: #667085;
            font-size: 13px;
          }

          .incapacidad-estado {
            border-radius: 999px;
            padding: 5px 10px;
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
          }

          .incapacidad-estado.pendiente {
            background: #fffaeb;
            color: #b54708;
          }

          .incapacidad-estado.aprobada {
            background: #ecfdf3;
            color: #027a48;
          }

          .incapacidad-estado.rechazada {
            background: #fef3f2;
            color: #b42318;
          }

          .incapacidad-estado.finalizada {
            background: #f2f4f7;
            color: #475467;
          }

          .incapacidad-info-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
            margin-top: 18px;
          }

          .incapacidad-info-item {
            background: #f8fafc;
            border-radius: 9px;
            padding: 12px;
          }

          .incapacidad-info-item span {
            display: block;
            color: #667085;
            font-size: 12px;
            margin-bottom: 4px;
          }

          .incapacidad-info-item strong {
            color: #172033;
            font-size: 14px;
          }

          .incapacidad-motivo {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #eef1f4;
          }

          .incapacidad-motivo strong {
            display: block;
            color: #344054;
            margin-bottom: 6px;
          }

          .incapacidad-motivo p {
            margin: 0;
            color: #667085;
            line-height: 1.6;
            white-space: pre-wrap;
          }

          .incapacidad-apelacion {
            margin-top: 16px;
            padding: 14px;
            border-radius: 10px;
            background: #f5f7ff;
            border: 1px solid #e0e7ff;
          }

          .incapacidad-apelacion strong {
            color: #344054;
          }

          .incapacidad-apelacion p {
            margin: 6px 0 0;
            color: #667085;
            line-height: 1.5;
          }

          .incapacidad-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 18px;
            padding-top: 16px;
            border-top: 1px solid #eef1f4;
          }

          .incapacidades-empty {
            background: #fff;
            border: 1px solid #e8ecf1;
            border-radius: 14px;
            padding: 45px 20px;
            text-align: center;
          }

          .incapacidades-empty svg {
            font-size: 34px;
            color: #98a2b3;
          }

          .incapacidades-empty h3 {
            margin: 12px 0 6px;
            color: #344054;
          }

          .incapacidades-empty p {
            margin: 0;
            color: #667085;
          }

          .incapacidades-overlay {
            position: fixed;
            inset: 0;
            z-index: 2000;
            background: rgba(16, 24, 40, 0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .incapacidades-modal {
            width: min(680px, 100%);
            max-height: 90vh;
            overflow-y: auto;
            background: #fff;
            border-radius: 16px;
            padding: 24px;
            box-sizing: border-box;
          }

          .incapacidades-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 15px;
            margin-bottom: 20px;
          }

          .incapacidades-modal-header h2 {
            margin: 0;
            color: #172033;
          }

          .incapacidades-modal-header p {
            margin: 5px 0 0;
            color: #667085;
            font-size: 14px;
          }

          .incapacidades-close {
            border: 0;
            background: transparent;
            color: #667085;
            font-size: 22px;
            cursor: pointer;
          }

          .incapacidades-form {
            display: grid;
            gap: 16px;
          }

          .incapacidades-form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }

          .incapacidades-form-group {
            display: grid;
            gap: 7px;
          }

          .incapacidades-form-group label {
            color: #344054;
            font-size: 14px;
            font-weight: 600;
          }

          .incapacidades-form input,
          .incapacidades-form textarea {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #d0d5dd;
            border-radius: 9px;
            padding: 10px 12px;
            outline: none;
            font-family: inherit;
            color: #172033;
          }

          .incapacidades-form textarea {
            min-height: 110px;
            resize: vertical;
          }

          .incapacidades-form input:disabled {
            background: #f2f4f7;
          }

          .incapacidades-form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 5px;
          }

          .incapacidades-loading {
            background: #fff;
            border: 1px solid #e8ecf1;
            border-radius: 14px;
            padding: 40px;
            text-align: center;
            color: #667085;
          }

          @media (max-width: 850px) {
            .incapacidades-header {
              flex-direction: column;
            }

            .incapacidad-info-grid {
              grid-template-columns: 1fr 1fr;
            }
          }

          @media (max-width: 600px) {
            .incapacidades-toolbar {
              flex-direction: column;
              align-items: stretch;
            }

            .incapacidades-search {
              max-width: none;
            }

            .incapacidad-card-header {
              flex-direction: column;
            }

            .incapacidad-info-grid,
            .incapacidades-form-row {
              grid-template-columns: 1fr;
            }

            .incapacidades-modal {
              padding: 18px;
            }
          }
        `}
      </style>

      <div className="incapacidades-header">
        <div>
          <h1>Incapacidades</h1>

          <p>
            {esAdministrador
              ? "Administra, revisa y actualiza las incapacidades de los estudiantes."
              : "Radica y consulta el estado de tus incapacidades académicas."}
          </p>
        </div>

        <div className="incapacidades-header-actions">
          <button
            type="button"
            className="incapacidades-button secondary"
            onClick={() =>
              void cargarIncapacidades()
            }
            disabled={cargando}
          >
            <FiRefreshCw />
            Actualizar
          </button>

          {!esAdministrador && (
            <button
              type="button"
              className="incapacidades-button primary"
              onClick={abrirFormularioCrear}
            >
              <FiPlus />
              Radicar incapacidad
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="incapacidades-alert error">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="incapacidades-alert success">
          {mensaje}
        </div>
      )}

      <div className="incapacidades-toolbar">
        <div className="incapacidades-search">
          <FiSearch />

          <input
            type="text"
            placeholder="Buscar por radicado, estado o motivo..."
            value={busqueda}
            onChange={(evento) =>
              setBusqueda(
                evento.target.value,
              )
            }
          />
        </div>

        <div className="incapacidades-counter">
          {incapacidadesFiltradas.length}{" "}
          incapacidad(es)
        </div>
      </div>

      {cargando ? (
        <div className="incapacidades-loading">
          Cargando incapacidades...
        </div>
      ) : incapacidadesFiltradas.length ===
        0 ? (
        <div className="incapacidades-empty">
          <FiFileText />

          <h3>
            No hay incapacidades para mostrar
          </h3>

          <p>
            {esAdministrador
              ? "Todavía no existen incapacidades registradas."
              : "Cuando radiques una incapacidad aparecerá aquí."}
          </p>
        </div>
      ) : (
        <div className="incapacidades-list">
          {incapacidadesFiltradas.map(
            (incapacidad) => (
              <article
                className="incapacidad-card"
                key={
                  incapacidad.id_incapacidad
                }
              >
                <div className="incapacidad-card-header">
                  <div>
                    <h2 className="incapacidad-card-title">
                      Radicado{" "}
                      {
                        incapacidad.numero_radicado
                      }
                    </h2>

                    <div className="incapacidad-card-id">
                      ID incapacidad:{" "}
                      {
                        incapacidad.id_incapacidad
                      }

                      {esAdministrador &&
                        ` · Estudiante ID: ${incapacidad.id_usuario}`}
                    </div>
                  </div>

                  <span
                    className={obtenerClaseEstado(
                      incapacidad.estado,
                    )}
                  >
                    {obtenerTextoEstado(
                      incapacidad.estado,
                    )}
                  </span>
                </div>

                <div className="incapacidad-info-grid">
                  <div className="incapacidad-info-item">
                    <span>
                      Fecha de inicio
                    </span>

                    <strong>
                      {formatearFecha(
                        incapacidad.fecha_inicio,
                      )}
                    </strong>
                  </div>

                  <div className="incapacidad-info-item">
                    <span>
                      Fecha de finalización
                    </span>

                    <strong>
                      {formatearFecha(
                        incapacidad.fecha_fin,
                      )}
                    </strong>
                  </div>

                  <div className="incapacidad-info-item">
                    <span>
                      Documento / archivo
                    </span>

                    <strong>
                      {incapacidad.archivo}
                    </strong>
                  </div>
                </div>

                <div className="incapacidad-motivo">
                  <strong>
                    Motivo
                  </strong>

                  <p>
                    {incapacidad.motivo}
                  </p>
                </div>

                {incapacidad.apelacion && (
                  <div className="incapacidad-apelacion">
                    <strong>
                      Apelación
                    </strong>

                    <p>
                      Estado:{" "}
                      {
                        incapacidad
                          .apelacion
                          .estado
                      }
                    </p>

                    <p>
                      Motivo:{" "}
                      {
                        incapacidad
                          .apelacion
                          .motivo
                      }
                    </p>

                    {incapacidad
                      .apelacion
                      .respuesta && (
                      <p>
                        Respuesta:{" "}
                        {
                          incapacidad
                            .apelacion
                            .respuesta
                        }
                      </p>
                    )}
                  </div>
                )}

                {esAdministrador && (
                  <div className="incapacidad-actions">
                    <button
                      type="button"
                      className="incapacidades-button secondary"
                      onClick={() =>
                        abrirFormularioEditar(
                          incapacidad,
                        )
                      }
                    >
                      <FiEdit2 />
                      Editar
                    </button>

                    {incapacidad.estado ===
                      "pendiente" && (
                      <>
                        <button
                          type="button"
                          className="incapacidades-button success"
                          onClick={() =>
                            void cambiarEstado(
                              incapacidad,
                              "aprobada",
                            )
                          }
                        >
                          <FiCheckCircle />
                          Aprobar
                        </button>

                        <button
                          type="button"
                          className="incapacidades-button danger"
                          onClick={() =>
                            void cambiarEstado(
                              incapacidad,
                              "rechazada",
                            )
                          }
                        >
                          <FiX />
                          Rechazar
                        </button>
                      </>
                    )}

                    {incapacidad.estado ===
                      "aprobada" && (
                      <button
                        type="button"
                        className="incapacidades-button warning"
                        onClick={() =>
                          void cambiarEstado(
                            incapacidad,
                            "finalizada",
                          )
                        }
                      >
                        Finalizar
                      </button>
                    )}

                    {incapacidad.estado ===
                      "rechazada" && (
                      <button
                        type="button"
                        className="incapacidades-button success"
                        onClick={() =>
                          void cambiarEstado(
                            incapacidad,
                            "aprobada",
                          )
                        }
                      >
                        Reconsiderar
                      </button>
                    )}
                  </div>
                )}
              </article>
            ),
          )}
        </div>
      )}

      {mostrarFormulario && (
        <div className="incapacidades-overlay">
          <div className="incapacidades-modal">
            <div className="incapacidades-modal-header">
              <div>
                <h2>
                  {incapacidadEditando
                    ? "Editar incapacidad"
                    : "Radicar incapacidad"}
                </h2>

                <p>
                  {incapacidadEditando
                    ? "Modifica la información y registra el motivo del cambio."
                    : "Completa la información de tu incapacidad."}
                </p>
              </div>

              <button
                type="button"
                className="incapacidades-close"
                onClick={cerrarFormulario}
                disabled={guardando}
              >
                <FiX />
              </button>
            </div>

            <form
              className="incapacidades-form"
              onSubmit={manejarSubmit}
            >
              <div className="incapacidades-form-group">
                <label htmlFor="numero-radicado">
                  Número de radicado
                </label>

                <input
                  id="numero-radicado"
                  type="text"
                  value={
                    formulario.numero_radicado
                  }
                  onChange={(evento) =>
                    actualizarCampo(
                      "numero_radicado",
                      evento.target.value,
                    )
                  }
                  disabled={
                    Boolean(
                      incapacidadEditando,
                    ) || guardando
                  }
                  placeholder="Ej. INC-2026-001"
                  maxLength={30}
                />
              </div>

              <div className="incapacidades-form-row">
                <div className="incapacidades-form-group">
                  <label htmlFor="fecha-inicio">
                    Fecha de inicio
                  </label>

                  <input
                    id="fecha-inicio"
                    type="date"
                    value={
                      formulario.fecha_inicio
                    }
                    onChange={(evento) =>
                      actualizarCampo(
                        "fecha_inicio",
                        evento.target.value,
                      )
                    }
                    disabled={guardando}
                  />
                </div>

                <div className="incapacidades-form-group">
                  <label htmlFor="fecha-fin">
                    Fecha de finalización
                  </label>

                  <input
                    id="fecha-fin"
                    type="date"
                    value={
                      formulario.fecha_fin
                    }
                    onChange={(evento) =>
                      actualizarCampo(
                        "fecha_fin",
                        evento.target.value,
                      )
                    }
                    disabled={guardando}
                  />
                </div>
              </div>

              <div className="incapacidades-form-group">
                <label htmlFor="archivo">
                  Archivo o referencia del soporte
                </label>

                <input
                  id="archivo"
                  type="text"
                  value={
                    formulario.archivo
                  }
                  onChange={(evento) =>
                    actualizarCampo(
                      "archivo",
                      evento.target.value,
                    )
                  }
                  disabled={guardando}
                  placeholder="Nombre o URL del archivo"
                  maxLength={255}
                />
              </div>

              <div className="incapacidades-form-group">
                <label htmlFor="motivo">
                  Motivo
                </label>

                <textarea
                  id="motivo"
                  value={
                    formulario.motivo
                  }
                  onChange={(evento) =>
                    actualizarCampo(
                      "motivo",
                      evento.target.value,
                    )
                  }
                  disabled={guardando}
                  placeholder="Describe el motivo de la incapacidad..."
                />
              </div>

              {incapacidadEditando && (
                <div className="incapacidades-form-group">
                  <label htmlFor="motivo-cambio">
                    Motivo del cambio
                  </label>

                  <textarea
                    id="motivo-cambio"
                    value={motivoCambio}
                    onChange={(evento) =>
                      setMotivoCambio(
                        evento.target.value,
                      )
                    }
                    disabled={guardando}
                    placeholder="Explica por qué se modifica esta incapacidad..."
                  />
                </div>
              )}

              <div className="incapacidades-form-actions">
                <button
                  type="button"
                  className="incapacidades-button secondary"
                  onClick={cerrarFormulario}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="incapacidades-button primary"
                  disabled={guardando}
                >
                  {guardando
                    ? "Guardando..."
                    : incapacidadEditando
                      ? "Guardar cambios"
                      : "Radicar incapacidad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}