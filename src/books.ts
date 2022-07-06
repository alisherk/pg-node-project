import { PoolClient } from 'pg';
import { createTable } from './create-table';
import format from 'pg-format';

export async function sync(client: PoolClient) {
  const tableName = 'books';

  await client.query(`DROP TABLE IF EXISTS ${tableName}`);

  await createTable(client, {
    tableName: tableName,
    columns: [
      {
        name: 'id',
        required: true,
        id: true,
      },
      {
        name: 'name',
        type: 'text',
        required: true,
      },
      { name: 'author_id', type: 'int', required: true, relation: { tableName: 'authors', column: 'id' } },
    ],
  });


  const authors: string[][] = [
    ['Gone with the wind', '1'],
    ['Looking for trouble', '2'],
  ];

  const insertBooks = format(
    'INSERT INTO books (name, author_id) VALUES %L returning *',
    authors
  );

  const { rows } = await client.query(insertBooks);

  return rows;
}
