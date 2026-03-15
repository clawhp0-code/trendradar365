import { createClient } from "@supabase/supabase-js";

export type Post = {
  id: string;
  title: string;
  slug: string;
  category: string;
  thumbnail: string | null;
  summary: string;
  content: string;
  price: string | null;
  product_code: string | null;
  release_date: string | null;
  buy_link: string | null;
  published_at: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
};

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
