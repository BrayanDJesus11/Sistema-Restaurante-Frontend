const URL_API = "https://backend-restaurante-bxhph5hzd0e4bahy.japaneast-01.azurewebsites.net/api";

// Estructura de los usuarios
export interface UsuarioEmpleado {
    id: string;
    nombre: string;
    correo: string;
    rol: "DUENO" | "EMPLEADO";
    activo: boolean;
}

// Obtener el token y preparar los encabezados
function obtenerHeaders(): HeadersInit {
    const token = sessionStorage.getItem("fastmanager_token");

    if (!token) {
        throw new Error("No hay una sesión autenticada. Inicia sesión nuevamente.");
    }

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

// Procesar respuestas del backend
async function procesarRespuesta<T>(
    respuesta: Response,
): Promise<T> {
    const texto = await respuesta.text();

    let datos: any = null;

    try {
        datos = texto ? JSON.parse(texto) : null;
    } catch {
        datos = null;
    }

    if (!respuesta.ok) {
        throw new Error(
            datos?.mensaje ||
            datos?.message ||
            texto ||
            "No fue posible completar la operación.",
        );
    }

    return datos as T;
}

// Listar empleados
export async function obtenerEmpleados(): Promise<UsuarioEmpleado[]> {
    const respuesta = await fetch(`${URL_API}/usuarios`, {
        method: "GET",
        headers: obtenerHeaders(),
    });

    return procesarRespuesta<UsuarioEmpleado[]>(respuesta);
}

// Crear empleado
export async function crearEmpleado(datos: {
    nombre: string;
    correo: string;
    contrasena: string;
}): Promise<UsuarioEmpleado> {
    const respuesta = await fetch(`${URL_API}/usuarios`, {
        method: "POST",
        headers: obtenerHeaders(),
        body: JSON.stringify(datos),
    });

    return procesarRespuesta<UsuarioEmpleado>(respuesta);
}

// Activar o desactivar empleado
export async function cambiarEstadoEmpleado(
    id: string,
    activo: boolean,
): Promise<UsuarioEmpleado> {
    const respuesta = await fetch(
        `${URL_API}/usuarios/${encodeURIComponent(id)}/estado`,
        {
            method: "PUT",
            headers: obtenerHeaders(),
            body: JSON.stringify({ activo }),
        },
    );

    return procesarRespuesta<UsuarioEmpleado>(respuesta);
}

// Cambiar contraseña
export async function cambiarContrasenaEmpleado(
    id: string,
    nuevaContrasena: string,
): Promise<UsuarioEmpleado> {
    const respuesta = await fetch(
        `${URL_API}/usuarios/${encodeURIComponent(id)}/contrasena`,
        {
            method: "PUT",
            headers: obtenerHeaders(),
            body: JSON.stringify({ nuevaContrasena }),
        },
    );

    return procesarRespuesta<UsuarioEmpleado>(respuesta);
}