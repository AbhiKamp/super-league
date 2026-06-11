import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { handleError } from '../../../../lib/errorHandler';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
console.log("DEBUG URL:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ player_id: string }> }
) {
    try {
        const { player_id } = await params;

        const { data, error } = await supabase
            .from('players')
            .select(`
        id, first_name, last_name, position, jersey_number, image_url, assists, 
        overall_rating, attributes,
        teams ( id, name )
      `)
            .eq('id', player_id)
            .single();

        if (error) throw error;

        const { count: goalCount } = await supabase
            .from('goals')
            .select('*', { count: 'exact', head: true })
            .eq('player_id', player_id);

        const player = {
            id: data.id,
            name: `${data.first_name} ${data.last_name}`,
            first_name: data.first_name,
            last_name: data.last_name,
            position: data.position,
            jersey_number: data.jersey_number,
            image_url: data.image_url,
            assists: data.assists ?? 0,
            goals: goalCount ?? 0,
            overall_rating: data.overall_rating ?? 50,
            attributes: data.attributes || null,
            team: (data as any).teams?.name || null,
            team_id: (data as any).teams?.id || null,
        };

        return NextResponse.json({ success: true, data: player });
    } catch (error) {
        return handleError(error, 'Fetch Player');
    }
}
