
-- ============================================================
-- APRENZY
-- ESQUEMA DE BASE DE DATOS ACTUALIZADO
-- MOTOR: MySQL 8.0.16+
-- ============================================================

CREATE DATABASE IF NOT EXISTS aprenzy
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE aprenzy;


-- ============================================================
-- 1. COLEGIO
-- ============================================================

CREATE TABLE colegio (
    id_colegio INT AUTO_INCREMENT PRIMARY KEY,
    nombre_colegio VARCHAR(250) NOT NULL,
    codigo_dane VARCHAR(20) NULL,
    nit VARCHAR(20) NULL,
    direccion VARCHAR(250) NULL,
    telefono VARCHAR(20) NULL,
    correo_institucional VARCHAR(100) NULL,
    municipio VARCHAR(100) NULL,
    departamento VARCHAR(100) NULL,

    estado ENUM('activo', 'inactivo')
        NOT NULL DEFAULT 'activo',

    fecha_creacion DATETIME
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_colegio_codigo_dane
        UNIQUE (codigo_dane),

    CONSTRAINT uq_colegio_nit
        UNIQUE (nit)
) ENGINE=InnoDB;


-- ============================================================
-- 2. CURSO
-- Cada curso pertenece a un colegio.
-- ============================================================

CREATE TABLE curso (
    id_curso INT AUTO_INCREMENT PRIMARY KEY,
    id_colegio INT NOT NULL,
    numero_curso VARCHAR(10) NOT NULL,
    grado VARCHAR(20) NOT NULL,
    jornada VARCHAR(20) NOT NULL,

    CONSTRAINT uq_curso_colegio_numero
        UNIQUE (id_colegio, numero_curso),

    CONSTRAINT fk_curso_colegio
        FOREIGN KEY (id_colegio)
        REFERENCES colegio(id_colegio)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;


-- ============================================================
-- 3. USUARIO
-- Roles:
-- administrador, rector, coordinador, docente, estudiante.
--
-- El administrador global no pertenece a un colegio.
-- Los demás usuarios deben pertenecer a uno.
-- Solo puede existir un rector por colegio.
-- ============================================================

CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_colegio INT NULL,

    documento VARCHAR(20) NOT NULL,
    nombres_compl VARCHAR(80) NOT NULL,
    apellidos_compl VARCHAR(80) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    correo VARCHAR(100) NOT NULL,
    contrasena VARCHAR(255) NOT NULL,

    tipo_de_usuario ENUM(
        'administrador',
        'rector',
        'coordinador',
        'docente',
        'estudiante'
    ) NOT NULL,

    estado_aprobacion ENUM(
        'pendiente',
        'aprobada',
        'rechazada'
    ) NULL,

    jornada VARCHAR(20) NULL,

    -- Permite garantizar un solo rector por colegio.
    -- Para los demás roles el valor será NULL.
    id_colegio_rector INT
        GENERATED ALWAYS AS (
            CASE
                WHEN tipo_de_usuario = 'rector'
                THEN id_colegio
                ELSE NULL
            END
        ) STORED,

    CONSTRAINT uq_usuario_documento
        UNIQUE (documento),

    CONSTRAINT uq_usuario_correo
        UNIQUE (correo),

    CONSTRAINT uq_usuario_un_rector_por_colegio
        UNIQUE (id_colegio_rector),

    CONSTRAINT fk_usuario_colegio
        FOREIGN KEY (id_colegio)
        REFERENCES colegio(id_colegio)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_usuario_colegio
        CHECK (
            (
                tipo_de_usuario = 'administrador'
                AND id_colegio IS NULL
            )
            OR
            (
                tipo_de_usuario <> 'administrador'
                AND id_colegio IS NOT NULL
            )
        )
) ENGINE=InnoDB;


-- ============================================================
-- 4. USUARIO_CURSO
-- Relaciona estudiantes con sus cursos.
-- Un estudiante solo puede tener un curso directo.
-- ============================================================

