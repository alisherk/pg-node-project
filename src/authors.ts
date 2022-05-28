import { PoolClient } from 'pg';
import { createTable } from './create-table';
import format from 'pg-format';

export async function sync(client: PoolClient) {
  const tableName = 'authors';

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
      { name: 'bio', type: 'text', required: true },
    ],
  });

  const authors: string[][] = [
    ['Alex', '25 year old author'],
    ['Misha', '27 year old author'],
  ];

  const insertAuthors = format(
    'INSERT INTO authors (name, bio) VALUES %L returning id',
    authors
  );

  const { rows } = await client.query(insertAuthors);

  return rows;
}
