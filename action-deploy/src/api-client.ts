import * as z from "zod";
import { Manifest } from "@rcade/api";
import { HttpClient } from "@actions/http-client";
import { BearerCredentialHandler } from "@actions/http-client/lib/auth";

const RECURSE_BASE_URL = "https://rcade.recurse.com/api/v1";

const DeploymentIntent = z.object({
  upload_url: z.string(),
  expires: z.string(),
});

type DeploymentIntent = z.infer<typeof DeploymentIntent>;

export class RCadeDeployClient {
  private httpClient: HttpClient;

  constructor(private readonly githubToken: string) {
    const auth = new BearerCredentialHandler(this.githubToken);

    this.httpClient = new HttpClient("rcade-deploy", [ auth ]);
  }

  async createDeploymentIntent(manifest: Manifest): Promise<DeploymentIntent> {
      const res = await this.httpClient.post(`${RECURSE_BASE_URL}/deployments/${manifest.name}`, JSON.stringify(manifest));
      if (res.message.statusCode !== 200) {
        throw new Error(`Failed to create deployment intent: ${res.message.statusCode} ${res.message.statusMessage}`);
      }
      const body = await res.readBody();
      return DeploymentIntent.parse(JSON.parse(body));
  }
}