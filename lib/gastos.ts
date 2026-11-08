const URL_API = "http://localhost:8080/api";

export interface Gasto {
  id?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  name: string;
  amount: number;
  category: string;
  date: string;
  recurring: boolean;
  frequency?: "diario" | "semanal" | "mensual" | "anual";
}

export interface GastoRespuesta extends Gasto {
  id: string;
}

export async function obtenerGastos(): Promise<GastoRespuesta[]> {
  const respuesta = await fetch(`${URL_API}/gastos`);

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || "Error al obtener los gastos.");
  }

  return datos;
}

export async function obtenerGastoPorId(id: string): Promise<GastoRespuesta> {
  const respuesta = await fetch(`${URL_API}/gastos/${id}`);

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || "Error al obtener el gasto.");
  }

  return datos;
}

export async function crearGasto(gasto: Gasto): Promise<GastoRespuesta> {
  const respuesta = await fetch(`${URL_API}/gastos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(gasto),
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || "Error al crear el gasto.");
  }

  return datos;
}

export async function actualizarGasto(
  id: string,
  gasto: Gasto,
): Promise<GastoRespuesta> {
  const respuesta = await fetch(`${URL_API}/gastos/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(gasto),
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || "Error al actualizar el gasto.");
  }

  return datos;
}

export async function eliminarGasto(id: string): Promise<void> {
  const respuesta = await fetch(`${URL_API}/gastos/${id}`, {
    method: "DELETE",
  });

  if (!respuesta.ok) {
    const datos = await respuesta.json();
    throw new Error(datos.mensaje || "Error al eliminar el gasto.");
  }
}
