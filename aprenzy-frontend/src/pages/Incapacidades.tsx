import {
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
  cambiarEstadoIncapacidad,
  crearIncapacidad,
  obtenerIncapacidad,
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
    archivo: "",
    motivo: "",
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

export default function Incapacidades() {
  const { usuario } = useAuth();

  const esAdministrador =
    usuario?.tipo_de_usuario ===
    "administrador";

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

  async function cargarIncapacidades() {
    setCargando(true);
    setError("");

    try {
      if (esAdministrador) {
        const datos =
          await obtenerIncapacidades();

        setIncapacidades(datos);

        return;
      }

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
            resultado.status ===
            "fulfilled",
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

  useEffect(() => {
    void cargarIncapacidades();
  }, [esAdministrador]);

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

  function actualizarCampo(
    campo: keyof FormularioIncapacidad,
    valor: string,
  ) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

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
      ) : (
        <IncapacidadList
          incapacidades={
            incapacidadesFiltradas
          }
          esAdministrador={
            esAdministrador
          }
          onEditar={
            abrirFormularioEditar
          }
          onCambiarEstado={
            (incapacidad, estado) =>
              void cambiarEstado(
                incapacidad,
                estado,
              )
          }
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
        onSubmit={manejarSubmit}
        onClose={cerrarFormulario}
        onChange={actualizarCampo}
        onMotivoCambio={
          setMotivoCambio
        }
      />
    </div>
  );
}