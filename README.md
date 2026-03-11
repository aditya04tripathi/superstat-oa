
# Basketball Video Tagger

This is a web application that allows coaches and analysts to upload basketball game videos and tag gameplay events with timestamps and player associations. The result is structured, queryable event data derived from raw video footage.

## Setup Instructions

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Create a `.env.local` file** in the root of the project and add your Supabase project URL and anon key:

    ```
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_optional_but_recommended_for_seeding
    ```

## Supabase Setup

1.  **Create a new Supabase project.**

2.  **Run the following SQL schema** in the Supabase SQL editor to create the necessary tables and policies. You can copy the contents of `reset_schema.sql`.

3.  **Seeding Data:**
    -   Add `SUPABASE_SERVICE_ROLE_KEY` to your `.env.local` to bypass RLS during seeding.
    -   Run `node scripts/seed.cjs`.
    -   **Troubleshooting:** If you cannot use the service role key and get RLS errors, run the SQL in `allow_seed_rls.sql` in the Supabase SQL Editor to temporarily allow public writes, then run the seed script again.

## How to Run

1.  **Start the development server:**

    ```bash
    npm run dev
    ```

2.  Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.
