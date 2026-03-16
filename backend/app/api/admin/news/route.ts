import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { handleError } from '../../../../lib/errorHandler';

// Helper function to init Supabase
async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() }, setAll() {} },
  });
}

// CREATE AN ARTICLE
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await getSupabaseClient();

    // Securely get the logged-in admin's details
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw { status: 401, message: "Unauthorized" };

    const { data, error } = await supabase
      .from('newsletter')
      .insert([{
        title: body.title,
        summary: body.summary,
        // Tie the author to the admin's email (or ID if email isn't available)
        author: user.email || user.id, 
        image_url: body.imageUrl || null,
        date: new Date().toISOString() // Automatically set the publish date to right now
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Article published", data });
  } catch (error) {
    return handleError(error, "Admin Create Article");
  }
}

// UPDATE AN ARTICLE
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.id) throw { status: 400, message: "Article ID is required for updates." };

    const supabase = await getSupabaseClient();

    const { data, error } = await supabase
      .from('newsletter')
      .update({
        title: body.title,
        summary: body.summary,
        image_url: body.imageUrl
        // Notice we DO NOT update 'date' or 'author' so the original credit remains intact!
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Article updated", data });
  } catch (error) {
    return handleError(error, "Admin Update Article");
  }
}

// DELETE AN ARTICLE
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) throw { status: 400, message: "Article ID is required for deletion." };

    const supabase = await getSupabaseClient();

    const { error } = await supabase
      .from('newsletter')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Article deleted successfully" });
  } catch (error) {
    return handleError(error, "Admin Delete Article");
  }
}