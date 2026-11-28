
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  FiPlus,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";

import {
  actualizarIncapacidad,
  crearIncapacidad,
  obtenerIncapacidades,
  type Incapacidad,
} from "../services/incapacidad";

import IncapacidadForm, {
  type FormularioIncapacidad,
} from "../components/incapacidades/IncapacidadForm";

import IncapacidadList from "../components/incapacidades/IncapacidadList";

function formularioInicial(): FormularioIncapacidad {
  return {
    numero_radicado: "",
    fecha_inicio: "",
    fecha_fin: "",
    archivo: null,
    motivo: "",
    estado: "pendiente",
    observacion_revision: "",
  };
}

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

export default function Incapacidades() {
  const { usuario } = useAuth();

  const esCoordinador =
    usuario?.tipo_de_usuario === "coordinador";

  const esEstudiante =
    usuario?.tipo_de_usuario === "estudiante";

  const [
    incapacidades,
    setIncapacidades,
  ] = useState<Incapacidad[]>([]);

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

  const [
    mostrarFormulario,
    setMostrarFormulario,
  ] = useState(false);

  const [formulario, setFormulario] =
    useState<FormularioIncapacidad>(
      formularioInicial(),
    );

  const [
    incapacidadEditando,
    setIncapacidadEditando,
  ] = useState<Incapacidad | null>(null);

  const [motivoCambio, setMotivoCambio] =
    useState("");

  // ============================================================
  // CARGAR INCAPACIDADES DESDE EL BACKEND
  // ============================================================

  const cargarIncapacidades = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      if (!esCoordinador && !esEstudiante) {
        setIncapacidades([]);
        setError(
          "Tu rol no tiene permisos para consultar incapacidades.",
        );
        return;
      }

      const datos = await obtenerIncapacidades();

      setIncapacidades(
        Array.isArray(datos) ? datos : [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar las incapacidades.",
      );
    } finally {
      setCargando(false);
    }
  }, [esCoordinador, esEstudiante]);

  useEffect(() => {
    void cargarIncapacidades();
  }, [
    cargarIncapacidades,
    usuario?.id_usuario,
  ]);

  // ============================================================
  // BÚSQUEDA
  // ============================================================

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
            .includes(texto),
      );
    }, [incapacidades, busqueda]);

  // ============================================================
  // ACTUALIZAR CAMPOS DEL FORMULARIO
  // ============================================================

  function actualizarCampo(
    campo: keyof FormularioIncapacidad,
    valor: string | File | null,
  ) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }) as FormularioIncapacidad);
  }

  // ============================================================
  // ABRIR FORMULARIO PARA CREAR
  // ============================================================

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

  // ============================================================
  // ABRIR FORMULARIO PARA REVISAR
  // ============================================================

  function abrirFormularioEditar(
    incapacidad: Incapacidad,
  ) {
    if (!esCoordinador) {
      return;
    }

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

      archivo: null,

      motivo: incapacidad.motivo,

      estado: incapacidad.estado,

      observacion_revision:
        incapacidad.observacion_revision || "",
    });

    setMostrarFormulario(true);
  }

  // ============================================================
  // CERRAR FORMULARIO
  // ============================================================

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

  // ============================================================
  // VALIDAR FECHAS
  // ============================================================

  function validarFechas(): boolean {
    if (
      formulario.fecha_inicio &&
      formulario.fecha_fin &&
      formulario.fecha_fin <
        formulario.fecha_inicio
    ) {
      setError(
        "La fecha de finalización no puede ser anterior a la fecha de inicio.",
      );

      return false;
    }

    return true;
  }

  // ============================================================
  // ENVIAR FORMULARIO
  // ============================================================

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
      !formulario.fecha_inicio ||
      !formulario.fecha_fin ||
      !formulario.motivo.trim()
    ) {
      setError(
        "Completa todos los campos obligatorios.",
      );
      return;
    }

    if (!incapacidadEditando) {
      if (!esEstudiante) {
        setError(
          "Solo los estudiantes pueden radicar incapacidades.",
        );
        return;
      }

      if (!formulario.numero_radicado.trim()) {
        setError(
          "El número de radicado es obligatorio.",
        );
        return;
      }

      if (!formulario.archivo) {
        setError(
          "Debes adjuntar el documento de la incapacidad.",
        );
        return;
      }
    }

    if (incapacidadEditando) {
      if (!esCoordinador) {
        setError(
          "No tienes permisos para modificar esta incapacidad.",
        );
        return;
      }

      if (!motivoCambio.trim()) {
        setError(
          "Debes indicar el motivo del cambio.",
        );
        return;
      }

      if (
        (formulario.estado === "aprobada" ||
          formulario.estado === "rechazada") &&
        !formulario.observacion_revision.trim()
      ) {
        setError(
          "Debes escribir una observación para aprobar o rechazar la incapacidad.",
        );
        return;
      }
    }

    setGuardando(true);

    try {
      if (incapacidadEditando) {
        await actualizarIncapacidad(
          incapacidadEditando.id_incapacidad,
          {
            fecha_inicio:
              formulario.fecha_inicio,

            fecha_fin:
              formulario.fecha_fin,

            archivo:
              formulario.archivo,

            motivo:
              formulario.motivo.trim(),

            estado:
              formulario.estado,

            motivo_cambio:
              motivoCambio.trim(),

            observacion_revision:
              formulario.observacion_revision.trim(),
          },
        );

        setMensaje(
          formulario.estado === "aprobada"
            ? "Incapacidad aprobada correctamente."
            : formulario.estado === "rechazada"
              ? "Incapacidad rechazada correctamente."
              : formulario.estado === "finalizada"
                ? "Incapacidad finalizada correctamente."
                : "Incapacidad actualizada correctamente.",
        );
      } else {
        await crearIncapacidad({
          numero_radicado:
            formulario.numero_radicado.trim(),

          fecha_inicio:
            formulario.fecha_inicio,

          fecha_fin:
            formulario.fecha_fin,

          archivo:
            formulario.archivo!,

          motivo:
            formulario.motivo.trim(),
        });

        setMensaje(
          "Incapacidad radicada correctamente. Está pendiente de revisión por el coordinador.",
        );
      }

      // Cerrar y limpiar el formulario después de guardar.
      setMostrarFormulario(false);
      setIncapacidadEditando(null);
      setMotivoCambio("");
      setFormulario(formularioInicial());

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

  // ============================================================
  // INTERFAZ
  // ============================================================

  return (
    <div className="incapacidades-page">
      <div className="incapacidades-header">
        <div>
          <h1>Incapacidades</h1>

          <p>
            {esCoordinador
              ? "Revisa, aprueba y gestiona las incapacidades de los estudiantes de tu colegio."
              : "Radica tus incapacidades y consulta el estado de tus solicitudes."}
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

          {esEstudiante && (
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
              setBusqueda(evento.target.value)
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
      ) : (
        <IncapacidadList
          incapacidades={
            incapacidadesFiltradas
          }
          esCoordinador={esCoordinador}
          onEditar={abrirFormularioEditar}
        />
      )}

      <IncapacidadForm
        mostrar={mostrarFormulario}
        guardando={guardando}
        incapacidadEditando={
          incapacidadEditando
        }
        formulario={formulario}
        motivoCambio={motivoCambio}
        esCoordinador={esCoordinador}
        onSubmit={manejarSubmit}
        onClose={cerrarFormulario}
        onChange={actualizarCampo}
        onMotivoCambio={setMotivoCambio}
      />
    </div>
  );
}
