const URL_API = "http://localhost:8080/api";

export async function obtenerProductos() {
  const respuesta = await fetch(`${URL_API}/productos`);

  if (!respuesta.ok) {
    throw new Error("No fue posible obtener los productos.");
  }

  const productos = await respuesta.json();

  return productos.map((producto: any) => ({
    ...producto,

    recipe: producto.recipe.map((r: any) => ({
      ingredientId: r.ingredienteId,
      quantity: r.cantidad,
    })),

    extras: (producto.extras ?? []).map((extra: any) => ({
      id: extra.id,
      ingredientId: extra.ingredienteId,
      name: extra.name,
      quantity: extra.cantidad,
      price: extra.price,
    })),
  }));
}

export async function crearProducto(producto: any) {
  const respuesta = await fetch(`${URL_API}/productos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(producto),
  });

  if (!respuesta.ok) {
    throw new Error("No fue posible crear el producto.");
  }

  return await respuesta.json();
}

export async function actualizarProducto(id: string, producto: any) {
  const respuesta = await fetch(`${URL_API}/productos/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(producto),
  });

  if (!respuesta.ok) {
    throw new Error("No fue posible actualizar el producto.");
  }

  return await respuesta.json();
}

export async function eliminarProducto(id: string) {
  const respuesta = await fetch(`${URL_API}/productos/${id}`, {
    method: "DELETE",
  });

  if (!respuesta.ok) {
    throw new Error("No fue posible eliminar el producto.");
  }
}
