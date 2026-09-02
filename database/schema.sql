
-- APRENZY
-- BASE DE DATOS - MVP BACKEND
-- MOTOR: MySQL 8+


-- 1. CREAR BASE DE DATOS

CREATE DATABASE IF NOT EXISTS aprenzy
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE aprenzy;


-- 2. TABLA: COLEGIO

CREATE TABLE colegio (
    id_colegio INT AUTO_INCREMENT PRIMARY KEY,
    nombre_colegio VARCHAR(250) NOT NULL
) ENGINE=InnoDB;


-- 3. TABLA: CURSO
-- Un colegio puede tener muchos cursos.
--
-- La combinación:
-- id_colegio + numero_curso
--
-- debe ser única.

CREATE TABLE curso (
    id_curso INT AUTO_INCREMENT PRIMARY KEY,

    id_colegio INT NOT NULL,

    numero_curso VARCHAR(15) NOT NULL,

    grado VARCHAR(10) NOT NULL,

    jornada VARCHAR(20) NOT NULL,

    CONSTRAINT uq_curso_colegio_numero
        UNIQUE (id_colegio, numero_curso),

    CONSTRAINT fk_curso_colegio
        FOREIGN KEY (id_colegio)
        REFERENCES colegio(id_colegio)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;


-- 4. TABLA: USUARIO
-- Almacena:
-- administrador
-- docente
-- estudiante
--
-- La contraseña NO se almacenará en texto plano.
-- El backend almacenará un HASH.

CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,

    id_colegio INT NOT NULL,

    codigo_usuario VARCHAR(20) NOT NULL UNIQUE,

    documento VARCHAR(20) NOT NULL UNIQUE,

    nombres_compl VARCHAR(80) NOT NULL,

    apellidos_compl VARCHAR(80) NOT NULL,

    telefono VARCHAR(20) NOT NULL,

    correo VARCHAR(100) NOT NULL UNIQUE,

    contrasena VARCHAR(255) NOT NULL,

    tipo_de_usuario ENUM(
        'administrador',
        'docente',
        'estudiante'
    ) NOT NULL,

    jornada VARCHAR(20),

    CONSTRAINT fk_usuario_colegio
        FOREIGN KEY (id_colegio)
        REFERENCES colegio(id_colegio)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;


-- 5. TABLA: USUARIO_CURSO
-- Relación N:M entre usuario y curso.
--
-- Estudiante:
--   Solo podrá pertenecer a un curso.
--
-- Docente:
--   Podrá pertenecer a varios cursos.
--
-- Administrador:
--   No necesita curso.
--
-- La restricción específica del estudiante será
-- controlada posteriormente mediante reglas de negocio
-- en el backend.

CREATE TABLE usuario_curso (
    id_usuario_curso INT AUTO_INCREMENT PRIMARY KEY,

    id_usuario INT NOT NULL,

    id_curso INT NOT NULL,

    CONSTRAINT uq_usuario_curso
        UNIQUE (id_usuario, id_curso),

    CONSTRAINT fk_usuario_curso_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_usuario_curso_curso
        FOREIGN KEY (id_curso)
        REFERENCES curso(id_curso)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- 6. TABLA: MATERIA
-- Una materia pertenece a un curso.
--
-- El código de materia debe ser único dentro del curso.

CREATE TABLE materia (
    id_materia INT AUTO_INCREMENT PRIMARY KEY,

    codigo_materia VARCHAR(20) NOT NULL,

    nombre_materia VARCHAR(100) NOT NULL,

    descripcion TEXT NOT NULL,

    id_curso INT NOT NULL,

    CONSTRAINT uq_materia_curso_codigo
        UNIQUE (id_curso, codigo_materia),

    CONSTRAINT fk_materia_curso
        FOREIGN KEY (id_curso)
        REFERENCES curso(id_curso)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;


-- 7. TABLA: DOCENTE_MATERIA
-- Define qué materias puede gestionar un docente.
--
-- Un docente puede gestionar varias materias.
-- Una materia puede tener varios docentes.

CREATE TABLE docente_materia (
    id_docente_materia INT AUTO_INCREMENT PRIMARY KEY,

    id_usuario INT NOT NULL,

    id_materia INT NOT NULL,

    CONSTRAINT uq_docente_materia
        UNIQUE (id_usuario, id_materia),

    CONSTRAINT fk_docente_materia_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_docente_materia_materia
        FOREIGN KEY (id_materia)
        REFERENCES materia(id_materia)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- 8. TABLA: INCAPACIDAD
-- Una incapacidad pertenece a un usuario.
--
-- La validación de que dicho usuario sea estudiante
-- se realizará mediante reglas de negocio.

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


-- 9. TABLA: HISTORIAL_INCAPACIDAD
-- Registra cambios realizados sobre una incapacidad.
--
-- Permite conservar:
-- - fechas anteriores
-- - fechas nuevas
-- - motivo
-- - fecha del cambio
-- - usuario que realizó el cambio
--
-- Será especialmente útil para extensiones.

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
        CHECK (fecha_anterior_fin >= fecha_anterior_inicio),

    CONSTRAINT chk_historial_fechas_nuevas
        CHECK (fecha_nueva_fin >= fecha_nueva_inicio),

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


-- 10. TABLA: APELACION
-- Una incapacidad puede tener:
--
-- 0 o 1 apelación.
--
-- Esto se garantiza mediante:
--
-- UNIQUE(id_incapacidad)

CREATE TABLE apelacion (
    id_apelacion INT AUTO_INCREMENT PRIMARY KEY,

    id_incapacidad INT NOT NULL UNIQUE,

    fecha_apelacion DATETIME NOT NULL,

    motivo TEXT NOT NULL,

    respuesta TEXT,

    estado ENUM(
        'pendiente',
        'aprobada',
        'rechazada'
    ) NOT NULL,

    id_revisor INT,

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


-- 11. TABLA: ACCESO_ACADEMICO
-- Controla el acceso académico temporal.
--
-- IMPORTANTE:
-- Este registro NO representa el inicio de sesión.
--
-- Una incapacidad puede generar como máximo
-- un registro de acceso académico.

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


-- 12. TABLA: MATERIAL_ACADEMICO
-- Material publicado por docentes.
--
-- El docente debe estar autorizado para gestionar
-- la materia correspondiente.
--
-- Esa validación se hará en el backend.


CREATE TABLE material_academico (
    id_material INT AUTO_INCREMENT PRIMARY KEY,

    id_usuario INT NOT NULL,

    id_materia INT NOT NULL,

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
        ON DELETE RESTRICT
) ENGINE=InnoDB;



-- 13. TABLA: ACTIVIDAD

-- Una actividad pertenece a:
-- - un docente
-- - una materia
--
-- El docente establece la fecha límite.


CREATE TABLE actividad (
    id_actividad INT AUTO_INCREMENT PRIMARY KEY,

    id_usuario INT NOT NULL,

    titulo VARCHAR(120) NOT NULL,

    descripcion TEXT NOT NULL,

    fecha_publicacion DATE NOT NULL,

    fecha_limite DATE NOT NULL,

    id_materia INT NOT NULL,

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
        ON DELETE RESTRICT
) ENGINE=InnoDB;



-- 14. TABLA: ENTREGA
-- 
-- Una entrega pertenece a:
-- - una actividad
-- - un estudiante
--
-- nota:
-- 0 a 100
-- sin decimales.

CREATE TABLE entrega (
    id_entrega INT AUTO_INCREMENT PRIMARY KEY,

    id_actividad INT NOT NULL,

    id_usuario INT NOT NULL,

    fecha_entrega DATETIME NOT NULL,

    estado ENUM(
        'Aprobado',
        'Reprobado'
    ) NOT NULL,

    descripcion TEXT NOT NULL,

    comentario_docente TEXT,

    archivo VARCHAR(255),

    nota INT,

    CONSTRAINT chk_entrega_nota
        CHECK (nota IS NULL OR nota BETWEEN 0 AND 100),

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


-- 15. ÍNDICES
-- Algunos índices son creados automáticamente por
-- PRIMARY KEY y UNIQUE.
--
-- Estos adicionales ayudan a consultas frecuentes.


CREATE INDEX idx_usuario_colegio
    ON usuario(id_colegio);

CREATE INDEX idx_usuario_curso_usuario
    ON usuario_curso(id_usuario);

CREATE INDEX idx_usuario_curso_curso
    ON usuario_curso(id_curso);

CREATE INDEX idx_materia_curso
    ON materia(id_curso);

CREATE INDEX idx_docente_materia_usuario
    ON docente_materia(id_usuario);

CREATE INDEX idx_docente_materia_materia
    ON docente_materia(id_materia);

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

CREATE INDEX idx_actividad_usuario
    ON actividad(id_usuario);

CREATE INDEX idx_actividad_materia
    ON actividad(id_materia);

CREATE INDEX idx_entrega_actividad
    ON entrega(id_actividad);

CREATE INDEX idx_entrega_usuario
    ON entrega(id_usuario);
