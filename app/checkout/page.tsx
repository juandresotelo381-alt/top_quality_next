import { useState, useEffect } from "react";
import { db } from "../lib/db";
import { TQCart } from "../components/cart";

export default function CheckoutPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initialize cart rendering after mount
    const cart = TQCart.get();
    if (cart && cart.length > 0) {
      const container = document.getElementById("checkout-items");
      const totalEl = document.getElementById("checkout-total");

      if (container && totalEl) {
        container.innerHTML = "";
        cart.forEach((item, i) => {
          const div = document.createElement("div");
          div.className = "cart-item-card";
          div.innerHTML = `
            <div class="cart-item-info">
              <strong>${item.name}</strong>
              <div>
                <span class="badge-attr">Talla: ${item.size}</span>
                <span class="badge-attr">Color: ${item.color}</span>
                <span class="badge-attr">Cant: x${item.quantity}</span>
              </div>
            </div>
            <div class="cart-item-price">$${(item.price * item.quantity).toLocaleString(
              "es-CO"
            )}</div>
          `;
          container.appendChild(div);
        });

        totalEl.textContent =
          "$" + TQCart.total().toLocaleString("es-CO") + " COP";
        document.getElementById("cart_data").value = JSON.stringify(cart);
      }
    }
    setIsLoaded(true);
  }, []);

  return (
    <main>
      <header className="topbar">
        <a href="/" className="logo">TOP <span>QUALITY</span></a>
        <a href="/" className="btn-back-shop">
          ← Seguir Comprando
        </a>
      </header>

      <div className="main-container">
        <div className="card">
          <div className="card-header">
            <h2>Detalles de Envío</h2>
            <span className="step-badge">Paso 1 de 2</span>
          </div>
          <form id="checkout-form" method="POST" action="/api/create-order">
            <input type="hidden" name="cart_data" id="cart_data" />

            <div className="form-grid">
              <div className="form-group full">
                <label htmlFor="name">Nombre y Apellidos</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  placeholder="Ej: Juan Sotelo"
                  className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="form-group">
                <label htmlFor="doc">Cédula / Documento</label>
                <input
                  type="text"
                  name="doc"
                  id="doc"
                  required
                  placeholder="Número de C.C."
                  className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  required
                  placeholder="Ej: 3001234567"
                  className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="form-group full">
                <label htmlFor="email">Correo Electrónico</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  placeholder="Para enviar el comprobante"
                  className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="form-group full">
                <label htmlFor="address">Dirección de Entrega y Barrio</label>
                <input
                  type="text"
                  name="address"
                  id="address"
                  required
                  placeholder="Ej: Calle 5 # 10-20, Barrio Centro"
                  className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="form-group">
                <label htmlFor="city">Ciudad / Municipio</label>
                <input
                  type="text"
                  name="city"
                  id="city"
                  value="Popayán"
                  required
                  className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="form-group">
                <label htmlFor="method">Método de Pago</label>
                <select name="method" id="method" className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="mercadopago">
                    Mercado Pago / Nequi / PSE / Tarjetas
                  </option>
                  <option value="whatsapp">
                    Pedir todo por WhatsApp
                  </option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn-submit-order"
            >
              <span>🔒 CONFIRMAR Y PAGAR</span>
            </button>

            <div className="security-badge">
              <span>🛡️ Transacción 100% Encriptada y Segura</span>
            </div>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Resumen del Pedido</h2>
            <span className="step-badge">Carrito</span>
          </div>

          <div id="checkout-items" className="cart-summary-list"></div>

          <div className="total-box">
            <div className="total-row">
              <span>Total a pagar:</span>
              <span id="checkout-total" className="total-price">
                $0 COP
              </span>
            </div>
          </div>
        </div>
      </div>

      <script>{/* Cart JS will be injected by Turbopack */}</script>
      <script src="/assets/cart.js"></script>
      <script>
        const whatsappNumber = "573245880713";

        function renderCheckout() {
          const container = document.getElementById("checkout-items");
          const totalEl = document.getElementById("checkout-total");
          const cart = TQCart.get();

          if (!cart || cart.length === 0) {
            alert("Tu carrito está vacío.");
            window.location.href = "/";
            return;
          }

          container.innerHTML = "";
          cart.forEach((item, i) => {
            const div = document.createElement("div");
            div.className = "cart-item-card";
            div.innerHTML = `
              <div class="cart-item-info">
                <strong>${item.name}</strong>
                <div>
                  <span class="badge-attr">Talla: ${item.size}</span>
                  <span class="badge-attr">Color: ${item.color}</span>
                  <span class="badge-attr">Cant: x${item.quantity}</span>
                </div>
              </div>
              <div class="cart-item-price">$${(item.price * item.quantity).toLocaleString(
                "es-CO"
              )}</div>
            `;
            container.appendChild(div);
          });

          totalEl.textContent = "$" + TQCart.total().toLocaleString("es-CO") + " COP";
          document.getElementById("cart_data").value = JSON.stringify(cart);
        }

        renderCheckout();

        document.getElementById("checkout-form")?.addEventListener("submit", (e) => {
          const method = document.getElementById("method").value;

          if (method === "whatsapp") {
            e.preventDefault();
            const cart = TQCart.get();
            let msg = "*NUEVO PEDIDO - TOP QUALITY*\n\n";
            msg += `*Cliente:* ${document.getElementById("name").value}\n`;
            msg += `*Cédula:* ${document.getElementById("doc").value}\n`;
            msg += `*Teléfono:* ${document.getElementById("phone").value}\n`;
            msg += `*Dirección:* ${document.getElementById("address").value}, ${document.getElementById("city").value}\n\n`;
            msg += `*PRODUCTOS SOLICITADOS:*\n`;
            cart.forEach((item, i) => {
              msg += `${i+1}. ${item.name} (Talla: ${item.size}, Color: ${item.color}) x${item.quantity} - $${(item.price * item.quantity).toLocaleString(
                "es-CO"
              )}\n`;
            });
            msg += `\n*TOTAL A PAGAR:* $${TQCart.total().toLocaleString(
              "es-CO"
            )} COP`;

            window.open(
              "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(msg),
              "_blank"
            );
          }
        });
      </script>
    </main>
  );
}