import { Pool } from 'pg';
import { parse } from 'pg-connection-string';
import { sync as syncAuthors } from './authors';
import { sync as syncBooks } from './books';

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

    await syncBooks(client);

    await client.query('CREATE TABLE authorsCopy (LIKE authors);');

    await client.query('INSERT INTO authorsCopy SELECT id, name, bio FROM authors;');
  
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');

    console.error(error);
  } finally {
    client.release();
  }
}

syncAll();
