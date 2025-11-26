# PromptFolio

PromptFolio is a professional, single-user prompt management system designed for prompt engineers and developers. It helps you organize, version, and optimize your AI prompts using a clean, modern interface powered by Google Gemini and deployed on the edge.

## ✨ Key Features

*   **Prompt Management**: Create, read, update, and delete prompts with ease.
*   **Versioning System**: Maintain history of your prompts (v1, v2, etc.) and switch between versions.
*   **Topic Collections**: Group prompts into magazine-style topic collections (e.g., Photography, Coding).
*   **AI-Powered Tools**: Integrated with Google Gemini API to refine prompts, generate descriptions, and suggest tags.
*   **Attribution & Licensing**: Define copyright (CC0, MIT, etc.) and author info for your prompts.
*   **SEO & Sitemap**: Auto-generated Sitemaps and Schema.org structured data for better discoverability.
*   **Cloud Database**: Uses **Cloudflare D1** (SQLite at the edge) for persistent storage.
*   **Visual cues**: Watermarks for Drafts and Versions.
*   **Dark Mode**: Fully supported dark/light theme toggling.
*   **Security**: Simple password protection for administrative actions.

## 🛠️ Tech Stack

*   **Frontend**: React 18, TypeScript, Tailwind CSS
*   **Backend**: Cloudflare Pages Functions (Workers)
*   **Database**: Cloudflare D1 (SQLite)
*   **AI Integration**: Google GenAI SDK

## 🚀 Deployment Guide (Cloudflare Pages + D1)

This project is designed to be deployed on Cloudflare Pages.

### 1. Prerequisites
*   Node.js installed.
*   A [Cloudflare](https://dash.cloudflare.com/) account.
*   Wrangler CLI installed: `npm install -g wrangler`

### 2. Local Development

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Login to Cloudflare:**
    ```bash
    npx wrangler login
    ```

3.  **Create D1 Database:**
    ```bash
    npx wrangler d1 create promptfolio-db
    ```
    *Copy the `database_id` output from this command.*

4.  **Configure `wrangler.toml`:**
    Create a `wrangler.toml` file in the root directory:
    ```toml
    name = "promptfolio"
    pages_build_output_dir = "build"

    [[d1_databases]]
    binding = "DB"
    database_name = "promptfolio-db"
    database_id = "YOUR_DATABASE_ID_HERE"
    ```

5.  **Initialize Database Schema:**
    Create a `schema.sql` file (see content below) and run:
    ```bash
    npx wrangler d1 execute promptfolio-db --local --file=./schema.sql
    ```

6.  **Run locally:**
    ```bash
    npm run build
    npx wrangler pages dev build --d1 DB=promptfolio-db
    ```
    *Note: The standard `npm start` will only run the React frontend and won't connect to the local D1 database correctly without proxy configuration. Use `wrangler pages dev` for full stack emulation.*

### 3. Production Deployment

1.  **Build the project:**
    ```bash
    npm run build
    ```

2.  **Apply Schema to Production:**
    ```bash
    npx wrangler d1 execute promptfolio-db --remote --file=./schema.sql
    ```

3.  **Deploy:**
    ```bash
    npx wrangler pages deploy build
    ```

4.  **Set Environment Variables:**
    Go to your Cloudflare Pages dashboard > Settings > Environment Variables and add:
    *   `API_KEY`: Your Google Gemini API Key.
    *   `SITE_PASSWORD`: (Optional) Password for admin access.
    *   `SITE_URL`: (Optional) The public URL of your site (e.g., `https://your-domain.com`) for correct Sitemap and JSON-LD generation.

## 🗄️ Database Schema (`schema.sql`)

If you need to manually create the table, here is the SQL content for `schema.sql`. 
*Note: D1 is based on SQLite. Complex objects like `tags` and `versions` are stored as JSON strings.*

```sql
DROP TABLE IF EXISTS prompts;

CREATE TABLE prompts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  imageUrl TEXT,
  category TEXT,
  tags TEXT,            -- Stored as JSON string
  status TEXT,
  versions TEXT,        -- Stored as JSON string
  currentVersionId TEXT,
  updatedAt INTEGER,
  isFavorite INTEGER DEFAULT 0,
  copyright TEXT,
  author TEXT,
  topic TEXT
);
```

### 🔄 Migration / Updates
If you are updating from an older version, you need to add the `topic` column to your existing database:

```bash
npx wrangler d1 execute promptfolio-db --command "ALTER TABLE prompts ADD COLUMN topic TEXT"
```

## 📂 Project Structure

*   `App.tsx`: Main application controller.
*   `functions/api/`: Backend API endpoints (Serverless functions).
*   `functions/sitemap-*.xml.ts`: Dynamic sitemap generators.
*   `schema.sql`: Database definition.
*   `services/`: Gemini AI integration.

## 🛡️ Authentication

*   **Admin Access**: Controlled by `SITE_PASSWORD`.
*   **Database Access**: Secured by Cloudflare Functions context.

## 📝 License

Private / Proprietary