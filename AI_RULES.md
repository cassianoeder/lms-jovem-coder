# AI Rules for JovemCoder Project

This document outlines the core technologies used in the JovemCoder project and provides guidelines for using specific libraries to maintain consistency and best practices.

## Tech Stack Overview

*   **Frontend Framework:** React
*   **Language:** TypeScript
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS
*   **UI Component Library:** shadcn/ui (built on Radix UI)
*   **Routing:** React Router DOM
*   **Backend & Authentication:** Supabase
*   **Data Fetching & Server State Management:** React Query (`@tanstack/react-query`)
*   **Icons:** Lucide React
*   **Form Management & Validation:** React Hook Form with Zod
*   **Toast Notifications:** Sonner

## Library Usage Rules

To ensure a consistent and maintainable codebase, please adhere to the following rules when developing:

*   **UI Components:**
    *   **Always** prioritize `shadcn/ui` components for building the user interface.
    *   If a specific `shadcn/ui` component is not available or requires significant customization beyond styling, create a new component in `src/components/` that wraps or extends existing `shadcn/ui` primitives.
    *   **Never** directly modify files within `src/components/ui/`.
*   **Routing:**
    *   Use `react-router-dom` for all client-side navigation.
    *   Define all main application routes in `src/App.tsx`.
    *   For navigation links, use the `NavLink` component from `src/components/NavLink.tsx`.
*   **Backend & Authentication:**
    *   All interactions with the Supabase backend (authentication, database queries, etc.) must use the `@supabase/supabase-js` client, which is already configured in `src/integrations/supabase/client.ts`.
    *   For managing user authentication state and actions, use the `useAuth` hook from `src/hooks/useAuth.tsx`.
*   **Icons:**
    *   Use `lucide-react` for all icons throughout the application.
*   **Forms:**
    *   Implement form logic and state management using `react-hook-form`.
    *   For form schema validation, use `zod`.
*   **Notifications:**
    *   For displaying toast notifications to the user, use the `sonner` library.
*   **Styling:**
    *   All component styling should be done using Tailwind CSS utility classes.
    *   Avoid inline styles or creating new `.css` files unless absolutely necessary for global styles (e.g., `src/index.css`).
    *   Use the `cn` utility function from `src/lib/utils.ts` for conditionally combining Tailwind classes.
*   **Data Fetching:**
    *   Manage server state and data fetching operations using `@tanstack/react-query`.