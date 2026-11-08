import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { db } from "../lib/db";
import { TQCart } from "../components/cart";

type Product = {
  id: number;
  name: string;
  description: string;
  category: string;
  active: number;
  created_at: string;
  min_price?: number;
  total_stock?: number;
  cover?: string;
};

type Variant = {
  id: number;
  product_id: number;
  size: string;
  color: string;
  price: number;
  stock: number;
};

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const productId = parseInt(params.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [generalPhotos, setGeneralPhotos] = useState<string[]>([]);
  const [variantPhotosMap, setVariantPhotosMap] = useState<Map<number, string[]>>(
    new Map()
  );
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null
  );
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Datos para el JavaScript inicial
  const [whatsappNumber, setWhatsAppNumber] = useState<string>("573245880713");
  const [productName, setProductName] = useState<string>("");
  const [fallbackPhotos, setFallbackPhotos] = useState<string[]>([]);
  const [currentPhotos, setCurrentPhotos] = useState<string[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const prod = await getProductByIdDB(productId);
      if (!prod) {
        setError("Producto no encontrado");
        setIsLoading(false);
        return;
      }
      setProduct(prod);
      setProductName(prod.name);

      const vars = await getVariantsDB(productId);
      setVariants(vars);

      if (vars.length > 0) {
        setSelectedVariantId(vars[0].id);
      }

      // Cargar fotos generales
      const photos = await getProductPhotosDB(productId);
      setGeneralPhotos(photos.map((p: any) => p.file_name));

      // Cargar fotos por variante
      const photoMap = new Map<number, string[]>();
      for (const v of vars) {
        const vPhotos = await getVariantPhotosDB(v.id);
        photoMap.set(v.id, vPhotos.map((p: any) => p.file_name));
      }
      setVariantPhotosMap(photoMap);

      // Establecer fotos iniciales: usar fotos de la primera variante si existen,
      // otherwise usar fotos generales
      if (vars.length > 0 && photoMap.get(vars[0].id)?.length > 0) {
        setCurrentPhotos(photoMap.get(vars[0].id)!);
        setSelectedPhotoIndex(0);
      } else if (generalPhotos.length > 0) {
        setCurrentPhotos(generalPhotos);
        setSelectedPhotoIndex(0);
      } else {
        setCurrentPhotos(["no-image.png"]);
        setSelectedPhotoIndex(0);
      }

      // Configurar número de WhatsApp
      setWhatsAppNumber("573245880713");
    } catch (e) {
      console.error("Error fetching product:", e);
      setError("Error al cargar el producto");
    } finally {
      setIsLoading(false);
    }
  };

  const getProductByIdDB = async (id: number) => {
    const rows = await query(
      `SELECT p.*,
        (SELECT MIN(price) FROM product_variants v WHERE v.product_id=p.id) as min_price,
        (SELECT SUM(stock) FROM product_variants v WHERE v.product_id=p.id) as total_stock,
        COALESCE(
          (SELECT file_name FROM product_photos ph WHERE ph.product_id=p.id ORDER BY sort_order,id LIMIT 1),
          (SELECT file_name FROM variant_photos vp WHERE vp.product_id=p.id ORDER BY id LIMIT 1)
        ) as cover
        FROM products p WHERE p.id = ? AND p.active = 1`,
      [id]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description || "Sin descripción disponible.",
      category: row.category || "Colección Exclusiva",
      active: row.active === 1,
      created_at: row.created_at || "",
      min_price: row.min_price != null ? Number(row.min_price) : undefined,
      total_stock: row.total_stock != null ? Number(row.total_stock) : undefined,
      cover: row.cover || undefined,
    };
  };

  const getVariantsDB = async (id: number) => {
    const rows = await query(
      "SELECT * FROM product_variants WHERE product_id = ? ORDER BY color, size",
      [id]
    );
    return rows.map((row: any) => ({
      id: row.id,
      product_id: row.product_id,
      size: row.size,
      color: row.color,
      price: row.price,
      stock: row.stock,
    }));
  };

  const getProductPhotosDB = async (id: number) => {
    const rows = await query(
      "SELECT * FROM product_photos WHERE product_id = ? ORDER BY id",
      [id]
    );
    return rows.map((row: any) => ({
      id: row.id,
      product_id: row.product_id,
      file_name: row.file_name,
      alt_text: row.alt_text,
    }));
  };

  const getVariantPhotosDB = async (id: number) => {
    const rows = await query(
      "SELECT * FROM variant_photos WHERE variant_id = ? ORDER BY id",
      [id]
    );
    return rows.map((row: any) => ({
      id: row.id,
      variant_id: row.variant_id,
      product_id: row.product_id,
      file_name: row.file_name,
      alt_text: row.alt_text,
    }));
  };

  // Efecto para actualizar fotos cuando cambia la variante seleccionada
  useEffect(() => {
    if (selectedVariantId) {
      const photos = variantPhotosMap.get(selectedVariantId) || [];
      if (photos.length > 0) {
        setCurrentPhotos(photos);
        setSelectedPhotoIndex(0);
      }
    }
  }, [selectedVariantId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span>Cargando producto...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-red-500">{error}</p>
        <a href="/" className="mt-4 text-blue-600 underline">Volver al catálogo</a>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-red-500">Producto no encontrado</p>
        <a href="/" className="mt-4 text-blue-600 underline">Volver al catálogo</a>
      </div>
    );
  }

  const formatPrice = (price: number): string => {
    return "$" + price.toLocaleString("es-CO") + " COP";
  };

  const getPrice = (): number => {
    if (selectedVariantId) {
      const v = variants.find((v) => v.id === selectedVariantId);
      return v ? v.price : (product.min_price || 0);
    }
    return product.min_price || 0;
  };

  const getStockStatus = (): { text: string; class: string } => {
    const stock =
      selectedVariantId !== null
        ? variants.find((v) => v.id === selectedVariantId)?.stock
        : product.total_stock;
    if (stock > 0) {
      return { text: `Disponible (${stock} en stock)`, class: "available" };
    }
    return { text: "Agotado", class: "soldout" };
  };

  // Manejo de cambio de variante
  const handleVariantChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const option = e.target.options[e.target.selectedIndex];
      const variantId = Number(option.value);
      const price = Number(option.dataset.price || 0);
      const stock = Number(option.dataset.stock || 0);
      const size = option.dataset.size || "";
      const color = option.dataset.color || "";
      const photos = JSON.parse(option.dataset.photos || "[]");

      setSelectedVariantId(variantId);
      setQuantity(1);

      // Actualizar fotos
      const variantPhotos = variantPhotosMap.get(variantId) || [];
      setCurrentPhotos(variantPhotos.length > 0 ? variantPhotos : generalPhotos);
      setSelectedPhotoIndex(0);

      // Actualizar DOM para precio y stock
      const priceBadge = document.getElementById("product-price");
      if (priceBadge) {
        priceBadge.textContent = "$" + price.toLocaleString("es-CO") + " COP";
      }
      const stockBadge = document.getElementById("stock-message");
      if (stockBadge) {
        if (stock > 0) {
          stockBadge.textContent = "Disponible (" + stock + " en stock)";
          stockBadge.className = "stock-badge available";
        } else {
          stockBadge.textContent = "Agotado";
          stockBadge.className = "stock-badge soldout";
        }
      }
      const qtyInput = document.getElementById("quantity");
      if (qtyInput) {
        qtyInput.max = stock;
        qtyInput.value = stock > 0 ? Math.min(Number(qtyInput.value || 1), stock) : 1;
      }

      // Sincronizar WhatsApp
      syncWhatsapp();

      // Re-renderizar thumbnails
      renderPhotos(photos);
    },
    [variantPhotosMap, generalPhotos]
  );

  const syncWhatsapp = useCallback(() => {
    const select = document.getElementById("variant-select");
    if (!select) return;
    const option = select.options[select.selectedIndex];
    if (!option) return;

    const price = Number(option.dataset.price || 0);
    const stock = Number(option.dataset.stock || 0);
    const size = option.dataset.size || "";
    const color = option.dataset.color || "";
    const quantityInput = document.getElementById("quantity");
    const quantity = quantityInput ? Number(quantityInput.value) : 1;

    let photoUrl =
      currentPhotos[selectedPhotoIndex] || currentPhotos[0] || "";
    if (photoUrl && !photoUrl.match(/^https?:\/\//i)) {
      photoUrl = window.location.origin + photoUrl;
    }

    const message =
      "Hola, quiero pedir " +
      productName +
      ".\n\n" +
      "• Talla: " +
      size +
      "\n" +
      "• Color: " +
      color +
      "\n" +
      "• Cantidad: " +
      quantity +
      "\n" +
      "• Precio: $" +
      price.toLocaleString("es-CO") +
      " COP\n\n" +
      (photoUrl ? "Ver foto:\n" + photoUrl : "");

    const whatsappLink = document.getElementById("whatsapp-order");
    if (whatsappLink) {
      whatsappLink.href =
        "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(message);
      whatsappLink.style.opacity = stock > 0 ? "1" : ".5";
      whatsappLink.style.pointerEvents = stock > 0 ? "auto" : "none";
    }
  }, [productName, currentPhotos, selectedPhotoIndex, whatsappNumber]);

  const renderPhotos = useCallback(
    (photos: string[]) => {
      const mainPhoto = document.getElementById("main-photo");
      const thumbs = document.getElementById("photo-thumbnails");
      if (!mainPhoto || !thumbs) return;

      currentPhotos = photos && photos.length ? photos : fallbackPhotos;
      selectedPhotoIndex = 0;
      thumbs.innerHTML = "";

      if (!currentPhotos.length) return;
      mainPhoto.src = currentPhotos[0];

      currentPhotos.forEach((url, index) => {
        const button = document.createElement("button");
        button.type = "button";
        if (index === 0) button.classList.add("selected");
        button.addEventListener("click", () => selectPhoto(index));
        const image = document.createElement("img");
        image.src = url;
        button.appendChild(image);
        thumbs.appendChild(button);
      });
    },
    []
  );

  const selectPhoto = useCallback((index: number) => {
    if (!currentPhotos.length) return;
    selectedPhotoIndex = Math.max(
      0,
      Math.min(index, currentPhotos.length - 1)
    );
    const mainImg = document.getElementById("main-photo");
    if (mainImg) mainImg.src = currentPhotos[selectedPhotoIndex];
    document
      .querySelectorAll("#photo-thumbnails button")
      .forEach((button, i) => {
        button.classList.toggle("selected", i === selectedPhotoIndex);
      });
    syncWhatsapp();
  }, [currentPhotos, selectedPhotoIndex, syncWhatsapp]);

  const addToCart = useCallback(() => {
    const select = document.getElementById("variant-select");
    if (!select) return;
    const option = select.options[select.selectedIndex];
    if (!option) return;

    const stock = Number(option.dataset.stock || 0);
    if (stock < 1) {
      alert("Esta prenda se encuentra agotada.");
      return;
    }

    const variantId = Number(select.value);
    const price = Number(option.dataset.price);

    const item = {
      productId: product!.id,
      variantId: variantId,
      name: product!.name,
      size: option.dataset.size,
      color: option.dataset.color,
      price: price,
      maxStock: stock,
      quantity: Number(document.getElementById("quantity")?.value || 1),
      photo: currentPhotos[0] || "",
    };

    TQCart.add(item);
  }, [product]);

  return (
    <div className="min-h-screen">
      <nav className="topbar">
        <a href="/" className="logo">TOP <span>QUALITY</span></a>
        <div className="nav-right-actions">
          <a href="/" className="btn-back-nav">
            ← Volver al Catálogo
          </a>
          <button className="btn-cart-trigger" onclick="TQCart.openDrawer()">
            🛒 Carrito <span class="cart-badge-count">0</span>
          </button>
        </div>
      </nav>

      <div className="page-container">
        <nav className="breadcrumbs">
          <a href="/">Inicio</a>
          <span>/</span>
          <a href="/">Colección</a>
          <span>/</span>
          <span>{product?.name}</span>
        </nav>

        <main className="product-detail">
          <section className="product-gallery">
            <div className="main-img-wrapper">
              <img
                id="main-photo"
                src={currentPhotos[0] || "/assets/no-image.png"}
                alt={product?.name}
                onError={(e) => {
                  e.target.src = "/assets/no-image.png";
                }}
              />
            </div>

            <div className="product-thumbs" id="photo-thumbnails">
              {currentPhotos.map((url, index) => (
                <button
                  key={index}
                  type="button"
                  className={index === selectedPhotoIndex ? "selected" : ""}
                  onClick={() => selectPhoto(index)}
                >
                  <img
                    src={url}
                    alt={`Foto ${index + 1}`}
                    onError={(e) => {
                      e.target.src = "/assets/no-image.png";
                    }}
                  />
                </button>
              ))}
            </div>
          </section>

          <section className="product-info">
            <span className="category-tag">{product?.category}</span>
            <h1>{product?.name}</h1>
            <div className="product-description">{product?.description}</div>

            {variants.length > 0 && (
              <div className="field-group">
                <label className="field-label" for="variant-select">
                  Talla y Color Disponibles
                </label>
                <select
                  id="variant-select"
                  onChange={handleVariantChange}
                  value={selectedVariantId !== null ? selectedVariantId.toString() : ""}
                >
                  {variants.map((v, index) => (
                    <option
                      key={index}
                      value={v.id.toString()}
                      data-price={v.price}
                      data-stock={v.stock}
                      data-size={v.size}
                      data-color={v.color}
                      data-photos={JSON.stringify(
                        variantPhotosMap.get(v.id) || []
                      )}
                      selected={index === 0}
                    >
                      Talla {v.size} — Color {v.color}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label className="field-label" for="quantity">Cantidad a llevar</label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>

              <div className="price-badge-row">
                <h2 className="product-price">
                  {formatPrice(getPrice())}
                </h2>
                <span
                  id="stock-message"
                  className={`stock-badge ${getStockStatus().class}`}
                >
                  {getStockStatus().text}
                </span>
              </div>

              <div className="buy-actions">
                <button
                  type="button"
                  className="btn-add-cart"
                  onClick={addToCart}
                >
                  🛒 Agregar al Carrito
                </button>

                <a
                  id="whatsapp-order"
                  className="whatsapp-order"
                  href="#"
                  target="_blank"
                  rel="noopener"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19.005 4.995A9.943 9.943 0 0 0 12 2c-5.514 0-10 4.486-10 10 0 1.961.56 3.868 1.621 5.517L2 22l4.636-1.554A9.929 9.929 0 0 0 12 22c5.514 0 10-4.486 10-10 0-2.673-1.04-5.186-2.995-7.005zM12 20c-1.61 0-3.17-.432-4.542-1.25l-.326-.195-2.76.924.939-2.697-.215-.34A7.95 7.95 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8zm4.354-5.918c-.238-.119-1.408-.694-1.626-.773-.218-.079-.377-.119-.536.119-.159.238-.615.773-.754.932-.139.159-.278.179-.516.06-.238-.119-1.008-.372-1.92-1.185-.71-.633-1.19-1.415-1.329-1.653-.139-.238-.015-.367.104-.486.107-.107.238-.278.357-.417.119-.139.159-.238.238-.397.079-.159.04-.298-.02-.417-.06-.119-.536-1.291-.735-1.768-.194-.464-.392-.401-.536-.408-.139-.007-.298-.007-.457-.007s-.417.06-.635.298c-.218.238-.834.814-.834 1.986 0 1.172.854 2.304.973 2.463.119.159 1.68 2.566 4.07 3.597.568.246 1.012.393 1.358.503.57.181 1.089.156 1.499.095.457-.068 1.408-.576 1.606-1.132.198-.556.198-1.033.139-1.132-.059-.099-.218-.178-.456-.297z"/>
                  </svg>
                  Pedir esta sola prenda por WhatsApp
                </a>
              </div>
            )}
          </section>
        </main>
      </div>

      <!-- Carrito Lateral Overlay -->
      <div
        id="cart-overlay"
        className="cart-overlay"
        onClick="TQCart.closeDrawer()"
      ></div>
      <div
        id="cart-drawer"
        className="cart-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cart-drawer-header">
          <h3>MI <b>CARRITO</b></h3>
          <button className="btn-close-drawer" onclick="TQCart.closeDrawer()">✕</button>
        </div>
        <div id="cart-drawer-items" className="cart-drawer-items"></div>
        <div className="cart-drawer-footer">
          <div className="cart-total-row">
            <span>Total:</span>
            <span id="cart-drawer-total">$0 COP</span>
          </div>
          <a
            href="/checkout"
            className="btn-checkout-go"
          >
            Finalizar Compra
          </a>
        </div>
      </div>

      <footer>
        <b>TOP QUALITY</b>
        <p>
          Moda, estilo y actitud · Popayán, Colombia
        </p>
        <a
          href="https://wa.me/573245880713"
          target="_blank"
        >
          Escríbenos por WhatsApp
        </a>
      </footer>

      <script>
        // Inicializar variables desde React state
        const whatsappNumber = "<?= whatsappNumber ?>";
        const productName = "<?= productName ?>";
        const fallbackPhotos = <?= JSON.stringify(fallbackPhotos, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?>;
        const currentPhotos = <?= JSON.stringify(currentPhotos, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?>;
        let selectedPhotoIndex = <?= selectedPhotoIndex ?>;

        // Funciones auxiliares
        function selectPhoto(index) {
          if (!currentPhotos.length) return;
          selectedPhotoIndex = Math.max(0, Math.min(index, currentPhotos.length - 1));
          const mainImg = document.getElementById("main-photo");
          if (mainImg) mainImg.src = currentPhotos[selectedPhotoIndex];
          document
            .querySelectorAll("#photo-thumbnails button")
            .forEach((button, i) => {
              button.classList.toggle("selected", i === selectedPhotoIndex);
            });
        }

        function renderPhotos(photos) {
          currentPhotos = photos && photos.length ? photos : fallbackPhotos;
          selectedPhotoIndex = 0;
          const mainPhoto = document.getElementById("main-photo");
          const thumbs = document.getElementById("photo-thumbnails");
          thumbs.innerHTML = "";
          if (!currentPhotos.length) return;
          if (mainPhoto) mainPhoto.src = currentPhotos[0];
          currentPhotos.forEach((url, index) => {
            const button = document.createElement("button");
            button.type = "button";
            if (index === 0) button.classList.add("selected");
            button.addEventListener("click", () => selectPhoto(index));
            const image = document.createElement("img");
            image.src = url;
            button.appendChild(image);
            thumbs.appendChild(button);
          });
        }

        function syncWhatsapp() {
          const select = document.getElementById("variant-select");
          if (!select) return;
          const option = select.options[select.selectedIndex];
          if (!option) return;
          const price = Number(option.dataset.price || 0);
          const stock = Number(option.dataset.stock || 0);
          const size = option.dataset.size || "";
          const color = option.dataset.color || "";
          const quantity = document.getElementById("quantity");

          let photoUrl = currentPhotos[selectedPhotoIndex] || currentPhotos[0] || "";
          if (photoUrl && !photoUrl.match(/^https?:\/\//i)) photoUrl = window.location.origin + photoUrl;

          const message =
            "Hola, quiero pedir " +
            productName +
            ".\n\n" +
            "• Talla: " +
            size +
            "\n" +
            "• Color: " +
            color +
            "\n" +
            "• Cantidad: " +
            (quantity ? quantity.value : 1) +
            "\n" +
            "• Precio: $" +
            price.toLocaleString("es-CO") +
            " COP\n\n" +
            (photoUrl ? "Ver foto:\n" + photoUrl : "");

          const whatsappLink = document.getElementById("whatsapp-order");
          if (whatsappLink) {
            whatsappLink.href =
              "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(message);
            whatsappLink.style.opacity = stock > 0 ? "1" : ".5";
            whatsappLink.style.pointerEvents = stock > 0 ? "auto" : "none";
          }
        }

        function updateVariant() {
          const select = document.getElementById("variant-select");
          if (!select) return;
          const option = select.options[select.selectedIndex];
          if (!option) return;

          const price = Number(option.dataset.price || 0);
          const stock = Number(option.dataset.stock || 0);
          const photos = JSON.parse(option.dataset.photos || "[]");

          document.getElementById("product-price").textContent =
            "$" + price.toLocaleString("es-CO") + " COP";
          const stockBadge = document.getElementById("stock-message");
          if (stock > 0) {
            stockBadge.textContent = "Disponible (" + stock + " en stock)";
            stockBadge.className = "stock-badge available";
          } else {
            stockBadge.textContent = "Agotado";
            stockBadge.className = "stock-badge soldout";
          }
          const quantity = document.getElementById("quantity");
          if (quantity) {
            quantity.max = stock;
            quantity.value = stock > 0 ? Math.min(Number(quantity.value || 1), stock) : 1;
          }
          renderPhotos(photos);
          syncWhatsapp();
        }

        function addToCart() {
          const select = document.getElementById("variant-select");
          if (!select) return;
          const option = select.options[select.selectedIndex];
          if (!option) return;

          const stock = Number(option.dataset.stock || 0);
          if (stock < 1) {
            alert("Esta prenda se encuentra agotada.");
            return;
          }

          const item = {
            productId: productId,
            variantId: Number(select.value),
            name: productName,
            size: option.dataset.size,
            color: option.dataset.color,
            price: Number(option.dataset.price),
            maxStock: stock,
            quantity: Number(document.getElementById("quantity").value || 1),
            photo: currentPhotos[0] || "",
          };

          TQCart.add(item);
        }

        // Event listeners
        document.getElementById("quantity")?.addEventListener("input", syncWhatsapp);
        updateVariant();
      </script>
    </div>
  );
}