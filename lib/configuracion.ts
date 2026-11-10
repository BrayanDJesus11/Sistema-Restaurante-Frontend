const URL_API = "https://backend-restaurante-bxhph5hzd0e4bahy.japaneast-01.azurewebsites.net/api";

export interface Configuracion {
  workdayStart: string;
  workdayEnd: string;
  jornadaConfigurada: boolean;
  jornadaActiva: boolean;
}

type ConfiguracionActualizacion = {
  workdayStart: string;
  workdayEnd: string;
};

export async function obtenerConfiguracion(): Promise<Configuracion> {
  const respuesta = await fetch(`${URL_API}/configuracion`);

  if (!respuesta.ok) {
    throw new Error("No fue posible obtener la configuración.");
  }

  return await respuesta.json();
}

export async function actualizarConfiguracion(
  configuracion: ConfiguracionActualizacion,
): Promise<Configuracion> {
  const respuesta = await fetch(`${URL_API}/configuracion`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(configuracion),
  });

  if (!respuesta.ok) {
    const error = await respuesta.text();

    console.error(error);

    throw new Error("No fue posible actualizar la configuración.");
  }

  return await respuesta.json();
}