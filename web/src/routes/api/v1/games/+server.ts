import type { RequestHandler } from "@sveltejs/kit";
import { Game } from "$lib/game";
import { env } from "$env/dynamic/private";

export const GET: RequestHandler = async ({ locals, request, platform }) => {
    const session = await locals.auth();

    const auth = session?.user ? { for: "recurser" as const, rc_id: session.user.rc_id } : request.headers.get("Authorization") == `Bearer ${env.CABINET_API_KEY}` ? { for: "cabinet" as const } : { for: "public" as const };

    try {
        const games = (await Promise.all((await Game.all()).map(async game => await game.intoResponse(auth)))).filter(v => v !== undefined);
        const body = JSON.stringify(games);

        return new Response(body, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            }
        });
    } catch (error) {
        console.error('Database error:', error);

        return new Response(
            JSON.stringify({ error: 'Failed to fetch items' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};