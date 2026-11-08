const URL_API = "http://localhost:8080/api";

export async function obtenerPedidos() {
  const respuesta = await fetch(`${URL_API}/pedidos`);

  if (!respuesta.ok) {
    throw new Error("No fue posible obtener los pedidos.");
  }

  return await respuesta.json();
}

export async function registrarPedido(pedido: any) {
  const respuesta = await fetch(`${URL_API}/pedidos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pedido),
  });

  if (!respuesta.ok) {
    const error = await respuesta.text();

    console.error(error);

    throw new Error(error);
  }

  return await respuesta.json();
}

export async function eliminarPedido(id: string) {
  const respuesta = await fetch(`${URL_API}/pedidos/${id}`, {
    method: "DELETE",
  });

  if (!respuesta.ok) {
    throw new Error("No fue posible eliminar el pedido.");
  }
}

export async function actualizarPedido(id: string, pedido: any) {
  const respuesta = await fetch(`${URL_API}/pedidos/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pedido),
  });

  if (!respuesta.ok) {
    const error = await respuesta.text();

    console.error(error);

    throw new Error(error);
  }

  return await respuesta.json();
}

export async function actualizarEstadoPedido(id: string, status: string) {
  const respuesta = await fetch(`${URL_API}/pedidos/${id}/estado`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!respuesta.ok) {
    throw new Error("No fue posible actualizar el estado del pedido.");
  }

  return await respuesta.json();
}

export async function obtenerIngredientesPedido(id: string) {
  const respuesta = await fetch(`${URL_API}/pedidos/${id}/ingredientes`);

  if (!respuesta.ok) {
    throw new Error("No fue posible obtener los ingredientes.");
  }

  return await respuesta.json();
}

export async function registrarPago(
  id: string,
  pago: {
    paymentMethod: string;
    cashAmount: number;
    transferAmount: number;
  },
) {
  const respuesta = await fetch(`${URL_API}/pedidos/${id}/pago`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pago),
  });

  if (!respuesta.ok) {
    throw new Error("No fue posible registrar el pago.");
  }

  return await respuesta.json();
}

export async function agregarTiempo(id: string, minutes: number) {
  console.log("Llamando API", id, minutes);

  const respuesta = await fetch(`${URL_API}/pedidos/${id}/tiempo`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      minutes,
    }),
  });

  if (!respuesta.ok) {
    throw new Error("No fue posible agregar tiempo.");
  }

  return await respuesta.json();
}

export async function cancelarManteniendoParaVenta(id: string) {
  const respuesta = await fetch(
    `${URL_API}/pedidos/${id}/cancelar-mantener-venta`,
    {
      method: "PUT",
    },
  );

  if (!respuesta.ok) {
    const error = await respuesta.text();
    console.error(error);
    throw new Error("No fue posible mantener el pedido para la venta.");
  }

  return await respuesta.json();
}
