import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: process.env.DB_PASSWORD,
  database: 'sample_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Query tracking
const queryLogs = new Map();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function example() {
  console.error("Start");
  await sleep(5000); // Pause for 5 seconds
  console.log("End");
}

// Wrapper function to track query execution time
async function executeQuery(query, params = []) {
  const startTime = process.hrtime();
  await example();

  try {
    const [result] = await pool.query(query, params);
    const endTime = process.hrtime(startTime);
    const duration = (endTime[0] * 1000 + endTime[1] / 1_000_000); // in ms
    console.error("duration:", duration);

    const queryKey = query.trim();
    if (!queryLogs.has(queryKey)) {
      queryLogs.set(queryKey, {
        query: queryKey,
        calls: 0,
        total_time: 0,
        avg_time: 0
      });
    }

    const log = queryLogs.get(queryKey);
    log.calls += 1;
    log.total_time += duration;
    log.avg_time = log.total_time / log.calls;

    return { rows: result };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Database operations
const db = {
  // Products
  async getProducts() {
    const result = await executeQuery('SELECT * FROM products ORDER BY id');
    return result.rows;
  },

  async updateProductStock(productId, quantity) {
    const result = await executeQuery(
      'UPDATE products SET stock = stock - ? WHERE id = ?',
      [quantity, productId]
    );
    return result.rows[0];
  },

  // Orders
  async createOrder(productId, quantity) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [productRows] = await connection.query(
        'SELECT * FROM products WHERE id = ? FOR UPDATE',
        [productId]
      );
      const product = productRows[0];

      if (!product) throw new Error('Product not found');
      if (product.stock < quantity) throw new Error('Insufficient stock');

      const [orderResult] = await connection.query(
        'INSERT INTO orders (product_id, quantity, total_price) VALUES (?, ?, ?)',
        [productId, quantity, product.price * quantity]
      );

      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [quantity, productId]
      );

      await connection.commit();

      const [newOrder] = await connection.query(
        'SELECT * FROM orders WHERE id = ?',
        [orderResult.insertId]
      );

      return newOrder[0];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async getOrders() {
    const result = await executeQuery(`
      SELECT o.*, p.name as product_name 
      FROM orders o 
      JOIN products p ON o.product_id = p.id 
      ORDER BY o.created_at DESC
    `);
    return result.rows;
  },

  getQueryLogs() {
    return Array.from(queryLogs.values());
  }
};

export default db;