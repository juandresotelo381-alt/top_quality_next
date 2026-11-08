import { NextResponse } from "next/server";
import { db } from "../../lib/db";
import { TQCart } from "../../components/cart";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cart_data, name, doc, phone, email, address, city, method } = body;

    const cart = cart_data ? JSON.parse(cart_data) : TQCart.get();

    if (!cart || cart.length === 0) {
      return NextResponse.json(
        { error: "Carrito vacío" },
        { status: 400 }
      );
    }

    // Generar número de orden
    const orderNumber = "ORD-" + Date.now().toString(36).toUpperCase().substring(0, 8);

    // Insertar orden en la base de datos
    const [result]: any = await db.query(
      "INSERT INTO orders (order_number, payment_status, total, customer_name, customer_doc, customer_phone, customer_email, customer_address, city) VALUES (?, 'PENDIENTE', ?, ?, ?, ?, ?, ?, ?)",
      [
        orderNumber,
        cart.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0),
        name,
        doc,
        phone,
        email,
        address,
        city,
      ]
    );

    const orderId = result.insertId;

    // Insertar items de la orden
    for (const item of cart) {
      await db.query(
        "INSERT INTO order_items (order_id, variant_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)",
        [
          orderId,
          item.variantId || 0,
          item.productId || 0,
          item.quantity,
          item.price,
        ]
      );
    }

    // Descontar stock de las variantes
    for (const item of cart) {
      const variantId = item.variantId || 0;
      const quantity = item.quantity;
      await db.query(
        "UPDATE product_variants SET stock = GREATEST(0, stock - ?) WHERE id = ?",
        [quantity, variantId]
      );
    }

    // Limpiar carrito
    localStorage.removeItem("tq_cart");
    TQCart.clear();

    return NextResponse.json({
      success: true,
      orderNumber,
      orderId,
      message: "Orden creada exitosamente",
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}