CREATE TABLE usuario_curso (
    id_usuario_curso INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_curso INT NOT NULL,

    CONSTRAINT uq_usuario_curso_usuario
        UNIQUE (id_usuario),

    CONSTRAINT fk_usuario_curso_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_usuario_curso_curso
        FOREIGN KEY (id_curso)
        REFERENCES curso(id_curso)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;


-- ============================================================
-- 5. MATERIA
-- Las materias son independientes de los cursos.
-- No existe codigo_materia.
-- ============================================================

CREATE TABLE materia (
    id_materia INT AUTO_INCREMENT PRIMARY KEY,
    nombre_materia VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL
) ENGINE=InnoDB;


-- ============================================================
-- 6. DOCENTE_ASIGNACION
-- Relaciona docente + materia + curso.
-- ============================================================

CREATE TABLE docente_asignacion (
    id_asignacion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_materia INT NOT NULL,
    id_curso INT NOT NULL,

    CONSTRAINT uq_docente_materia_curso
        UNIQUE (id_usuario, id_materia, id_curso),

    CONSTRAINT fk_asignacion_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_asignacion_materia
        FOREIGN KEY (id_materia)
        REFERENCES materia(id_materia)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_asignacion_curso
        FOREIGN KEY (id_curso)
        REFERENCES curso(id_curso)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;


-- ============================================================
-- 7. INCAPACIDAD
-- ============================================================

CREATE TABLE incapacidad (
    id_incapacidad INT AUTO_INCREMENT PRIMARY KEY,
    numero_radicado VARCHAR(30) NOT NULL UNIQUE,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    archivo VARCHAR(255) NOT NULL,
    motivo TEXT NOT NULL,

    estado ENUM(
        'pendiente',
        'aprobada',
        'rechazada',
        'finalizada'
    ) NOT NULL,

    id_usuario INT NOT NULL,

    CONSTRAINT chk_incapacidad_fechas
        CHECK (fecha_fin >= fecha_inicio),

    CONSTRAINT fk_incapacidad_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;


-- ============================================================
-- 8. HISTORIAL_INCAPACIDAD
-- ============================================================

CREATE TABLE historial_incapacidad (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    id_incapacidad INT NOT NULL,
    fecha_anterior_inicio DATE NOT NULL,
    fecha_anterior_fin DATE NOT NULL,
    fecha_nueva_inicio DATE NOT NULL,
    fecha_nueva_fin DATE NOT NULL,
    motivo_cambio TEXT NOT NULL,
    fecha_cambio DATETIME NOT NULL,
    id_usuario_cambio INT NOT NULL,

    CONSTRAINT chk_historial_fechas_anteriores
        CHECK (
            fecha_anterior_fin >= fecha_anterior_inicio
        ),

    CONSTRAINT chk_historial_fechas_nuevas
        CHECK (
            fecha_nueva_fin >= fecha_nueva_inicio
        ),

    CONSTRAINT fk_historial_incapacidad
        FOREIGN KEY (id_incapacidad)
        REFERENCES incapacidad(id_incapacidad)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_historial_usuario
        FOREIGN KEY (id_usuario_cambio)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;


-- ============================================================
-- 9. APELACION
-- Una incapacidad puede tener máximo una apelación.
-- ============================================================

CREATE TABLE apelacion (
    id_apelacion INT AUTO_INCREMENT PRIMARY KEY,
    id_incapacidad INT NOT NULL UNIQUE,
    fecha_apelacion DATETIME NOT NULL,
    motivo TEXT NOT NULL,
    respuesta TEXT NULL,

    estado ENUM(
        'pendiente',
        'aprobada',
        'rechazada'
    ) NOT NULL,

    id_revisor INT NULL,

    CONSTRAINT fk_apelacion_incapacidad
        FOREIGN KEY (id_incapacidad)
        REFERENCES incapacidad(id_incapacidad)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_apelacion_revisor
        FOREIGN KEY (id_revisor)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;


-- ============================================================
-- 10. ACCESO_ACADEMICO
-- Una incapacidad puede generar máximo un acceso.
-- ============================================================

CREATE TABLE acceso_academico (
    id_acceso INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_incapacidad INT NOT NULL UNIQUE,

    estado ENUM(
        'activo',
        'suspendido',
        'finalizado'
    ) NOT NULL,

    CONSTRAINT fk_acceso_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_acceso_incapacidad
        FOREIGN KEY (id_incapacidad)
        REFERENCES incapacidad(id_incapacidad)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- 11. MATERIAL_ACADEMICO
-- Pertenece a un docente, materia y curso.
-- id_curso admite NULL según el modelo actual.
-- ============================================================

CREATE TABLE material_academico (
    id_material INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_materia INT NOT NULL,
    id_curso INT NULL,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    archivo VARCHAR(255) NOT NULL,
    fecha_publicacion DATETIME NOT NULL,

    CONSTRAINT fk_material_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_material_materia
        FOREIGN KEY (id_materia)
        REFERENCES materia(id_materia)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_material_curso
        FOREIGN KEY (id_curso)
        REFERENCES curso(id_curso)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;


-- ============================================================
-- 12. ACTIVIDAD
-- Pertenece a un docente, materia y curso.
-- id_curso admite NULL según el modelo actual.
-- ============================================================

CREATE TABLE actividad (
    id_actividad INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    titulo VARCHAR(120) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_publicacion DATE NOT NULL,
    fecha_limite DATE NOT NULL,
    id_materia INT NOT NULL,
    id_curso INT NULL,

    CONSTRAINT chk_actividad_fechas
        CHECK (fecha_limite >= fecha_publicacion),

    CONSTRAINT fk_actividad_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_actividad_materia
        FOREIGN KEY (id_materia)
        REFERENCES materia(id_materia)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_actividad_curso
        FOREIGN KEY (id_curso)
        REFERENCES curso(id_curso)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;


-- ============================================================
-- 13. ENTREGA
-- ============================================================

CREATE TABLE entrega (
    id_entrega INT AUTO_INCREMENT PRIMARY KEY,
    id_actividad INT NOT NULL,
    id_usuario INT NOT NULL,
    fecha_entrega DATETIME NOT NULL,

    estado ENUM(
        'Pendiente',
        'Aprobado',
        'Reprobado'
    ) NOT NULL DEFAULT 'Pendiente',

    descripcion TEXT NOT NULL,
    comentario_docente TEXT NULL,
    archivo VARCHAR(255) NULL,
    nota INT NULL,

    CONSTRAINT chk_entrega_nota
        CHECK (
            nota IS NULL
            OR nota BETWEEN 0 AND 100
        ),

    CONSTRAINT fk_entrega_actividad
        FOREIGN KEY (id_actividad)
        REFERENCES actividad(id_actividad)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_entrega_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;


-- ============================================================
-- 14. ÍNDICES PARA CONSULTAS FRECUENTES
-- ============================================================

CREATE INDEX idx_usuario_colegio
    ON usuario(id_colegio);

CREATE INDEX idx_usuario_tipo_colegio
    ON usuario(tipo_de_usuario, id_colegio);

CREATE INDEX idx_usuario_estado_aprobacion
    ON usuario(estado_aprobacion);

CREATE INDEX idx_curso_colegio
    ON curso(id_colegio);

CREATE INDEX idx_usuario_curso_curso
    ON usuario_curso(id_curso);

CREATE INDEX idx_asignacion_usuario
    ON docente_asignacion(id_usuario);

CREATE INDEX idx_asignacion_materia
    ON docente_asignacion(id_materia);

CREATE INDEX idx_asignacion_curso
    ON docente_asignacion(id_curso);

CREATE INDEX idx_incapacidad_usuario
    ON incapacidad(id_usuario);

CREATE INDEX idx_incapacidad_estado
    ON incapacidad(estado);

CREATE INDEX idx_historial_incapacidad
    ON historial_incapacidad(id_incapacidad);

CREATE INDEX idx_apelacion_revisor
    ON apelacion(id_revisor);

CREATE INDEX idx_acceso_usuario
    ON acceso_academico(id_usuario);

CREATE INDEX idx_material_usuario
    ON material_academico(id_usuario);

CREATE INDEX idx_material_materia
    ON material_academico(id_materia);

CREATE INDEX idx_material_curso
    ON material_academico(id_curso);

CREATE INDEX idx_actividad_usuario
    ON actividad(id_usuario);

CREATE INDEX idx_actividad_materia
    ON actividad(id_materia);

CREATE INDEX idx_actividad_curso
    ON actividad(id_curso);

CREATE INDEX idx_entrega_actividad
    ON entrega(id_actividad);

CREATE INDEX idx_entrega_usuario
    ON entrega(id_usuario);
