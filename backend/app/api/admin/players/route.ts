import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { handleError } from '../../../../lib/errorHandler'; // Adjust path if needed

// 1. THE MAGIC FIX: Teach the client to read the Auth Header!
async function getSupabaseClient(request: Request) {
  const cookieStore = await cookies();
  const authHeader = request.headers.get('Authorization'); // Grab the VIP Pass from the frontend!

  return createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() }, setAll() {} },
    global: {
      headers: {
        Authorization: authHeader || '', // Force Supabase to use the token!
      },
    },
  });
}

// CREATE A PLAYER
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await getSupabaseClient(request); // Pass the request here!

    const { data, error } = await supabase
      .from('players')
      .insert([{
        first_name: body.first_name,
        last_name: body.last_name,
        team_id: body.team_id || null, 
        position: body.position,
        jersey_number: body.jersey_number || null,
        overall_rating: body.overall_rating || 50,
        attributes: body.attributes || {},
        image_url: body.image_url || null 
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Player created", data });
  } catch (error) {
    return handleError(error, "Admin Create Player");
  }
}

// UPDATE A PLAYER
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) throw { status: 400, message: "Player ID is required for updates." };

    const supabase = await getSupabaseClient(request); // Pass the request here!

    const { data, error } = await supabase
      .from('players')
      .update({
        first_name: body.first_name,
        last_name: body.last_name,
        team_id: body.team_id,
        position: body.position,
        overall_rating: body.overall_rating || 50,
        attributes: body.attributes || {},
        jersey_number: body.jersey_number,
        image_url: body.image_url 
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Player updated", data });
  } catch (error) {
    return handleError(error, "Admin Update Player");
  }
}

// DELETE A PLAYER
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) throw { status: 400, message: "Player ID is required for deletion." };

    const supabase = await getSupabaseClient(request); // Pass the request here!

    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Player deleted successfully" });
  } catch (error) {
    return handleError(error, "Admin Delete Player");
  }
}