const URL_API = "http://localhost:8080/api";

export async function registrarDesperdicio(data: any) {
  const respuesta = await fetch(`${URL_API}/desperdicios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!respuesta.ok) {
    let mensaje = "No fue posible registrar el desperdicio.";

    try {
      const error = await respuesta.json();

      console.log("Error recibido del backend:", error);
      mensaje =
        error.mensaje ||
        error.detail ||
        error.message ||
        error.error ||
        mensaje;
    } catch {
      // Si el backend no devuelve JSON, usamos el mensaje genérico
    }

    throw new Error(mensaje);
  }

  return await respuesta.json();
}

export async function listarDesperdicios() {
  const respuesta = await fetch(`${URL_API}/desperdicios`);

  if (!respuesta.ok) {
    throw new Error("No fue posible obtener los desperdicios.");
  }

  return await respuesta.json();
}
