import { GithubOIDCValidator } from "$lib/auth/github";
import { Game } from "$lib/game";
import { RecurseAPIError } from "$lib/recurse";
import { GameManifest, PluginManifest } from "@rcade/api";
import type { RequestHandler } from "@sveltejs/kit";
import semver from "semver";
import { ZodError } from "zod";
import * as jose from "jose";
import { Plugin } from "$lib/plugin";

const VALIDATOR = new GithubOIDCValidator();

function jsonResponse(body: object, status: number): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

export const POST: RequestHandler = async ({ params, request }) => {
    const deploymentName = params.deployment_name ?? "";
    if (!deploymentName) {
        return jsonResponse({ error: 'Deployment name is required' }, 400);
    }

    const header = request.headers.get("Authorization");

    if (!header?.startsWith("Bearer ")) {
        return jsonResponse({ error: 'Missing or invalid Authorization header. Expected: Bearer <token>' }, 401);
    }

    const token = header.slice(7);
    if (!token) {
        return jsonResponse({ error: 'No GitHub OIDC JWT provided' }, 401);
    }

    let auth;
    try {
        auth = await VALIDATOR.validate(token);
    } catch (error) {
        if (error instanceof jose.errors.JOSEError) {
            console.error('OIDC validation failed:', error.code, error.message);
            return jsonResponse({ error: `Authentication failed: ${error.message}` }, 401);
        }
        if (error instanceof ZodError) {
            console.error('OIDC claims validation failed:', error.issues);
            return jsonResponse({ error: 'Invalid OIDC token claims' }, 401);
        }
        if (error instanceof RecurseAPIError) {
            console.error('Recurse API error:', error.code, error.message);
            return jsonResponse({ error: error.message }, error.statusCode);
        }
        throw error;
    }

    let body;

    try {
        body = await request.json();
    } catch (error) {
        if (error instanceof SyntaxError) {
            return jsonResponse({ error: 'Invalid JSON in request body' }, 400);
        }
        throw error;
    }

    let kind: "game" | "plugin" = "game";

    if ("kind" in body && body.kind === "plugin") {
        kind = "plugin";
    }

    let manifest;
    try {
        if (kind === "game") {
            manifest = GameManifest.parse(body);
        } else {
            manifest = PluginManifest.parse(body);
        }
    } catch (error) {
        if (error instanceof ZodError) {
            const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
            return jsonResponse({ error: 'Invalid manifest', details: issues }, 400);
        }
        throw error;
    }

    if (deploymentName !== manifest.name) {
        return jsonResponse({ error: 'Deployment name does not match object name in manifest' }, 400);
    }

    let object;

    if (kind === "game") {
        object = await Game.byName(deploymentName);
    } else {
        object = await Plugin.byName(deploymentName);
    }

    try {
        let version: string;

        if (object == undefined) {
            version = manifest.version ?? "1.0.0";

            if (kind === "game") {
                object = await Game.new(manifest.name, auth);
            } else {
                object = await Plugin.new(manifest.name, auth);
            }
        } else {
            if (manifest.version) {
                version = manifest.version;
            } else {
                const latest = await object.latestVersionNumber();
                if (latest == undefined) {
                    version = "1.0.0";
                } else {
                    const bumped = semver.inc(latest, "patch");
                    if (bumped == null) {
                        console.error('Failed to increment version:', latest);
                        return jsonResponse({ error: `Unable to auto-increment version from '${latest}'` }, 500);
                    }
                    version = bumped;
                }
            }
        }

        const { upload_url, expires } = await object.publishVersion(version, manifest as any);

        return jsonResponse({ upload_url, expires }, 200);
    } catch (error) {
        if (error instanceof Error && error.message === "Version mismatch") {
            return jsonResponse({ error: 'Manifest version does not match the target version' }, 409);
        }

        console.error('Deployment failed:', error);
        return jsonResponse({ error: 'Deployment failed. Please try again or contact support.' }, 500);
    }
};