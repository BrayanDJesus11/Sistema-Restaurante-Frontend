const URL_API = "https://backend-restaurante-bxhph5hzd0e4bahy.japaneast-01.azurewebsites.net/api";

export async function obtenerIngredientes() {
  const respuesta = await fetch(`${URL_API}/ingredientes`);

  if (!respuesta.ok) {
    throw new Error("No fue posible obtener los ingredientes.");
  }

  return await respuesta.json();
}

export async function crearIngrediente(ingrediente: any) {
  const respuesta = await fetch(`${URL_API}/ingredientes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ingrediente),
  });

  if (!respuesta.ok) {
    throw new Error("No fue posible crear el ingrediente.");
  }

  return await respuesta.json();
}

export async function actualizarIngrediente(id: string, ingrediente: any) {
  const respuesta = await fetch(`${URL_API}/ingredientes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ingrediente),
  });

  if (!respuesta.ok) {
    throw new Error("No fue posible actualizar el ingrediente.");
  }

  return await respuesta.json();
}

async function obtenerMensajeError(
  respuesta: Response,
  mensajePredeterminado: string,
): Promise<string> {
  const texto = await respuesta.text();

  if (texto) {
    try {
      const datos: unknown = JSON.parse(texto);

      if (datos && typeof datos === "object") {
        const cuerpo = datos as {
          message?: unknown;
          detail?: unknown;
        };

        if (
          typeof cuerpo.message === "string" &&
          cuerpo.message.trim()
        ) {
          return cuerpo.message;
        }

        if (
          typeof cuerpo.detail === "string" &&
          cuerpo.detail.trim()
        ) {
          return cuerpo.detail;
        }
      }
    } catch {
      // La respuesta no contiene JSON válido.
    }
  }

  if (respuesta.status === 409) {
    return "No se puede desactivar este ingrediente porque está asociado a una o más recetas. Primero retíralo de las recetas.";
  }

  return mensajePredeterminado;
}

export async function eliminarIngrediente(id: string) {
  const respuesta = await fetch(`${URL_API}/ingredientes/${id}`, {
    method: "DELETE",
  });

  if (!respuesta.ok) {
    const mensaje = await obtenerMensajeError(
      respuesta,
      "No fue posible desactivar el ingrediente.",
    );

    throw new Error(mensaje);
  }
}


export async function obtenerIngredientesDesactivados() {
  const respuesta = await fetch(`${URL_API}/ingredientes/desactivados`);

  if (!respuesta.ok) {
    throw new Error("No fue posible obtener los ingredientes desactivados.");
  }

  return await respuesta.json();
}

export async function reactivarIngrediente(id: string) {
  const respuesta = await fetch(
    `${URL_API}/ingredientes/${id}/reactivar`,
    {
      method: "PUT",
    },
  );

  if (!respuesta.ok) {
    const mensaje = await obtenerMensajeError(
      respuesta,
      "No fue posible reactivar el ingrediente.",
    );

    throw new Error(mensaje);
  }

  return await respuesta.json();
}
