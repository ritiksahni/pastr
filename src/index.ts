import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import Tell from 'tell-js'; 

import { pastr_files } from './db/schema';

export type Env = {
  DATABASE: D1Database;
  RATE_LIMITER: RateLimit;
  TELEGRAM_CHAT_ID: string;
  TELEGRAM_BOT_TOKEN: string;
}

const app = new Hono<{ Bindings: Env }>()

const paste_schema: z.ZodString = z.string({
  invalid_type_error: 'Invalid type. Expected a string.',
  description: 'The content of the paste.',
});

app.get('/', (c) => {
  return c.text('Ping check!')
})

app.post('/create', async (c) => {
  try {
    
    const db = drizzle(c.env.DATABASE);
    const text = await c.req.text();

    console.log(typeof text, "Text: ", text);

    // Validate the text content.
    const validate = paste_schema.safeParse(text);
    if (!validate.success) {
      return c.json({ error: validate.error.errors[0].message }, 400);
    }


    // Check for non-printable characters
    const isPlainText = /^[\x00-\x7F\s]*$/.test(text);
    if (!isPlainText) {
      return c.json({ error: 'Invalid content. Only plain text is allowed.' }, 400);
    }

    // Takes the first 20 characters of text as key and checks if the request is rate limited.
    const { success } = await c.env.RATE_LIMITER.limit({ key: text.substring(0, 20).toString() })
    if(!success) {
      return c.json({ error: 'Rate limit exceeded.' }, 429);
    }
    // Rate limit check ends here.

    if(!text || text.length === 0) {
      return c.json({ error: 'No file provided.' }, 400);
    }

    const key = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    
    // Upload to DB.
    const result = await db.insert(pastr_files).values({
      id: key,
      file_content: text
    })

    if (result.error) {
      return c.json<{ error: string; details: string }>({ error: 'Error occurred in creating a paste.', details: result.error }, 500);
    }

    return c.json<{ status: string; key: string }>({ status: 'success', key });

  } catch (error) {
    const logger = new Tell({
      chatId: c.env.TELEGRAM_CHAT_ID,
      botToken: c.env.TELEGRAM_BOT_TOKEN
    });
    
    console.error('Error in /create', error);
    logger.error(`Error in /create\n ${error}`);
  }
})

app.get('/get/:key', async (c) => {
  try {
    const db = drizzle(c.env.DATABASE);
    const { key } = c.req.param() as { key: string };

    // Takes the UUID in the parameter and checks if the request is rate limited.
    const { success } = await c.env.RATE_LIMITER.limit({ key: key })
    if(!success) {
      return c.json({ error: 'Rate limit exceeded.' }, 429);
    }
    // Rate limit check ends here.

    const res = await db.select().from(pastr_files).where(eq(pastr_files.id, key));
  
    return c.text(res[0].file_content as string);
  } catch (error) {
    const { key } = c.req.param() as { key: string };

    // Instantiate a logger.
    const logger = new Tell({
      chatId: c.env.TELEGRAM_CHAT_ID,
      botToken: c.env.TELEGRAM_BOT_TOKEN
    });
    
    console.error('Error in /get/:key', error);
    logger.error(`Error in /get/${key}\n ${error}`);
  }
})

export default app

/**
Drizzle ORM example

const db = drizzle(c.env.DATABASE);
const res = db.select().from(pastr_files).all();
console.log(res);
 */