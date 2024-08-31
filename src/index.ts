import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post('/create', async (c) => {
  try {
    const { DATABASE } = c.env as { DATABASE: D1Database }
    const formData = await c.req.formData();
    const body = formData.get('body');
    
    if (!body || typeof body !== 'string') {
      return c.json({ error: 'Invalid or missing body' }, 400);
    }

    const key = crypto.randomUUID();
    const result = await DATABASE.prepare('INSERT INTO pastr_files (id, file_content) VALUES (?, ?)')
      .bind(key, body)
      .run();

    if (result.error) {
      throw new Error(`Database error: ${result.error}`);
    }

    return c.json({ status: 'success', key });
  } catch (error) {
    console.error('Error in /create:', error);
    return c.json({ error: 'Internal Server Error', details: error.message }, 500);
  }
})

app.get('/get/:key', async (c) => {
  try {
    const { key } = c.req.param() as { key: string };
    const { DATABASE } = c.env as { DATABASE: D1Database }
    const result = await DATABASE.prepare('SELECT * FROM pastr_files WHERE id = ?')
      .bind(key)
      .first();

    return c.text(result?.file_content as string);
  } catch (error) {
    console.error('Error in /get/:key', error);
    return c.json({ error: 'Internal Server Error', details: error.message }, 500);
  }
})

export default app
