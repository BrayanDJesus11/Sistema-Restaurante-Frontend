const URL_API = "http://localhost:8080/api";

export async function obtenerCompras() {
  const respuesta = await fetch(`${URL_API}/compras`);

  if (!respuesta.ok) {
    throw new Error("No fue posible obtener las compras.");
  }

  return await respuesta.json();
}

export async function registrarCompra(compra: any) {
  const respuesta = await fetch(`${URL_API}/compras`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(compra),
  });

  if (!respuesta.ok) {
    const error = await respuesta.text();

    console.error(error);

    throw new Error(error);
  }
  return await respuesta.json();
}
