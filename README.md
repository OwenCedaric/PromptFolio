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

### 3. Production Deployment (GitHub Actions)

This project uses GitHub Actions for automatic deployment. This is the recommended way to deploy as it handles sensitive configuration using Secrets and Variables.

#### 2. Configure GitHub Secrets & Variables
Go to your GitHub Repository > Settings > Secrets and variables > Actions:

**GitHub Secrets**:
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token.
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID.
- `DB_NAME`: Your D1 database name.
- `DB_ID`: Your D1 database ID.
- `GEMINI_API_KEY`: Your Gemini API key.
- `SITE_PASSWORD`: (Optional) Password for admin access.

**GitHub Variables**:
- `SITE_URL`: Your public site URL (e.g., `https://prompt.example.com`).
- `GEMINI_MODEL`: (Optional) The Gemini model to use (defaults to `gemini-3-flash-preview`).

> [!NOTE]
> All sensitive keys are passed to Cloudflare as environment variables during the GitHub Action build step using `wrangler.toml` templating. This ensures they are not committed to your repository but are available to your Worker backend.

#### 3. Initialize Database Schema
Run this once from your local machine to set up the production database:
```bash
npx wrangler d1 execute promptfolio-db --remote --file=./schema.sql
```

#### 4. Deploy
Simply push your changes to the `main` branch, and the **Deploy to Cloudflare Pages** action will trigger automatically.

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

## 🌐 Static Site Deployment

To generate a static version of the site for maximum SEO and performance:

1.  **Build Static Site:**
    This fetches real data from your remote Cloudflare D1 database and generates HTML files.
    ```bash
    npm run build:static
    ```

2.  **Output:**
    The static files are generated in the `dist-static/` directory.
    
    *Using Wrangler:*
    ```bash
    npx wrangler deploy --assets=./dist-static
    ```

## 📝 License

Private / Proprietary