# Arquitectura

Aprenzy utiliza una arquitectura en capas que separa la interfaz de usuario, la lógica de negocio y la gestión de datos, facilitando el mantenimiento, la escalabilidad y la organización del sistema.

## Capa de Presentación

Responsable de la interacción con los usuarios mediante interfaces web. Permite el acceso a funcionalidades como autenticación, gestión de cursos, actividades, evaluaciones y consulta de progreso.

## Capa de Lógica de Negocio

Contiene las reglas y procesos principales del sistema. Gestiona la validación de datos, administración de usuarios, control de cursos, evaluaciones, actividades y seguimiento académico.

## Capa de Acceso a Datos

Encargada de la comunicación con la base de datos. Permite almacenar, consultar, actualizar y eliminar la información requerida por el sistema.

## Base de Datos

Implementada mediante un modelo relacional que almacena la información de usuarios, cursos, módulos, actividades, evaluaciones, resultados y progreso académico.

## Beneficios de la Arquitectura

* Separación de responsabilidades.
* Mayor facilidad de mantenimiento.
* Escalabilidad para futuras funcionalidades.
* Mejor organización del código.
* Mayor seguridad y control de acceso a la información.
