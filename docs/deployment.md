# Production deployment

## Initial target: Render

Use a Render Web Service built from this repository's existing Dockerfile. The
multi-stage image already builds `dist/server` and starts the same production
bundle used by release smoke checks. Render supplies `PORT`; the image's local
8080 default is overridden by the Blueprint's `PORT=10000`, and the server
binds to `0.0.0.0`. The Blueprint pins one Frankfurt instance and `/health` as
its deploy health check. Frankfurt is Render's closest listed region to
Nigeria.

The Blueprint selects Render's Free web-service plan, so compute has $0 fixed
monthly cost. Free services can spin down after 15 minutes without inbound
traffic; cold starts are expected and can take about a minute. This is an
accepted tradeoff for Color API's initial public/portfolio release while usage
is low. If real usage justifies consistently warm responses, upgrading to the
smallest always-on instance is the next hosting step. Review Render's current
[pricing] and [Free service limits] before creating the service. Free usage has
workspace quotas for instance hours, bandwidth, and build minutes; reaching a
limit can suspend service/builds, and excess bandwidth/build usage can incur
charges if a payment method is attached. Render currently includes 750 free
instance hours per workspace per calendar month, shared by its free services.

The Blueprint configures the existing per-process limiter to use
`CF-Connecting-IP`. Render states that public web-service traffic passes
through Cloudflare; its Cloudflare integration overwrites this header with the
client address. Do not configure `X-Forwarded-For`: Cloudflare appends to that
header, leaving a caller-supplied leftmost address. The configured header
parser accepts one literal IP and otherwise falls back to the socket peer.
Free web services cannot receive private-network traffic. If the plan or
networking setup changes later, keep this trust limited to the public Render
path; do not let untrusted services call the API over a private network with a
forged `CF-Connecting-IP`. The current API has no internal service callers.

The process-local limiter remains a single-instance backstop, not a shared
cross-instance store. The Blueprint keeps one instance. If scaling out later,
add a shared trusted rate-limit layer before increasing the instance count.
The service is stateless and needs no disk, database, or application secret.
Body limits, request timeouts, validation, safe errors, and CORS behavior stay
at their existing application defaults.

### Render settings and manual setup

`render.yaml` is the service configuration. In Render:

1. Connect the GitHub repository and create a Blueprint from its root
   `render.yaml`; first push the reviewed deployment commit to the linked
   `main` branch, then select that branch. Render cannot deploy uncommitted
   workspace files. Auto-deploy is configured to wait for CI checks.
2. Confirm the Free plan and Frankfurt region. Compute has no fixed monthly
   charge. Review workspace usage and limits; if a payment method is attached,
   monitor usage to avoid supplementary bandwidth or build charges.
3. Set `CORS_ORIGINS` in the service environment only when browser clients
   exist. Use a comma-separated list of exact HTTPS origins, with no path and
   no wildcard. Leave it unset for server-to-server-only use. No other secret
   values are needed.
4. Keep the default `onrender.com` hostname for initial HTTPS smoke tests.
   Render provides managed TLS. A custom domain is optional: add it in the
   service's Settings, then configure the DNS records Render displays and wait
   for domain verification and certificate provisioning.
5. Confirm `/health` as the health-check path, inspect deploy and runtime logs,
   and record the service's public URL. Use Render's deploy history to roll
   back to the previous successful deploy if smoke checks fail.

Render injects `PORT` (the Blueprint pins it to `10000`), and the Blueprint
sets `RATE_LIMIT_CLIENT_IP_HEADER=cf-connecting-ip`, `RATE_LIMIT_MAX=120`, and
`RATE_LIMIT_WINDOW_MS=60000`. `BODY_LIMIT_BYTES` defaults to 65,536 bytes;
`REQUEST_TIMEOUT_MS` defaults to 30,000 ms; `CONNECTION_TIMEOUT_MS` defaults
to 10,000 ms. Change these only through reviewed service environment settings.

After deployment, run `npm run release:smoke` with `PUBLIC_API_URL` set to the
HTTPS service URL. Also confirm a caller-supplied `CF-Connecting-IP` does not
change the effective client rate-limit bucket at Render's public edge. Exercise
CORS from each approved browser origin and verify 429 behavior, response request
IDs, safe errors, and logs without payloads or secrets. The in-memory counter
resets when the process restarts; Render deploys/restarts and rate-limit resets
are operational characteristics, not a durable quota system.

## Preserved alternative: Google Cloud Run

For a possible later migration, use Cloud Run in `africa-south1` (Johannesburg),
fronted by a global external Application Load Balancer and a Cloud Armor Standard
security policy. Cloud Run supports the Johannesburg region; Render's nearest
listed region is Frankfurt, while Railway lists Amsterdam as its nearest listed
region. This preserved option favors proximity to Nigerian users and a trusted
per-client edge rate limit. It requires more Google Cloud setup and fixed cost
than the selected initial Render deployment. Keep the Dockerfile, container
smoke, and these instructions for a later migration if requirements change.

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

Render provider references checked 2026-10-04: [Web Services](https://render.com/docs/web-services), [Docker](https://render.com/docs/docker), [Blueprint spec](https://render.com/docs/blueprint-spec), [health checks](https://render.com/docs/health-checks), [pricing](https://render.com/pricing), [free service limits](https://render.com/docs/free), [client IP guidance](https://render.com/articles/host-pocketbase-on-render), and [uptime guidance](https://render.com/docs/uptime-best-practices).

| Provider | Cost and regions | Operations and limits |
| --- | --- | --- |
| Render | Free compute is $0 with usage limits and spin-down; smallest always-on 512 MB plan is currently $7/month. Listed regions include Frankfurt. | Low setup overhead, dashboard environment/logs, managed TLS, and HTTP health checks. Free services have cold starts. Trust only the documented client-IP header; don't enable broad Fastify proxy trust. |
| Railway | Hobby is $5/month applied to usage; listed regions are California, Virginia, Amsterdam, and Singapore. | Simple deploys, variables, logs, and deploy-time health checks. The health check is not continuously monitored after deployment. No listed African region. |
| Cloud Run + Cloud Armor | Usage-priced service in Johannesburg; a public per-client edge limit requires a load balancer and adds the fixed costs above. | More initial IAM/network setup; managed revisions, health probes, Secret Manager, and Cloud Logging. It provides the closest listed region and shared edge throttling. |

Provider references checked 2026-10-04: [Cloud Run regions](https://docs.cloud.google.com/run/docs/locations), [Cloud Run configuration](https://docs.cloud.google.com/run/docs/configuring), [Cloud Run ingress sources](https://docs.cloud.google.com/run/docs/securing/ingress), [Cloud Run public access](https://docs.cloud.google.com/run/docs/securing/managing-access), [Cloud Run pricing](https://cloud.google.com/run/pricing), [Cloud Load Balancing pricing](https://cloud.google.com/load-balancing/pricing), [Cloud Armor pricing](https://cloud.google.com/armor/pricing), [Cloud Armor rate limiting](https://docs.cloud.google.com/armor/docs/rate-limiting-overview), [Render pricing](https://render.com/pricing), [Render regions](https://render.com/docs/regions), [Render health checks](https://render.com/docs/health-checks), [Railway plan pricing](https://docs.railway.com/pricing/plans), [Railway regions](https://docs.railway.com/guides/multi-region-api-failover), and [Railway health checks](https://docs.railway.com/deployments/healthchecks).

## Deployment outline

### Preserved Cloud Run deployment outline

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
