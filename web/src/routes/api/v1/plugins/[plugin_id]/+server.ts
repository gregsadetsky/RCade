import { env } from "$env/dynamic/private";
import { getDb } from "$lib/db";
import { games } from "$lib/db/schema";
import { Game } from "$lib/game";
import { Plugin } from "$lib/plugin";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ locals, params, request }) => {
    const session = await locals.auth();

    const auth = session?.user ? { for: <const>"recurser", rc_id: session.user.rc_id } : request.headers.get("Authorization") == `Bearer ${env.CABINET_API_KEY}` ? { for: <const>"cabinet" } : { for: <const>"public" };

    try {
        const plugin = await Plugin.byId(params.plugin_id ?? "");
        let response = undefined;

        if (plugin !== undefined) {
            response = await plugin.intoResponse(auth, { withR2Key: true });
        }

        if (response === undefined) {
            return new Response(
                JSON.stringify({ error: 'Plugin not found' }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify(response),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Database error:', error);

        return new Response(
            JSON.stringify({ error: 'Failed to fetch items' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};