import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Server-side Supabase client. Uses anon key only — never service_role, never bypasses RLS. */
export const supabase = createClient(supabaseUrl, supabaseKey);

/** Service role client — bypasses RLS. Use only for server-side ops that need elevated access (e.g. anonymous analyze). */
export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

/** Server-side client for Edge Function invocation. Uses anon key only — never service_role. */
const supabaseForFunctions = createClient(
  supabaseUrl,
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export { supabaseForFunctions };

export type Database = {
  public: {
    Tables: {
      app_users: {
        Row: {
          id: string;
          email: string;
          google_id: string;
          created_at: string;
          approved: boolean;
        };
        Insert: Omit<
          Database["public"]["Tables"]["app_users"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["app_users"]["Insert"]
        >;
      };
      waitlist: {
        Row: {
          id: string;
          user_id: string;
          joined_at: string;
          approved_at: string | null;
          approval_status?: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["waitlist"]["Row"],
          "id" | "joined_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["waitlist"]["Insert"]
        >;
      };
      agent_memory: {
        Row: {
          id: number;
          reddit_username: string;
          system_prompt: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["agent_memory"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["agent_memory"]["Insert"]
        >;
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          mode: "god" | "conversation";
          active_clones: Record<string, unknown>;
          metadata: Record<string, unknown>;
        };
        Insert: Omit<
          Database["public"]["Tables"]["chat_sessions"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["chat_sessions"]["Insert"]
        >;
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: "user" | "capybara" | "clone";
          sender_id: string | null;
          content: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["chat_messages"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["chat_messages"]["Insert"]
        >;
      };
      studyrooms: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          display_name: string | null;
          session_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["studyrooms"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["studyrooms"]["Insert"]
        >;
      };
    };
  };
};
