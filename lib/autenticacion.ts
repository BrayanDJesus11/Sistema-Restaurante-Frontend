const URL_API = "https://backend-restaurante-bxhph5hzd0e4bahy.japaneast-01.azurewebsites.net/api";

export async function iniciarSesion(
  correo: string,
  contrasena: string
) {
  const respuesta = await fetch(
    `${URL_API}/autenticacion/iniciar-sesion`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        correo,
        contrasena,
      }),
    }
  );

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || "Error al iniciar sesión.");
  }

  if (!datos.token) {
    throw new Error("El servidor no devolvió un token de autenticación.");
  }

  // Guardar el JWT durante la sesión del navegador
  sessionStorage.setItem("fastmanager_token", datos.token);

  return datos;
}