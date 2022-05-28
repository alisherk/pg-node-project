import { Pool } from 'pg';
import { parse } from 'pg-connection-string';
import { sync as syncAuthors } from './authors';

const url: string = process.env.POSTGRES_URL as string;
const config = parse(url);

const pool = new Pool({
  user: config.user,
  password: config.password,
  host: config.host!,
  port: Number(config.port),
  database: config.database!,
});

export async function syncAll() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await syncAuthors(client);

    await client.query('COMMIT');

  } catch (error) {
    await client.query('ROLLBACK');

    console.error(error);
  } finally {
    client.release();
  }
}

syncAll();
