import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  FiActivity,
  FiAlertCircle,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiShield,
  FiUsers,
} from "react-icons/fi";

import { apiFetch } from "../services/api";
import {
  obtenerEstudiantes,
} from "../services/usuario";
import {
  obtenerCursos,
} from "../services/curso";
import {
  obtenerIncapacidades,
  type Incapacidad,
} from "../services/incapacidad";
import {
  obtenerAccesos,
  type AccesoAcademico,
} from "../services/acceso";
import {
  obtenerActividades,
} from "../services/actividad";
import {
  obtenerEntregas,
} from "../services/entrega";

// Representa un usuario del sistema
interface UsuarioEstadistica {
  id_usuario: number;
  tipo_de_usuario: string;
}

// Representa los datos generales
interface DatosEstadisticas {
  estudiantes: number;
  docentes: number;
  administradores: number;
  cursos: number;
  incapacidades: number;
  accesos: number;
  actividades: number;
  entregas: number;
}

// Obtiene todos los usuarios del colegio
async function obtenerUsuarios(): Promise<
  UsuarioEstadistica[]
> {
  const respuesta = await apiFetch(
    "/usuarios",
  );

  return respuesta.data ?? [];
}

// Componente principal de estadísticas
export default function Estadisticas() {
  const [
    datos,
    setDatos,
  ] = useState<DatosEstadisticas>({
    estudiantes: 0,
    docentes: 0,
    administradores: 0,
    cursos: 0,
    incapacidades: 0,
    accesos: 0,
    actividades: 0,
    entregas: 0,
  });

  const [
    incapacidades,
    setIncapacidades,
  ] = useState<Incapacidad[]>([]);

  const [
    accesos,
    setAccesos,
  ] = useState<AccesoAcademico[]>([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  // Carga la información estadística
  const cargarEstadisticas =
    useCallback(async () => {
      setCargando(true);
      setError("");

      try {
        const resultados =
          await Promise.allSettled([
            obtenerUsuarios(),
            obtenerEstudiantes(),
            obtenerCursos(),
            obtenerIncapacidades(),
            obtenerAccesos(),
            obtenerActividades(),
            obtenerEntregas(),
          ]);

        const usuarios =
          resultados[0].status ===
          "fulfilled"
            ? resultados[0].value
            : [];

        const estudiantes =
          resultados[1].status ===
          "fulfilled"
            ? resultados[1].value
            : [];

        const cursos =
          resultados[2].status ===
          "fulfilled"
            ? resultados[2].value
            : [];

        const incapacidadesData =
          resultados[3].status ===
          "fulfilled"
            ? resultados[3].value
            : [];

        const accesosData =
          resultados[4].status ===
          "fulfilled"
            ? resultados[4].value
            : [];

        const actividades =
          resultados[5].status ===
          "fulfilled"
            ? resultados[5].value
            : [];

        const entregas =
          resultados[6].status ===
          "fulfilled"
            ? resultados[6].value
            : [];

        // Cuenta los usuarios por rol
        const docentes =
          usuarios.filter(
            (usuario) =>
              usuario.tipo_de_usuario ===
              "docente",
          ).length;

        const administradores =
          usuarios.filter(
            (usuario) =>
              usuario.tipo_de_usuario ===
              "administrador",
          ).length;

        setDatos({
          estudiantes:
            estudiantes.length,
          docentes,
          administradores,
          cursos:
            cursos.length,
          incapacidades:
            incapacidadesData.length,
          accesos:
            accesosData.length,
          actividades:
            actividades.length,
          entregas:
            entregas.length,
        });

        setIncapacidades(
          incapacidadesData,
        );

        setAccesos(
          accesosData,
        );

        // Comprueba si alguna consulta falló
        const algunaFallo =
          resultados.some(
            (resultado) =>
              resultado.status ===
              "rejected",
          );

        if (algunaFallo) {
          setError(
            "Algunos datos no pudieron cargarse. Las estadísticas disponibles siguen mostrándose.",
          );
        }
      } catch {
        setError(
          "No fue posible cargar las estadísticas.",
        );
      } finally {
        setCargando(false);
      }
    }, []);

  // Carga las estadísticas al entrar
  useEffect(() => {
    void cargarEstadisticas();
  }, [cargarEstadisticas]);

  // Cuenta incapacidades por estado
  const pendientes =
    incapacidades.filter(
      (incapacidad) =>
        incapacidad.estado ===
        "pendiente",
    ).length;

  const aprobadas =
    incapacidades.filter(
      (incapacidad) =>
        incapacidad.estado ===
        "aprobada",
    ).length;

  const rechazadas =
    incapacidades.filter(
      (incapacidad) =>
        incapacidad.estado ===
        "rechazada",
    ).length;

  const finalizadas =
    incapacidades.filter(
      (incapacidad) =>
        incapacidad.estado ===
        "finalizada",
    ).length;

  // Cuenta accesos por estado
  const accesosActivos =
    accesos.filter(
      (acceso) =>
        acceso.estado ===
        "activo",
    ).length;

  const accesosSuspendidos =
    accesos.filter(
      (acceso) =>
        acceso.estado ===
        "suspendido",
    ).length;

  const accesosFinalizados =
    accesos.filter(
      (acceso) =>
        acceso.estado ===
        "finalizado",
    ).length;

  // Calcula porcentajes
  const porcentajeIncapacidades =
    datos.estudiantes > 0
      ? Math.round(
          (datos.incapacidades /
            datos.estudiantes) *
            100,
        )
      : 0;

  return (
    <div className="estadisticas-page">
      {/* Encabezado */}
      <div className="estadisticas-header">
        <div>
          <span className="estadisticas-kicker">
            Panel administrativo
          </span>

          <h1>
            Estadísticas
          </h1>

          <p>
            Resumen general de la
            información académica
            registrada en Aprenzy.
          </p>
        </div>

        <button
          type="button"
          className="estadisticas-refresh"
          onClick={() =>
            void cargarEstadisticas()
          }
          disabled={cargando}
        >
          <FiRefreshCw
            className={
              cargando
                ? "estadisticas-spin"
                : ""
            }
          />

          {cargando
            ? "Actualizando..."
            : "Actualizar"}
        </button>
      </div>

      {/* Mensaje de error parcial */}
      {error && (
        <div className="estadisticas-alert">
          <FiAlertCircle />

          <span>
            {error}
          </span>
        </div>
      )}

      {/* Tarjetas principales */}
      <section className="estadisticas-grid">
        <div className="estadistica-card">
          <div className="estadistica-icon">
            <FiUsers />
          </div>

          <div>
            <span>
              Estudiantes
            </span>

            <strong>
              {datos.estudiantes}
            </strong>
          </div>
        </div>

        <div className="estadistica-card">
          <div className="estadistica-icon">
            <FiUsers />
          </div>

          <div>
            <span>
              Docentes
            </span>

            <strong>
              {datos.docentes}
            </strong>
          </div>
        </div>

        <div className="estadistica-card">
          <div className="estadistica-icon">
            <FiBookOpen />
          </div>

          <div>
            <span>
              Cursos
            </span>

            <strong>
              {datos.cursos}
            </strong>
          </div>
        </div>

        <div className="estadistica-card">
          <div className="estadistica-icon">
            <FiAlertCircle />
          </div>

          <div>
            <span>
              Incapacidades
            </span>

            <strong>
              {datos.incapacidades}
            </strong>
          </div>
        </div>

        <div className="estadistica-card">
          <div className="estadistica-icon">
            <FiShield />
          </div>

          <div>
            <span>
              Accesos académicos
            </span>

            <strong>
              {datos.accesos}
            </strong>
          </div>
        </div>

        <div className="estadistica-card">
          <div className="estadistica-icon">
            <FiActivity />
          </div>

          <div>
            <span>
              Actividades
            </span>

            <strong>
              {datos.actividades}
            </strong>
          </div>
        </div>

        <div className="estadistica-card">
          <div className="estadistica-icon">
            <FiCheckCircle />
          </div>

          <div>
            <span>
              Entregas
            </span>

            <strong>
              {datos.entregas}
            </strong>
          </div>
        </div>

        <div className="estadistica-card">
          <div className="estadistica-icon">
            <FiUsers />
          </div>

          <div>
            <span>
              Administradores
            </span>

            <strong>
              {datos.administradores}
            </strong>
          </div>
        </div>
      </section>

      {/* Información de incapacidades */}
      <section className="estadisticas-section">
        <div className="estadisticas-section-header">
          <div>
            <h2>
              Estado de incapacidades
            </h2>

            <p>
              Distribución de los
              procesos registrados.
            </p>
          </div>

          <FiAlertCircle />
        </div>

        <div className="estadisticas-status-grid">
          <div className="estadisticas-status">
            <span>
              Pendientes
            </span>

            <strong>
              {pendientes}
            </strong>
          </div>

          <div className="estadisticas-status">
            <span>
              Aprobadas
            </span>

            <strong>
              {aprobadas}
            </strong>
          </div>

          <div className="estadisticas-status">
            <span>
              Rechazadas
            </span>

            <strong>
              {rechazadas}
            </strong>
          </div>

          <div className="estadisticas-status">
            <span>
              Finalizadas
            </span>

            <strong>
              {finalizadas}
            </strong>
          </div>
        </div>
      </section>

      {/* Información de accesos */}
      <section className="estadisticas-section">
        <div className="estadisticas-section-header">
          <div>
            <h2>
              Estado de accesos
            </h2>

            <p>
              Situación actual de las
              autorizaciones académicas.
            </p>
          </div>

          <FiShield />
        </div>

        <div className="estadisticas-status-grid">
          <div className="estadisticas-status">
            <span>
              Activos
            </span>

            <strong>
              {accesosActivos}
            </strong>
          </div>

          <div className="estadisticas-status">
            <span>
              Suspendidos
            </span>

            <strong>
              {accesosSuspendidos}
            </strong>
          </div>

          <div className="estadisticas-status">
            <span>
              Finalizados
            </span>

            <strong>
              {accesosFinalizados}
            </strong>
          </div>

          <div className="estadisticas-status">
            <span>
              Estudiantes con incapacidad
            </span>

            <strong>
              {porcentajeIncapacidades}%
            </strong>
          </div>
        </div>
      </section>

      {/* Resumen */}
      <section className="estadisticas-summary">
        <div className="estadisticas-summary-icon">
          <FiClock />
        </div>

        <div>
          <h2>
            Resumen del sistema
          </h2>

          <p>
            Actualmente Aprenzy registra{" "}
            <strong>
              {datos.estudiantes}
            </strong>{" "}
            estudiantes,{" "}
            <strong>
              {datos.docentes}
            </strong>{" "}
            docentes y{" "}
            <strong>
              {datos.cursos}
            </strong>{" "}
            cursos. Se han registrado{" "}
            <strong>
              {datos.incapacidades}
            </strong>{" "}
            incapacidades y{" "}
            <strong>
              {datos.accesos}
            </strong>{" "}
            accesos académicos.
          </p>
        </div>
      </section>

      {/* Indicador de carga */}
      {cargando && (
        <div className="estadisticas-loading">
          <FiRefreshCw className="estadisticas-spin" />

          <span>
            Cargando información...
          </span>
        </div>
      )}
    </div>
  );
}

// Estilos del módulo
const estilos = `
.estadisticas-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 8px;
}

.estadisticas-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 24px;
}

.estadisticas-kicker {
  display: inline-block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.65;
}

.estadisticas-header h1 {
  margin: 0 0 8px;
  font-size: 30px;
}

.estadisticas-header p {
  margin: 0;
  opacity: 0.7;
}

.estadisticas-refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 16px;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
}

.estadisticas-refresh:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.estadisticas-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 14px 16px;
  border-radius: 10px;
  background: rgba(220, 38, 38, 0.08);
}

.estadisticas-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}


.estadistica-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 110px;
  padding: 20px;
  border-radius: 14px;
  background: #ffffff;
  color: #1e293b;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.07);
}

.estadistica-card span {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  color: #64748b;
  opacity: 1;
}

.estadistica-card strong {
  display: block;
  font-size: 28px;
  color: #0f172a;
}

.estadisticas-section {
  margin-bottom: 24px;
  padding: 22px;
  border-radius: 14px;
  background: #ffffff;
  color: #1e293b;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.07);
}

.estadisticas-section-header h2 {
  margin: 0 0 6px;
  font-size: 20px;
  color: #0f172a;
}

.estadisticas-section-header p {
  margin: 0;
  color: #64748b;
  opacity: 1;
}

.estadisticas-status {
  padding: 18px;
  border-radius: 10px;
  background: #f1f5f9;
  color: #1e293b;
}

.estadisticas-status span {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: #64748b;
  opacity: 1;
}

.estadisticas-status strong {
  font-size: 24px;
  color: #0f172a;
}

.estadisticas-summary {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
  padding: 22px;
  border-radius: 14px;
  background: #ffffff;
  color: #1e293b;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.07);
}

.estadisticas-summary h2 {
  margin: 0 0 8px;
  font-size: 18px;
  color: #0f172a;
}

.estadisticas-summary p {
  margin: 0;
  line-height: 1.6;
  color: #475569;
  opacity: 1;
}


.estadisticas-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 20px;
  opacity: 0.7;
}

.estadisticas-spin {
  animation: estadisticas-spin 1s linear infinite;
}

@keyframes estadisticas-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1100px) {
  .estadisticas-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .estadisticas-status-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .estadisticas-page {
    padding: 4px;
  }

  .estadisticas-header {
    flex-direction: column;
  }

  .estadisticas-refresh {
    width: 100%;
  }

  .estadisticas-grid {
    grid-template-columns: 1fr;
  }

  .estadisticas-status-grid {
    grid-template-columns: 1fr;
  }

  .estadisticas-header h1 {
    font-size: 26px;
  }
}
`;

if (
  typeof document !==
  "undefined"
) {
  const id =
    "estadisticas-styles";

  if (
    !document.getElementById(id)
  ) {
    const style =
      document.createElement(
        "style",
      );

    style.id = id;
    style.textContent =
      estilos;

    document.head.appendChild(
      style,
    );
  }
}