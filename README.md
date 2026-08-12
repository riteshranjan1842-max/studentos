# StudentOS — Your Student Life, Organized

StudentOS is a premium, feature-rich student dashboard built with React, TypeScript, Tailwind CSS, and Supabase. It offers note generation, assignment workflows, attendance and CGPA calculators, timetable management, portfolio and resume builders, and technical preparation trackers.

---

## Authentication Setup & Safeguards

The application uses **Supabase Authentication** for user accounts, including email/password registration and Google OAuth sign-in.

> [!IMPORTANT]
> **Manual Action Required for Email Signups**
>
> If new users encounter an `"Email signups are disabled"` error on the sign-up page, this indicates that the Email provider is disabled on your remote Supabase project dashboard. This configuration must be set manually on the Supabase Console:
>
> 1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
> 2. Open your project page (e.g. Project ref: `ahdggyxzsbiyrjiflltd`).
> 3. Go to **Authentication** (sidebar) -> **Providers** -> **Email**.
> 4. Ensure the **"Enable Email provider"** toggle is switched **ON** (Enabled).
> 5. Confirm that **"Allow new users to sign up"** is checked.
> 6. Save the settings.

---

## Local Development Setup

### 1. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase project API credentials:
```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Code Validation
Verify type-checking:
```bash
npm run typecheck
```
