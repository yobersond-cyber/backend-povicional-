
import { useState, type FormEvent } from "react";
import {
    FiUser,
    FiMail,
    FiLock,
    FiHash,
    FiPhone,
    FiBookOpen,
} from "react-icons/fi";
import { crearUsuario } from "../services/usuario";

type RolRegistro = "docente" | "estudiante";

const roles: {
    value: RolRegistro;
    label: string;
    description: string;
}[] = [
    {
        value: "estudiante",
        label: "Estudiante",
        description: "Consulta materiales y entrega actividades.",
    },
    {
        value: "docente",
        label: "Docente",
        description: "Publica materiales y gestiona actividades.",
    },
];

interface Props {
    onBackToLogin: () => void;
}

export default function Registro({ onBackToLogin }: Props) {
    const [rol, setRol] = useState<RolRegistro>("estudiante");

    const [form, setForm] = useState({
        id_colegio: "",
        codigo_usuario: "",
        documento: "",
        nombres_compl: "",
        apellidos_compl: "",
        telefono: "",
        correo: "",
        contrasena: "",
        confirmarContrasena: "",
        jornada: "",
        id_curso: "",
    });

    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [loading, setLoading] = useState(false);

    const update = (
        field: keyof typeof form,
        value: string
    ) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        setError("");
        setMensaje("");

        if (form.contrasena !== form.confirmarContrasena) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        if (form.contrasena.length < 6) {
            setError(
                "La contraseña debe tener al menos 6 caracteres."
            );
            return;
        }

        if (!form.id_colegio.trim() || Number(form.id_colegio) < 1) {
            setError("Ingresa un ID de institución válido.");
            return;
        }

        if (
            rol === "estudiante" &&
            (!form.id_curso.trim() || Number(form.id_curso) < 1)
        ) {
            setError("El estudiante debe indicar un ID de curso válido.");
            return;
        }

        setLoading(true);

        try {
            await crearUsuario({
                id_colegio: Number(form.id_colegio),
                codigo_usuario: form.codigo_usuario.trim(),
                documento: form.documento.trim(),
                nombres_compl: form.nombres_compl.trim(),
                apellidos_compl: form.apellidos_compl.trim(),
                telefono: form.telefono.trim(),
                correo: form.correo.trim(),
                contrasena: form.contrasena,
                tipo_de_usuario: rol,
                jornada: form.jornada || null,
                id_curso:
                    rol === "estudiante"
                        ? Number(form.id_curso)
                        : null,
            });

            setMensaje(
                "Registro creado correctamente. Ya puedes iniciar sesión."
            );

            setForm({
                id_colegio: "",
                codigo_usuario: "",
                documento: "",
                nombres_compl: "",
                apellidos_compl: "",
                telefono: "",
                correo: "",
                contrasena: "",
                confirmarContrasena: "",
                jornada: "",
                id_curso: "",
            });
        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : "No fue posible completar el registro."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-container register-container">
            <section className="login-card register-card">
                <div className="login-logo">A</div>

                <h1>Crear cuenta en Aprenzy</h1>

                <p className="login-description">
                    Selecciona tu tipo de usuario para mostrar
                    únicamente los campos necesarios.
                </p>

                <label htmlFor="tipo-usuario">
                    ¿Qué tipo de usuario eres?
                </label>

                <select
                    id="tipo-usuario"
                    name="tipo_de_usuario"
                    className="role-select"
                    value={rol}
                    onChange={(e) => {
                        setRol(e.target.value as RolRegistro);
                        setError("");
                        setMensaje("");
                    }}
                >
                    {roles.map((item) => (
                        <option value={item.value} key={item.value}>
                            {item.label}
                        </option>
                    ))}
                </select>

                <p className="role-description">
                    {roles.find((item) => item.value === rol)?.description}
                </p>

                <form onSubmit={handleSubmit} autoComplete="off">
                    <div className="register-grid">
                        <div className="register-field">
                            <label htmlFor="nombres">
                                <FiUser /> Nombres
                            </label>
                            <input
                                id="nombres"
                                name="given-name"
                                type="text"
                                autoComplete="given-name"
                                value={form.nombres_compl}
                                onChange={(e) =>
                                    update("nombres_compl", e.target.value)
                                }
                                maxLength={80}
                                required
                            />
                        </div>

                        <div className="register-field">
                            <label htmlFor="apellidos">
                                <FiUser /> Apellidos
                            </label>
                            <input
                                id="apellidos"
                                name="family-name"
                                type="text"
                                autoComplete="family-name"
                                value={form.apellidos_compl}
                                onChange={(e) =>
                                    update("apellidos_compl", e.target.value)
                                }
                                maxLength={80}
                                required
                            />
                        </div>

                        <div className="register-field">
                            <label htmlFor="documento">
                                <FiHash /> Documento
                            </label>
                            <input
                                id="documento"
                                name="documento"
                                type="text"
                                autoComplete="off"
                                value={form.documento}
                                onChange={(e) =>
                                    update("documento", e.target.value)
                                }
                                maxLength={20}
                                required
                            />
                        </div>

                        <div className="register-field">
                            <label htmlFor="codigo">
                                <FiHash /> Código de usuario
                            </label>
                            <input
                                id="codigo"
                                name="codigo_usuario"
                                type="text"
                                autoComplete="off"
                                value={form.codigo_usuario}
                                onChange={(e) =>
                                    update("codigo_usuario", e.target.value)
                                }
                                maxLength={20}
                                required
                            />
                        </div>

                        <div className="register-field">
                            <label htmlFor="correo">
                                <FiMail /> Correo electrónico
                            </label>
                            <input
                                id="correo"
                                name="email"
                                type="email"
                                autoComplete="email"
                                value={form.correo}
                                onChange={(e) =>
                                    update("correo", e.target.value)
                                }
                                required
                            />
                        </div>

                        <div className="register-field">
                            <label htmlFor="telefono">
                                <FiPhone /> Teléfono
                            </label>
                            <input
                                id="telefono"
                                name="tel"
                                type="tel"
                                autoComplete="tel"
                                value={form.telefono}
                                onChange={(e) =>
                                    update("telefono", e.target.value)
                                }
                                maxLength={20}
                                required
                            />
                        </div>

                        <div className="register-field">
                            <label htmlFor="colegio">
                                <FiBookOpen /> ID de institución/colegio
                            </label>
                            <input
                                id="colegio"
                                name="id_colegio"
                                type="number"
                                min="1"
                                autoComplete="off"
                                value={form.id_colegio}
                                onChange={(e) =>
                                    update("id_colegio", e.target.value)
                                }
                                required
                            />
                        </div>

                        <div className="register-field">
                            <label htmlFor="jornada">Jornada</label>
                            <select
                                id="jornada"
                                name="jornada"
                                value={form.jornada}
                                onChange={(e) =>
                                    update("jornada", e.target.value)
                                }
                                required
                            >
                                <option value="">
                                    Selecciona una jornada
                                </option>
                                <option value="mañana">Mañana</option>
                                <option value="tarde">Tarde</option>
                                <option value="noche">Noche</option>
                                <option value="única">Única</option>
                            </select>
                        </div>

                        {rol === "estudiante" && (
                            <div className="register-field">
                                <label htmlFor="curso">
                                    <FiBookOpen /> ID del curso
                                </label>
                                <input
                                    id="curso"
                                    name="id_curso"
                                    type="number"
                                    min="1"
                                    autoComplete="off"
                                    value={form.id_curso}
                                    onChange={(e) =>
                                        update("id_curso", e.target.value)
                                    }
                                    required
                                />
                                <small>
                                    Usa el identificador de un curso
                                    que ya exista en APRENZY.
                                </small>
                            </div>
                        )}

                        <div className="register-field">
                            <label htmlFor="contrasena">
                                <FiLock /> Contraseña
                            </label>
                            <input
                                id="contrasena"
                                name="new-password"
                                type="password"
                                autoComplete="new-password"
                                value={form.contrasena}
                                onChange={(e) =>
                                    update("contrasena", e.target.value)
                                }
                                minLength={6}
                                required
                            />
                        </div>

                        <div className="register-field">
                            <label htmlFor="confirmar">
                                <FiLock /> Confirmar contraseña
                            </label>
                            <input
                                id="confirmar"
                                name="confirmarContrasena"
                                type="password"
                                autoComplete="new-password"
                                value={form.confirmarContrasena}
                                onChange={(e) =>
                                    update(
                                        "confirmarContrasena",
                                        e.target.value
                                    )
                                }
                                minLength={6}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="login-error" role="alert">
                            {error}
                        </p>
                    )}

                    {mensaje && (
                        <p className="register-success" role="status">
                            {mensaje}
                        </p>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? "Creando cuenta..." : "Crear cuenta"}
                    </button>
                </form>

                <p className="register-switch">
                    ¿Ya tienes cuenta?{" "}
                    <button
                        type="button"
                        className="text-button"
                        onClick={onBackToLogin}
                    >
                        Inicia sesión
                    </button>
                </p>
            </section>
        </main>
    );
}
