# Modelo de Datos

Para el desarrollo del sistema **Aprenzy** se propone el uso de un modelo de datos relacional, implementado en un sistema gestor de bases de datos que permita almacenar y administrar de forma segura la información académica y administrativa de la plataforma.

El modelo está diseñado para gestionar el proceso de acompañamiento académico de estudiantes que presentan incapacidades médicas iguales o superiores a tres días, permitiendo que docentes y coordinadores validen la solicitud y habiliten el acceso a materiales, actividades y calificaciones correspondientes.

El modelo de datos está compuesto por las siguientes entidades principales:

## Entidad Usuario

Almacena la información general de las personas que interactúan con el sistema, incluyendo estudiantes, docentes y coordinadores.

**Atributos:**

* id_usuario (clave primaria)
* documento
* nombres_compl
* apellidos_compl
* correo
* contraseña
* telefono
* tipo_de_usuario
* id_curso (clave foránea)

---

## Entidad Curso

Representa los cursos o grupos académicos existentes dentro de la institución educativa.

**Atributos:**

* id_curso (clave primaria)
* codigo_curso
* grado
* jornada

---

## Entidad Materia

Almacena las materias asignadas a cada curso y al docente responsable.

**Atributos:**

* id_materia (clave primaria)
* codigo_materia
* nombre_materia
* descripcion
* id_curso (clave foránea)
* id_usuario (clave foránea)

---

## Entidad Actividad

Contiene las actividades académicas que los estudiantes deben desarrollar durante el periodo de incapacidad.

**Atributos:**

* id_actividad (clave primaria)
* titulo
* descripcion
* fecha_publicacion
* fecha_limite
* id_materia (clave foránea)

---

## Entidad Incapacidad

Registra las solicitudes de incapacidad presentadas por los estudiantes junto con su documentación de soporte.

**Atributos:**

* id_incapacidad (clave primaria)
* numero_radicado
* fecha_inicio
* fecha_fin
* motivo
* archivo
* estado
* id_usuario (clave foránea)

---

## Entidad Entrega

Almacena las actividades entregadas por los estudiantes durante el periodo autorizado por la incapacidad.

**Atributos:**

* id_entrega (clave primaria)
* comentario
* archivo
* fecha_entrega
* id_usuario (clave foránea)
* id_actividad (clave foránea)

---

## Entidad Calificacion

Registra la evaluación realizada por el docente sobre cada entrega efectuada por el estudiante.

**Atributos:**

* id_calificacion (clave primaria)
* nota
* comentario_docente
* fecha_calificacion
* estado
* id_entrega (clave foránea)

---

# Relaciones Principales

* Un curso puede tener múltiples usuarios asociados.
* Un curso puede contener múltiples materias.
* Un usuario puede estar asignado a varias materias como docente responsable.
* Una materia puede contener múltiples actividades.
* Un usuario puede registrar múltiples incapacidades.
* Un usuario puede realizar múltiples entregas.
* Una actividad puede recibir múltiples entregas.
* Cada entrega genera una única calificación.

---

# Descripción General del Modelo

El modelo de datos de **Aprenzy** está orientado a facilitar la gestión académica de estudiantes que, debido a una incapacidad médica, requieren continuar con sus actividades escolares de manera virtual.

La estructura permite registrar la información de usuarios, cursos, materias y actividades, administrar las solicitudes de incapacidad, controlar las entregas realizadas por los estudiantes y almacenar las calificaciones emitidas por los docentes. Además, establece relaciones claras entre las entidades, garantizando la integridad de la información y facilitando el seguimiento del proceso académico durante el periodo de ausencia.

Este modelo proporciona una base sólida para el desarrollo de la plataforma, asegurando una administración organizada de los datos y permitiendo un acceso eficiente a la información por parte de estudiantes, docentes y coordinadores.
