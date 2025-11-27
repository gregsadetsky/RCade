import { GithubOIDCValidator } from "$lib/auth/github";
import { getDb } from "$lib/db";
import { games } from "$lib/db/schema";
import { Game } from "$lib/game";
import { GameManifest } from "@rcade/api";
import type { RequestHandler } from "@sveltejs/kit";
import semver from "semver";

const VALIDATOR = new GithubOIDCValidator();

export const POST: RequestHandler = async ({ params, request }) => {
    try {
        let token: string | undefined = undefined;
        const header = request.headers.get("Authorization");

        if (header != undefined && header.startsWith("Bearer ")) {
            token = header.slice(7);
        }

        if (token == undefined) {
            return new Response(
                JSON.stringify({ error: 'No github OIDC JWT provided' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const auth = await VALIDATOR.validate(token);

        const manifest = GameManifest.parse(await request.json());
        let game = await Game.byName(params.game_name ?? "");
        let version = undefined;

        if (game == undefined) {
            version = manifest.version ?? "1.0.0";
            game = await Game.new(manifest.name, auth);
        } else {
            version = manifest.version;

            if (version == undefined) {
                const latest = await game.latestVersionNumber();

                if (latest == undefined) {
                    version = "1.0.0";
                } else {
                    version = semver.inc(latest, "patch");

                    if (version == null) {
                        throw new Error("Failed to bump version?");
                    }
                }
            }
        }

        const { upload_url, expires } = await game.publishVersion(version, manifest);

        return new Response(
            JSON.stringify({ upload_url, expires }),
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