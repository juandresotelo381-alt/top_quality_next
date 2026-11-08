import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { db } from "../lib/db";

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const result = await db.query(
        `SELECT p.*,
        (SELECT MIN(price) FROM product_variants v WHERE v.product_id=p.id) as min_price,
        (SELECT SUM(stock) FROM product_variants v WHERE v.product_id=p.id) as total_stock,
        COALESCE(
          (SELECT file_name FROM product_photos ph WHERE ph.product_id=p.id ORDER BY sort_order,id LIMIT 1),
          (SELECT file_name FROM variant_photos vp WHERE vp.product_id=p.id ORDER BY id LIMIT 1)
        ) as cover
        FROM products p WHERE p.active=1`
      );
      setProducts(result.rows || []);
      
      // Extract categories from products
      const catSet = new Set<string>();
      (result.rows || []).forEach((p: any) => {
        if (p.category) catSet.add(p.category);
      });
      setCategories(Array.from(catSet).sort());
    } catch (e) {
      console.error("Error fetching products:", e);
      setProducts([]);
      setCategories(["Mujer", "Hombre", "Calzado", "Accesorios", "Unisex"]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span>Cargando productos...</span>
      </div>
    );
  }

  return (
    <main id="catalogo" className="wrap">
      <div className="heading">
        <div>
          <small>DESCUBRE TU ESTILO</small>
          <h2>Nuestra colección</h2>
        </div>
        <form>
          <input
            name="q"
            placeholder="Buscar prendas..."
            value={searchQuery}
            onChange={handleSearch}
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            className="bg-primary text-white rounded-md px-4 py-2 font-semibold hover:bg-primary/90 transition-colors"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="filters">
        <a href="#catalogo" className={selectedCategory === null ? "border-b-2 border-primary" : ""} onClick={() => setSelectedCategory(null)}>
          Todos
        </a>
        {categories.map((cat) => (
          <a
            key={cat}
            href `?categoria=${cat}`
            onClick={() => setSelectedCategory(cat)}
            className={selectedCategory === cat ? "border-b-2 border-primary" : ""}
          >
            {cat}
          </a>
        ))}
      </div>

      <div className="grid">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/producto/${p.id}`}
            className="card hover:translate-y-2 hover:shadow-xl hover:border-primary transition-all duration-200"
          >
            <div className="cover aspect-square rounded-t-lg overflow-hidden">
              {p.cover && (
                <Image
                  src={`/uploads/products/${p.cover}`}
                  alt={p.name}
                  className="object-cover w-full h-full"
                  width={500}
                  height={500}
                />
              )}
              {p.stock < 1 && (
                <div className="sold absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1">
                  AGOTADO
                </div>
              )}
            </div>
            <div className="meta p-4 flex-flex">
              <small className="text-sm text-gray-500 uppercase tracking-wider">{p.category}</small>
              <h3 className="font-bold text-lg uppercase tracking-tight line-clamp-2">{p.name}</h3>
              <div className="mt-2">
                <b className="text-lg font-bold">$ {Number(p.min_price || 0).toLocaleString('es-CO')}</b>
                {p.total_stock > 0 ? (
                  <span className="text-green-600 font-medium">{p.total_stock} en stock</span>
                ) : (
                  <span className="text-red-500">Agotado</span>
                )}
              </div>
            </div>
          </Link>
        ))}
        {products.length === 0 && (
          <p className="empty text-center py-20 text-gray-400">Todavía no hay prendas publicadas. ¡Pronto encontrarás novedades!</p>
        )}
      </div>
    </main>
  );
}