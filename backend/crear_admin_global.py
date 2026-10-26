
from getpass import getpass

from sqlalchemy.exc import IntegrityError

from app.database.conection import SessionLocal
from app.models.Usuarios import Usuario
from app.core.security import hash_password


def main():
    db = SessionLocal()

    try:
        # Si ya existe un administrador global, no crear otro.
        admin_existente = (
            db.query(Usuario)
            .filter(
                Usuario.tipo_de_usuario == "administrador",
                Usuario.id_colegio.is_(None),
            )
            .first()
        )

        if admin_existente:
            print(
                "Ya existe un administrador global."
            )
            print(
                f"ID de usuario: {admin_existente.id_usuario}"
            )
            print(
                f"Correo: {admin_existente.correo}"
            )
            return

        print("=== Crear administrador global de APRENZY ===")
        print("La contraseña no se mostrará en pantalla.\n")

        codigo_usuario = input(
            "Código de usuario: "
        ).strip()

        documento = input(
            "Documento: "
        ).strip()

        nombres = input(
            "Nombres: "
        ).strip()

        apellidos = input(
            "Apellidos: "
        ).strip()

        telefono = input(
            "Teléfono: "
        ).strip()

        correo = input(
            "Correo electrónico: "
        ).strip().lower()

        contrasena = getpass(
            "Contraseña: "
        )

        confirmar = getpass(
            "Confirma la contraseña: "
        )

        if not all([
            codigo_usuario,
            documento,
            nombres,
            apellidos,
            telefono,
            correo,
        ]):
            print(
                "Error: todos los campos son obligatorios."
            )
            return

        if len(codigo_usuario) > 20:
            print("Error: el código admite máximo 20 caracteres.")
            return

        if len(documento) > 20:
            print("Error: el documento admite máximo 20 caracteres.")
            return

        if len(nombres) > 80 or len(apellidos) > 80:
            print("Error: nombres y apellidos admiten máximo 80 caracteres.")
            return

        if len(telefono) > 20 or len(correo) > 100:
            print("Error: teléfono o correo demasiado largos.")
            return

        if len(contrasena) < 6:
            print(
                "Error: la contraseña debe tener al menos 6 caracteres."
            )
            return

        if contrasena != confirmar:
            print("Error: las contraseñas no coinciden.")
            return

        # Comprobar que los datos únicos no estén registrados.
        campos_unicos = {
            "código de usuario": (
                Usuario.codigo_usuario,
                codigo_usuario,
            ),
            "documento": (
                Usuario.documento,
                documento,
            ),
            "correo": (
                Usuario.correo,
                correo,
            ),
        }

        for nombre_campo, (columna, valor) in campos_unicos.items():
            existe = (
                db.query(Usuario)
                .filter(columna == valor)
                .first()
            )

            if existe:
                print(
                    f"Error: el {nombre_campo} ya está registrado."
                )
                return

        administrador = Usuario(
            id_colegio=None,
            codigo_usuario=codigo_usuario,
            documento=documento,
            nombres_compl=nombres,
            apellidos_compl=apellidos,
            telefono=telefono,
            correo=correo,
            contrasena=hash_password(contrasena),
            tipo_de_usuario="administrador",
            jornada=None,
        )

        db.add(administrador)
        db.commit()
        db.refresh(administrador)

        print("\nAdministrador global creado correctamente.")
        print(f"ID: {administrador.id_usuario}")
        print(f"Correo: {administrador.correo}")
        print("Ya puedes iniciar sesión desde APRENZY.")

    except IntegrityError:
        db.rollback()
        print(
            "No se pudo crear la cuenta: uno o más datos "
            "ya existen en la base de datos."
        )

    except Exception:
        db.rollback()
        print(
            "Ocurrió un error al crear la cuenta. "
            "Revisa la configuración de la base de datos."
        )
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
