import { useEffect, useState } from "react";
import {
  actualizarUsuario,
  crearUsuario,
  type Usuario,
  type UsuarioCreate,
} from "../../services/usuario";

interface DocenteFormProps {
  docente?: Usuario | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormularioDocente {
  nombres_compl: string;
  apellidos_compl: string;
  documento: string;
  codigo_usuario: string;
  telefono: string;
  correo: string;
  jornada: string;
  contrasena: string;
}

const formularioInicial: FormularioDocente = {
  nombres_compl: "",
  apellidos_compl: "",
  documento: "",
  codigo_usuario: "",
  telefono: "",
  correo: "",
  jornada: "",
  contrasena: "",
};

export default function DocenteForm({
  docente,
  onSuccess,
  onCancel,
}: DocenteFormProps) {
  const [formulario, setFormulario] =
    useState<FormularioDocente>(formularioInicial);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const esEdicion = Boolean(docente);

  useEffect(() => {
    if (docente) {
      setFormulario({
        nombres_compl: docente.nombres_compl ?? "",
        apellidos_compl: docente.apellidos_compl ?? "",
        documento: docente.documento ?? "",
        codigo_usuario: docente.codigo_usuario ?? "",
        telefono: docente.telefono ?? "",
        correo: docente.correo ?? "",
        jornada: docente.jornada ?? "",
        contrasena: "",
      });
    } else {
      setFormulario(formularioInicial);
    }

    setError("");
  }, [docente]);

  function manejarCambio(
    evento: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = evento.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));
  }

  async function manejarSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    setError("");

    if (!formulario.nombres_compl.trim()) {
      setError("Los nombres son obligatorios.");
      return;
    }

    if (!formulario.apellidos_compl.trim()) {
      setError("Los apellidos son obligatorios.");
      return;
    }

    if (!formulario.documento.trim()) {
      setError("El documento es obligatorio.");
      return;
    }

    if (!formulario.codigo_usuario.trim()) {
      setError("El código de usuario es obligatorio.");
      return;
    }

    if (!formulario.correo.trim()) {
      setError("El correo es obligatorio.");
      return;
    }

    if (!esEdicion && !formulario.contrasena.trim()) {
      setError("La contraseña es obligatoria.");
      return;
    }

    setGuardando(true);

    try {
      if (esEdicion && docente) {
        const datos: Partial<UsuarioCreate> = {
          nombres_compl: formulario.nombres_compl.trim(),
          apellidos_compl: formulario.apellidos_compl.trim(),
          documento: formulario.documento.trim(),
          codigo_usuario: formulario.codigo_usuario.trim(),
          telefono: formulario.telefono.trim(),
          correo: formulario.correo.trim(),
          jornada: formulario.jornada || null,
          tipo_de_usuario: "docente",
        };

        if (formulario.contrasena.trim()) {
          datos.contrasena = formulario.contrasena;
        }

        await actualizarUsuario(docente.id_usuario, datos);
      } else {
        const datos: UsuarioCreate = {
          id_colegio: 1,
          codigo_usuario: formulario.codigo_usuario.trim(),
          documento: formulario.documento.trim(),
          nombres_compl: formulario.nombres_compl.trim(),
          apellidos_compl: formulario.apellidos_compl.trim(),
          telefono: formulario.telefono.trim(),
          correo: formulario.correo.trim(),
          tipo_de_usuario: "docente",
          jornada: formulario.jornada || null,
          contrasena: formulario.contrasena,
        };

        await crearUsuario(datos);
      }

      setFormulario(formularioInicial);
      onSuccess();
    } catch (error) {
      console.error("Error guardando docente:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          esEdicion
            ? "No fue posible actualizar el docente."
            : "No fue posible crear el docente.",
        );
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={manejarSubmit}>
      <div className="admin-form-grid">
        <div className="admin-form-group">
          <label htmlFor="nombres_compl">Nombres</label>

          <input
            id="nombres_compl"
            name="nombres_compl"
            type="text"
            value={formulario.nombres_compl}
            onChange={manejarCambio}
            placeholder="Ingrese los nombres"
            disabled={guardando}
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="apellidos_compl">Apellidos</label>

          <input
            id="apellidos_compl"
            name="apellidos_compl"
            type="text"
            value={formulario.apellidos_compl}
            onChange={manejarCambio}
            placeholder="Ingrese los apellidos"
            disabled={guardando}
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="documento">Documento</label>

          <input
            id="documento"
            name="documento"
            type="text"
            value={formulario.documento}
            onChange={manejarCambio}
            placeholder="Número de documento"
            disabled={guardando}
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="codigo_usuario">Código de usuario</label>

          <input
            id="codigo_usuario"
            name="codigo_usuario"
            type="text"
            value={formulario.codigo_usuario}
            onChange={manejarCambio}
            placeholder="Código del docente"
            disabled={guardando}
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="telefono">Teléfono</label>

          <input
            id="telefono"
            name="telefono"
            type="text"
            value={formulario.telefono}
            onChange={manejarCambio}
            placeholder="Número de teléfono"
            disabled={guardando}
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="correo">Correo</label>

          <input
            id="correo"
            name="correo"
            type="email"
            value={formulario.correo}
            onChange={manejarCambio}
            placeholder="correo@ejemplo.com"
            disabled={guardando}
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="jornada">Jornada</label>

          <select
            id="jornada"
            name="jornada"
            value={formulario.jornada}
            onChange={manejarCambio}
            disabled={guardando}
          >
            <option value="">Seleccione una jornada</option>
            <option value="mañana">Mañana</option>
            <option value="tarde">Tarde</option>
            <option value="unica">Única</option>
          </select>
        </div>

        <div className="admin-form-group">
          <label htmlFor="contrasena">
            {esEdicion
              ? "Nueva contraseña (opcional)"
              : "Contraseña"}
          </label>

          <input
            id="contrasena"
            name="contrasena"
            type="password"
            value={formulario.contrasena}
            onChange={manejarCambio}
            placeholder={
              esEdicion
                ? "Dejar vacío para conservarla"
                : "Ingrese una contraseña"
            }
            disabled={guardando}
          />
        </div>
      </div>

      {error && (
        <div className="admin-form-error">
          {error}
        </div>
      )}

      <div className="admin-form-actions">
        <button
          type="button"
          className="admin-button-secondary"
          onClick={onCancel}
          disabled={guardando}
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="admin-button-primary"
          disabled={guardando}
        >
          {guardando
            ? "Guardando..."
            : esEdicion
              ? "Actualizar docente"
              : "Crear docente"}
        </button>
      </div>
    </form>
  );
}