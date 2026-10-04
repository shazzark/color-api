# Production deployment

## Recommended first host: Google Cloud Run

For the initial public API, use Cloud Run in `africa-south1` (Johannesburg),
fronted by a global external Application Load Balancer and a Cloud Armor Standard
security policy. Cloud Run supports the Johannesburg region; Render's nearest
listed region is Frankfurt, while Railway lists Amsterdam as its nearest listed
region. This recommendation favors proximity to Nigerian users and a trusted
per-client rate limit. It requires more Google Cloud setup than a one-click PaaS.

The API currently applies a process-local rate cap using the socket peer address.
Do not treat a raw forwarded-IP header as trustworthy in the application. Route
public traffic through the load balancer, set Cloud Run ingress to
`internal-and-cloud-load-balancing`, and use Cloud Armor's `IP` key for the edge
throttle. Set the load balancer backend custom request header
`x-color-api-client-ip: {client_ip_address}` and the service environment variable
`RATE_LIMIT_CLIENT_IP_HEADER=x-color-api-client-ip`. Google Cloud's load balancer
must replace any client-supplied value of that header; the application validates
that its value is an IP address and otherwise falls back to the socket peer.
Cloud Run's `internal-and-cloud-load-balancing` ingress also
admits internal sources, not only the external load balancer. Treat those
internal callers as trusted: do not deploy untrusted workloads in the
project/VPC paths that can reach the service, constrain those paths with
network controls, and review project/workload governance whenever workloads
or connectivity change. Public invocation permits `allUsers`, so IAM does not
restrict which internal caller can invoke this anonymously accessible service.
Use a separately designed authenticated ingress (for example, IAP) if internal
callers must not be trusted. Cloud Armor is the public internet rate-limit boundary;
an internal caller can bypass that edge policy and can select its own
in-process limiter bucket. Verify that an intentionally forged client header
is replaced before enabling the setting, and do not expose the default `run.app`
URL directly to clients.

The deployment artifact is a multi-stage Docker build. Cloud Run supplies `PORT`;
the server binds to `0.0.0.0` and `/health` returns `200`. Set `NODE_ENV=production`.
Set `CORS_ORIGINS` to the exact HTTPS origins of browser clients when those are
known; leave it unset if clients use server-to-server requests. No application
secrets are required by the current API.

The service remains stateless. Start with one Cloud Run region and a modest
maximum instance count; Cloud Armor owns the shared client-IP throttle while the
in-process limiter remains a local backstop. Cloud Run supports health probes,
environment variables, Secret Manager integration, and Cloud Logging. Retain the
previous Cloud Run revision for rollback; restore traffic to it if the new
revision fails its public smoke checks.

Before provisioning anything, estimate the Google Cloud bill in the project
calculator. Current list pricing puts one global forwarding rule at $0.025/hour
(about $18.25/month), Cloud Armor Standard at about $5/month for one policy plus
about $1/month for one rule, and $0.75 per million requests for a global policy.
Load-balancer data processing and Cloud Run usage are additional; Cloud Run
pricing varies by region, and Johannesburg uses Tier 2 pricing. These values are
estimates from the provider's current pages and can change.

## Other options reviewed

| Provider | Cost and regions | Operations and limits |
| --- | --- | --- |
| Render | Starter web service is $7/month for 512 MB; listed regions are US, Frankfurt, and Singapore. | Lowest setup overhead, dashboard secrets/logs, and recurring HTTP health checks. Free services sleep after inactivity. The platform forwards proxy headers; don't turn on broad Fastify proxy trust without a validated trusted-proxy design. |
| Railway | Hobby is $5/month applied to usage; listed regions are California, Virginia, Amsterdam, and Singapore. | Simple deploys, variables, logs, and deploy-time health checks. The health check is not continuously monitored after deployment. No listed African region. |
| Cloud Run + Cloud Armor | Usage-priced service in Johannesburg; a public per-client edge limit requires a load balancer and adds the fixed costs above. | More initial IAM/network setup; managed revisions, health probes, Secret Manager, and Cloud Logging. It provides the closest listed region and shared edge throttling. |

Provider references checked 2026-10-04: [Cloud Run regions](https://docs.cloud.google.com/run/docs/locations), [Cloud Run configuration](https://docs.cloud.google.com/run/docs/configuring), [Cloud Run ingress sources](https://docs.cloud.google.com/run/docs/securing/ingress), [Cloud Run public access](https://docs.cloud.google.com/run/docs/securing/managing-access), [Cloud Run pricing](https://cloud.google.com/run/pricing), [Cloud Load Balancing pricing](https://cloud.google.com/load-balancing/pricing), [Cloud Armor pricing](https://cloud.google.com/armor/pricing), [Cloud Armor rate limiting](https://docs.cloud.google.com/armor/docs/rate-limiting-overview), [Render pricing](https://render.com/pricing), [Render regions](https://render.com/docs/regions), [Render health checks](https://render.com/docs/health-checks), [Railway plan pricing](https://docs.railway.com/pricing/plans), [Railway regions](https://docs.railway.com/guides/multi-region-api-failover), and [Railway health checks](https://docs.railway.com/deployments/healthchecks).

## Deployment outline

1. Build and run the image locally with `npm run container:smoke`.
2. Use a billing-enabled Google Cloud project and enable Cloud Run, Cloud Build,
   Artifact Registry, Cloud Load Balancing, and Cloud Armor.
3. Build/push the image to Artifact Registry and deploy Cloud Run in
   `africa-south1` with public invocation enabled, ingress limited to
   `internal-and-cloud-load-balancing`, and a conservative maximum instance
   count. This permits internet clients through the load balancer and trusted
   internal sources; public invocation does not make internal sources traverse
   Cloud Armor.
4. Create a global external Application Load Balancer with a serverless NEG for
   the Cloud Run service. Configure its backend to replace
   `x-color-api-client-ip` with `{client_ip_address}`. Add a Cloud Armor Standard
   security policy with a per-source-IP throttle rule matching the API limits;
   preview the rule, then enforce it.
5. Attach an HTTPS certificate and domain, disable the default Cloud Run URL,
   set the approved browser origins in `CORS_ORIGINS`, and record the deployed
   API origin.
6. Run `npm run release:smoke` with `PUBLIC_API_URL` set to that origin. Verify
   `GET /health`, conversion, alpha, accessibility, batch, invalid-input errors,
   CORS, rate-limit headers/throttling, and request logs.

The complete public smoke is still required after a real deployment. Local
container smoke does not prove load-balancer, Cloud Armor, CORS, or DNS settings.
