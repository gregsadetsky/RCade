import { eq, type InferSelectModel } from "drizzle-orm";
import { getDb } from "./db";
import { gameAuthors, gameDependencies, games, gameVersions } from "./db/schema";
import type { GithubOIDCClaims } from "./auth/github";
import * as z from "zod";
import { GameManifest } from "@rcade/api";
import type { R2Bucket } from "@cloudflare/workers-types";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "$env/dynamic/private";
import type { RecurseResponse } from "./rc_oauth";
import semver from "semver";

export enum GitUrlKind {
    Https,
    Ssh,
}

const S3 = new S3Client({
    region: "auto",
    endpoint: env.BUCKET_S3_ENDPOINT!,
    credentials: {
        accessKeyId: env.BUCKET_ACCESS_KEY!,
        secretAccessKey: env.BUCKET_ACCESS_KEY_SECRET!,
    },
});

export class Game {
    public static async all(): Promise<Game[]> {
        return (await getDb().query.games.findMany({ with: { versions: { with: { authors: true, dependencies: true } } } }))
            .map(game => new Game(game));
    }

    public static async byId(id: string): Promise<Game | undefined> {
        let v = await getDb().query.games.findFirst({ with: { versions: { with: { authors: true, dependencies: true } } }, where: eq(games.id, id) });

        if (v === undefined) {
            return undefined;
        }

        return new Game(v);
    }

    public static async byName(name: string): Promise<Game | undefined> {
        let v = await getDb().query.games.findFirst({ with: { versions: { with: { authors: true, dependencies: true } } }, where: eq(games.name, name) });

        if (v === undefined) {
            return undefined;
        }

        return new Game(v);
    }

    public static async new(name: string, pushInfo: GithubOIDCClaims & { recurser: RecurseResponse }): Promise<Game> {
        const result = await getDb().insert(games).values({
            name,

            github_author: pushInfo.repository_owner,
            github_repo: pushInfo.repository,

            owner_rc_id: pushInfo.recurser.id.toString(), // TODO
        }).returning();

        return new Game({
            ...result[0],
            versions: [],
        });
    }

    private constructor(private data: InferSelectModel<typeof games> & {
        versions: (InferSelectModel<typeof gameVersions> & {
            authors: InferSelectModel<typeof gameAuthors>[],
            dependencies: InferSelectModel<typeof gameDependencies>[],
        })[]
    }) { }

    public async publishVersion(version: string, manifest: z.infer<typeof GameManifest>): Promise<{ upload_url: string, expires: number }> {
        if (manifest.version !== undefined && manifest.version !== version) {
            throw new Error("Version mismatch");
        }

        await getDb().insert(gameVersions).values({
            gameId: this.data.id,
            version,

            displayName: manifest.display_name,
            description: manifest.description,
            visibility: manifest.visibility,
        });

        const authors = Array.isArray(manifest.authors) ? manifest.authors : [manifest.authors];

        await getDb().insert(gameAuthors).values(authors.map(author => ({
            gameId: this.data.id,
            gameVersion: version,

            display_name: author.display_name,
            recurse_id: author.recurse_id
        })));

        await getDb().insert(gameDependencies).values(manifest.dependencies.map(dependency => ({
            gameId: this.data.id,
            gameVersion: version,

            dependencyName: dependency.name,
            dependencyVersion: dependency.version,
        })));

        const upload_url = await getSignedUrl(
            S3,
            new PutObjectCommand({ Bucket: "rcade", Key: `games/builds/${this.data.id}/${version}.tar.gz` }),
            { expiresIn: 3600 }
        );

        return { upload_url, expires: (Date.now() + 3600) }
    }

    public gitUrl(kind: GitUrlKind = GitUrlKind.Https) {
        switch (kind) {
            case GitUrlKind.Https: return `https://github.com/${this.data.github_repo}`
            case GitUrlKind.Ssh: return `git@github.com:${this.data.github_repo}.git`
        }
    }

    public async intoResponse(auth: { for: "recurser", rc_id: string } | { for: "public" } | { for: "cabinet" }, config: { withR2Key: boolean } = { withR2Key: false }): Promise<object | undefined> {
        const versions = await Promise.all(this.data.versions.map(async version => {
            if (version.visibility !== "public") {
                if (auth.for === "public" || (auth.for == "recurser" && auth.rc_id !== this.data.owner_rc_id))
                    return undefined;
            }

            if (version.visibility === "personal" && auth.for === "cabinet") {
                return undefined;
            }

            const r2Key: Record<string, any> = {};

            if (config.withR2Key) {
                r2Key["contents"] = {
                    url: await getSignedUrl(
                        S3,
                        new GetObjectCommand({ Bucket: "rcade", Key: `games/builds/${this.data.id}/${version.version}.tar.gz` }),
                        { expiresIn: 3600 }
                    ),
                    expires: Date.now() + (3600 * 1000),
                };
            }

            return {
                displayName: version.displayName,
                description: version.description,
                visibility: version.visibility,
                version: version.version,
                authors: version.authors.map(v => ({ display_name: v.display_name, recurse_id: v.recurse_id })),
                dependencies: version.dependencies.map(v => ({ name: v.dependencyName, version: v.dependencyVersion })),
                ...r2Key,
            }
        }));

        if (versions.length == 0) {
            return undefined;
        }

        return {
            id: this.data.id,
            name: this.data.name,
            git: {
                ssh: this.gitUrl(GitUrlKind.Ssh),
                https: this.gitUrl(GitUrlKind.Https),
            },
            owner_rc_id: this.data.owner_rc_id,
            versions,
        }
    }

    public async latestVersionNumber() {
        return semver.sort(this.data.versions.map(v => v.version)).pop()
    }
}