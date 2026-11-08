import { useState, useEffect } from "react";

export default function ConfirmationPage({
  params,
}: {
  params: { order: string };
}) {
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderNumber = params.order;

  useEffect(() => {
    fetchOrder(orderNumber);
  }, [orderNumber]);

  const fetchOrder = async (orderNumber: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // En un entorno real, esto haría una petición API
      // Por ahora simularemos con datos locales
      const mockOrder = {
        id: 1,
        order_number: orderNumber,
        payment_status: "PAGADO",
        created_at: new Date().toISOString(),
        items: [
          {
            id: 1,
            product_id: 1,
            variant_id: 1,
            quantity: 1,
            price: 89900,
            product_name: "Camiseta Premium",
            size: "M",
            color: "Negro",
          },
        ],
        total: 89900,
      };

      setOrder(mockOrder);
    } catch (e) {
      console.error("Error fetching order:", e);
      setError("Error al cargar la orden");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span>Cargando orden...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-red-500">{error}</p>
        <a href="/" className="mt-4 text-blue-600 underline">Volver a la tienda</a>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-red-500">Orden no encontrada</p>
        <a href="/" className="mt-4 text-blue-600 underline">Volver a la tienda</a>
      </div>
    );
  }

  const paymentStatus = order.payment_status;

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="card-confirm">
        {paymentStatus === "PAGADO" ? (
          <div className="icon">✅</div>
          <h1>Pago Confirmado!</h1>
          <p>
            Tu orden ha sido procesada con éxito y el inventario ha sido actualizado.
            Pronto iniciará la preparación de tu despacho.
          </p>
        ) : (
          <div className="icon">⏳</div>
          <h1>Pedido Registrado</h1>
          <p>
            Estamos procesando el estado de tu pago. Te notificaremos en cuanto el
            pago sea verificado por la pasarela.
          </p>
        )}

        <div className="order-badge">
          N° DE ORDEN: {order.order_number}
        </div>

        <a
          href="/"
          className="btn-home"
          onClick={() => {
            // Limpiar carrito en el cliente
            localStorage.removeItem("tq_cart");
          }}
        >
          Volver a la Tienda
        </a>
      </div>
    </div>
  );
}