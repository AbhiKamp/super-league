import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { user_id, advancing_third_place_groups, predictions } = body;

        // Basic validation
        if (!user_id || !predictions || !predictions.champion_id) {
            return NextResponse.json({ success: false, error: "Missing required prediction data." }, { status: 400, headers: corsHeaders });
        }

        // Upsert into our new table
        const { error } = await supabase
            .from('wc_knockout_predictions')
            .upsert({
                user_id,
                advancing_third_place: advancing_third_place_groups,
                round_of_16: predictions.round_of_16,
                quarter_finals: predictions.quarter_finals,
                semi_finals: predictions.semi_finals,
                final: predictions.final,
                champion_id: predictions.champion_id,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' }); // Ensures users only have 1 active bracket

        if (error) throw error;

        return NextResponse.json({ success: true, message: "Knockout predictions saved successfully!" }, { headers: corsHeaders });

    } catch (error: any) {
        console.error("Submit Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
    }
}
