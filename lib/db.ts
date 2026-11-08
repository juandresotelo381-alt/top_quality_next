import { Pool, Row, RowType } from "pg";

// Configuración de conexión a la base de datos PostgreSQL
// Estas credenciales apuntan a PostgreSQL local
const pool = new Pool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "top_quality",
  connectionTimeoutMillis: 5000,
});

// Ejecutar consulta simple
export async function query(sql: string, params?: any[]): Promise<RowType<{}>[]> {
  const client = await pool.connect();
  try {
    const [rows] = await client.query<RowType<{}>[]>(sql, params || []);
    return rows;
  } finally {
    client.release();
  }
}

// Obtener todos los productos con cálculos integrados
export async function getProducts(
  category?: string,
  search?: string
): Promise<any[]> {
  let sql = `SELECT p.*,
    (SELECT MIN(price) FROM product_variants v WHERE v.product_id=p.id) as min_price,
    (SELECT SUM(stock) FROM product_variants v WHERE v.product_id=p.id) as total_stock,
    COALESCE(
      (SELECT file_name FROM product_photos ph WHERE ph.product_id=p.id ORDER BY sort_order,id LIMIT 1),
      (SELECT file_name FROM variant_photos vp WHERE vp.product_id=p.id ORDER BY id LIMIT 1)
    ) as cover
    FROM products p WHERE p.active=1`;
  const params: any[] = [];

  if (category) {
    sql += " AND p.category=?";
    params.push(category);
  }
  if (search) {
    sql += " AND (p.name LIKE ? OR p.description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += " ORDER BY p.featured DESC, p.created_at DESC";

  const rows = await query(sql, params);
  return rows;
}

// Obtener un producto por ID
export async function getProductById(id: number): Promise<any | null> {
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
    description: row.description || "",
    category: row.category || "Colección Exclusiva",
    active: row.active === 1,
    created_at: row.created_at || "",
    min_price: row.min_price != null ? Number(row.min_price) : undefined,
    total_stock: row.total_stock != null ? Number(row.total_stock) : undefined,
    cover: row.cover || undefined,
  };
}

// Obtener variantes de un producto
export async function getVariants(productId: number) {
  const rows = await query(
    "SELECT * FROM product_variants WHERE product_id = ? ORDER BY color, size",
    [productId]
  );
  return rows.map((row: any) => ({
    id: row.id,
    product_id: row.product_id,
    size: row.size,
    color: row.color,
    price: row.price,
    stock: row.stock,
  }));
}

// Obtener fotos generales de un producto
export async function getProductPhotos(productId: number) {
  const rows = await query(
    "SELECT * FROM product_photos WHERE product_id = ? ORDER BY id",
    [productId]
  );
  return rows.map((row: any) => ({
    id: row.id,
    product_id: row.product_id,
    file_name: row.file_name,
    alt_text: row.alt_text,
  }));
}

// Obtener fotos de una variante
export async function getVariantPhotos(variantId: number) {
  const rows = await query(
    "SELECT * FROM variant_photos WHERE variant_id = ? ORDER BY id",
    [variantId]
  );
  return rows.map((row: any) => ({
    id: row.id,
    variant_id: row.variant_id,
    product_id: row.product_id,
    file_name: row.file_name,
    alt_text: row.alt_text,
  }));
}