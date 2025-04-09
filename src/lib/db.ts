import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB,
});

// Create tables if they don't exist
const initDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        device_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        act_name TEXT NOT NULL,
        status TEXT NOT NULL,
        last_ping DATETIME,
        version TEXT,
        client_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        device_id TEXT NOT NULL,
        hostname TEXT,
        hardware_id TEXT,
        update_blocked BOOLEAN DEFAULT 0,
        FOREIGN KEY (client_id) REFERENCES clients (id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS wifi_configs (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        ssid TEXT NOT NULL,
        password TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 0,
        FOREIGN KEY (device_id) REFERENCES devices (id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS device_status (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        is_online BOOLEAN DEFAULT 0,
        firmware_version TEXT,
        connected_ssid TEXT,
        wifi_strength INTEGER,
        voltage_value REAL,
        voltage_is_normal BOOLEAN,
        temperature_value REAL,
        temperature_is_normal BOOLEAN,
        FOREIGN KEY (device_id) REFERENCES devices (id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS installed_apps (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        name TEXT NOT NULL,
        version TEXT NOT NULL,
        camera_mode TEXT CHECK(camera_mode IN ('normal', 'night', 'auto')),
        capture_interval INTEGER,
        detection_model TEXT CHECK(detection_model IN ('head', 'body')),
        hdmi_display BOOLEAN,
        image_rotation INTEGER CHECK(image_rotation IN (0, 180)),
        FOREIGN KEY (device_id) REFERENCES devices (id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS detection_lines (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        name TEXT NOT NULL,
        start_x INTEGER NOT NULL,
        start_y INTEGER NOT NULL,
        end_x INTEGER NOT NULL,
        end_y INTEGER NOT NULL,
        direction TEXT CHECK(direction IN ('both', 'forward', 'backward')) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (id)
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  } finally {
    client.release();
  }
};

export { pool, initDatabase }; 