import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/utils";
import { cookies } from "next/headers";

async function isAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "1";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const admin = await isAuthed();

  let query = supabase
    .from("posts")
    .select("*")
    .order("published_at", { ascending: false });

  if (category) query = query.eq("category", category);
  if (!admin) query = query.eq("is_published", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const slug = `${new Date().toISOString().split("T")[0]}-${slugify(body.title) || "untitled"}`;

  const { data, error } = await supabase
    .from("posts")
    .insert([{ ...body, slug }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
