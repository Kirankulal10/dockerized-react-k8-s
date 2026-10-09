import pg from 'pg';
import express from 'express';

const { Pool } = pg;

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

// Create table
const createTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        age INT NOT NULL
      );
    `);

    console.log('Users table is ready');
  } catch (error) {
    console.error('Error creating users table:', error);
  }
};

createTable();


// ------------------------------------
// Health Check
// ------------------------------------

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok'
  });
});


// ------------------------------------
// Basic API
// ------------------------------------

app.get('/api', (req, res) => {
  res.send('Hello World!');
});


// ------------------------------------
// Get All Users
// ------------------------------------

app.get('/api/all', async (req, res) => {
  try {
    const response = await pool.query(
      'SELECT * FROM users ORDER BY id'
    );

    res.status(200).json(response.rows);

  } catch (error) {
    console.error('Error fetching users:', error);

    res.status(500).json({
      error: 'Failed to fetch users'
    });
  }
});


// ------------------------------------
// Add User
// ------------------------------------

app.post('/api/form', async (req, res) => {
  try {
    const { name, email, age } = req.body;

    const response = await pool.query(
      `
      INSERT INTO users (name, email, age)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [name, email, age]
    );

    res.status(201).json(response.rows[0]);

  } catch (error) {
    console.error('Error inserting user:', error);

    res.status(500).json({
      error: 'Failed to create user'
    });
  }
});


// ------------------------------------
// Start Server
// ------------------------------------

app.listen(3000, () => {
  console.log('App running on port 3000');
});
