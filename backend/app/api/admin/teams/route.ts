import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { handleError } from '../../../../lib/errorHandler'; // Adjust path if needed

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() }, setAll() {} },
  });
}

// CREATE A TEAM
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await getSupabaseClient();

    // Security check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw { status: 401, message: "Unauthorized" };

    const { data, error } = await supabase
      .from('teams')
      .insert([{
        name: body.name,
        logo_url: body.logo_url || null,
        division: body.division || 'mens' // Default to men's league if not specified
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Team created successfully", data });
  } catch (error) {
    return handleError(error, "Admin Create Team");
  }
}

// UPDATE A TEAM
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) throw { status: 400, message: "Team ID is required." };

    const supabase = await getSupabaseClient();

    const { data, error } = await supabase
      .from('teams')
      .update({
        name: body.name,
        logo_url: body.logo_url,
        division: body.division
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Team updated successfully", data });
  } catch (error) {
    return handleError(error, "Admin Update Team");
  }
}

// DELETE A TEAM
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) throw { status: 400, message: "Team ID is required." };

    const supabase = await getSupabaseClient();

    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Team deleted successfully" });
  } catch (error) {
    return handleError(error, "Admin Delete Team");
  }
}