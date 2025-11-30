import * as fs from "fs";
import * as path from "path";
import * as semver from "semver";
import { parse as parseToml } from "smol-toml";
import { pluginManifests } from "../plugins.js";
import { Manifest as PluginManifestSchema } from "../plugin/manifest.js";
import type * as z from "zod";

type PluginManifest = z.infer<typeof PluginManifestSchema>;
type Language = "javascript" | "rust";

interface DetectedPackage {
    language: Language;
    name: string;
    version: string;
}

interface DetectedPlugin {
    manifest: PluginManifest;
    matchedPackages: DetectedPackage[];
}

interface GameDependency {
    name: string;
    version: string;
}

export class PluginDetector {
    private manifests: PluginManifest[];

    constructor(manifests?: PluginManifest[]) {
        this.manifests = manifests ?? pluginManifests.map(m => PluginManifestSchema.parse(m));
    }

    detectLanguages(repoPath: string): Language[] {
        const languages: Language[] = [];
        if (fs.existsSync(path.join(repoPath, "package.json"))) {
            languages.push("javascript");
        }
        if (fs.existsSync(path.join(repoPath, "Cargo.toml"))) {
            languages.push("rust");
        }
        return languages;
    }

    private parsePackageJson(repoPath: string): DetectedPackage[] {
        const packageJsonPath = path.join(repoPath, "package.json");
        if (!fs.existsSync(packageJsonPath)) {
            return [];
        }

        const content = fs.readFileSync(packageJsonPath, "utf-8");
        const packageJson = JSON.parse(content);
        const packages: DetectedPackage[] = [];
        const allDeps: Record<string, unknown> = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
        };

        for (const [name, version] of Object.entries(allDeps)) {
            if (typeof version === "string") {
                packages.push({
                    language: "javascript",
                    name,
                    version: this.cleanVersion(version),
                });
            }
        }
        return packages;
    }

    private parseCargoToml(repoPath: string): DetectedPackage[] {
        const cargoTomlPath = path.join(repoPath, "Cargo.toml");
        if (!fs.existsSync(cargoTomlPath)) {
            return [];
        }

        const content = fs.readFileSync(cargoTomlPath, "utf-8");
        const cargo = parseToml(content);
        const packages: DetectedPackage[] = [];

        const deps = cargo.dependencies;
        if (!deps || typeof deps !== "object") {
            return packages;
        }

        for (const [name, value] of Object.entries(deps)) {
            let version: string | undefined;

            if (typeof value === "string") {
                version = value;
            } else if (typeof value === "object" && value !== null && "version" in value) {
                version = String(value.version);
            }

            if (version) {
                packages.push({
                    language: "rust",
                    name,
                    version: this.cleanVersion(version),
                });
            }
        }

        return packages;
    }

    private cleanVersion(version: string): string {
        return semver.coerce(version)?.version ?? version;
    }

    detectPackages(repoPath: string): DetectedPackage[] {
        return [
            ...this.parsePackageJson(repoPath),
            ...this.parseCargoToml(repoPath),
        ];
    }

    detectPlugins(repoPath: string): DetectedPlugin[] {
        const packages = this.detectPackages(repoPath);
        const detected: DetectedPlugin[] = [];

        for (const manifest of this.manifests) {
            const matchedPackages: DetectedPackage[] = [];

            for (const library of manifest.libraries) {
                const matchingPackage = packages.find(
                    pkg => pkg.language === library.language &&
                           pkg.name === library.package.name
                );
                if (matchingPackage) {
                    matchedPackages.push(matchingPackage);
                }
            }

            if (matchedPackages.length > 0) {
                detected.push({ manifest, matchedPackages });
            }
        }

        return detected;
    }

    generateDependencies(repoPath: string): GameDependency[] {
        const detected = this.detectPlugins(repoPath);

        return detected.map(({ manifest, matchedPackages }) => ({
            name: manifest.name,
            version: matchedPackages[0]?.version ?? manifest.version ?? "1.0.0",
        }));
    }
}
