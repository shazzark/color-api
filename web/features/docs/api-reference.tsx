import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { DocumentationNav } from "@/components/documentation-nav";
import {
  getDocumentedLimits,
  getDocumentedOperations,
  openApiDocument,
  type DocumentedOperation,
  type JsonObject,
  type OpenApiMedia,
  type OpenApiResponse
} from "@/lib/openapi-source";

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function mediaEntries(response: OpenApiResponse) {
  return Object.entries(response.content ?? {});
}

function exampleFor(media: OpenApiMedia): unknown {
  if (media.example !== undefined) return media.example;
  if (media.schema?.example !== undefined) return media.schema.example;
  return undefined;
}

function OperationResponse({ code, response }: { code: string; response: OpenApiResponse }) {
  return (
    <details className="api-response">
      <summary><strong>{code}</strong> {response.description ?? "Response"}</summary>
      {mediaEntries(response).map(([mediaType, media]) => {
        const example = exampleFor(media);
        return (
          <div className="api-response__media" key={mediaType}>
            <h5>{mediaType}</h5>
            {example !== undefined ? <CodeBlock code={formatJson(example)} language="json" label={`${code} ${mediaType} response example`} /> : null}
            {media.schema ? (
              <details className="api-schema">
                <summary>Response schema</summary>
                <CodeBlock code={formatJson(media.schema)} language="json" label={`${code} response JSON Schema`} />
              </details>
            ) : <p className="documentation-note">No response schema is defined for this media type in the contract.</p>}
          </div>
        );
      })}
      {Object.keys(response.headers ?? {}).length > 0 ? (
        <div className="api-headers">
          <h5>Response headers</h5>
          {Object.entries(response.headers ?? {}).map(([name, header]) => (
            <p key={name}><code>{name}</code>{typeof header.description === "string" ? ` — ${header.description}` : null}</p>
          ))}
        </div>
      ) : null}
    </details>
  );
}

function OperationCard({ operation }: { operation: DocumentedOperation }) {
  const parameters = operation.parameters ?? [];
  const requestMedia = Object.entries(operation.requestBody?.content ?? {});
  const commonResponses = Object.entries(operation.responses).sort(([left], [right]) => {
    const a = Number(left), b = Number(right);
    return Number.isFinite(a) && Number.isFinite(b) ? a - b : left.localeCompare(right);
  });
  const id = `operation-${operation.operationId}`;

  return (
    <article className="api-operation" id={id} data-operation-id={operation.operationId}>
      <header className="api-operation__header">
        <p className="api-operation__route"><span className={`method-tag method-tag--${operation.method.toLowerCase()}`}>{operation.method}</span> <code>{operation.path}</code></p>
        <h3>{operation.summary}</h3>
        <p className="api-operation__category">{operation.category}{operation.tags?.length ? ` · ${operation.tags.join(", ")}` : ""}</p>
        {operation.description ? <p>{operation.description}</p> : null}
      </header>

      {parameters.length > 0 ? (
        <div className="api-parameters">
          <h4>Parameters</h4>
          <div className="api-table-wrap" role="region" aria-label={`${operation.summary} parameters`} tabIndex={0}>
            <table>
              <thead><tr><th scope="col">Name</th><th scope="col">Location</th><th scope="col">Required</th><th scope="col">Schema</th><th scope="col">Description</th></tr></thead>
              <tbody>{parameters.map((parameter) => <tr key={`${parameter.in}-${parameter.name}`}>
                <th scope="row"><code>{parameter.name}</code></th><td>{parameter.in}</td><td>{parameter.required ? "Yes" : "No"}</td>
                <td><code>{formatJson(parameter.schema)}</code></td><td>{parameter.description ?? "—"}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
      ) : null}

      <details className="api-operation__details">
        <summary>{operation.requestBody ? "Request" : "Request (no body)"}{operation.requestBody?.required ? " · body required" : ""}</summary>
        {requestMedia.length > 0 ? requestMedia.map(([mediaType, media]) => {
          const example = exampleFor(media);
          return (
            <div key={mediaType}>
              <h4>{mediaType} example</h4>
              {example !== undefined ? <CodeBlock code={formatJson(example)} language="json" label={`${operation.summary} request example`} /> : <p className="documentation-note">No request example is defined in the contract.</p>}
              {media.schema ? (
                <details className="api-schema">
                  <summary>Request schema and validation constraints</summary>
                  <CodeBlock code={formatJson(media.schema)} language="json" label={`${operation.summary} request JSON Schema`} />
                </details>
              ) : null}
            </div>
          );
        }) : <p className="documentation-note">This operation does not define a request body.</p>}
      </details>

      <details className="api-operation__details">
        <summary>Responses ({commonResponses.length} documented status codes)</summary>
        <div className="api-response-list">
          {commonResponses.map(([code, response]) => <OperationResponse key={code} code={code} response={response} />)}
        </div>
      </details>
    </article>
  );
}

function CommonSchemas({ schemas }: { schemas: Record<string, JsonObject> }) {
  return (
    <section className="documentation-section" id="shared-schemas" aria-labelledby="shared-schemas-title">
      <h2 id="shared-schemas-title">Shared response schemas</h2>
      <p>Operations reference these definitions using OpenAPI <code>$ref</code> values.</p>
      {Object.entries(schemas).map(([name, schema]) => (
        <details className="api-schema" key={name}>
          <summary><code>{name}</code></summary>
          <CodeBlock code={formatJson(schema)} language="json" label={`${name} OpenAPI schema`} />
        </details>
      ))}
    </section>
  );
}

export function ApiReference() {
  const operations = getDocumentedOperations();
  const categories = [...new Set(operations.map((operation) => operation.category))];
  const limits = getDocumentedLimits();
  const schemas = openApiDocument.components?.schemas ?? {};
  const anchors = operations.map((operation) => ({ id: `operation-${operation.operationId}`, label: `${operation.method} ${operation.path}` }));
  const serviceNotes = openApiDocument.info.description;
  const cors = openApiDocument["x-cors-preflight"];

  return (
    <div className="documentation-layout documentation-layout--api">
      <DocumentationNav active="api" anchors={anchors} />
      <article className="documentation-content">
        <header className="documentation-header">
          <p className="eyebrow">HTTP CONTRACT <span className="status-tag status-tag--warning">/v1 PRE-RELEASE</span></p>
          <h1>API reference</h1>
          <p>{openApiDocument.info.title} — contract version {openApiDocument.info.version}. The OpenAPI description marks `/v1` as pre-release; request and response shapes may change before its first formal release.</p>
          <p>These operations are read from the checked-in OpenAPI document. Examples, schemas, response descriptions, and limits shown below are generated from that contract rather than a second hand-maintained route list.</p>
        </header>

        <section className="documentation-section api-limits" id="api-limits" aria-labelledby="api-limits-title">
          <h2 id="api-limits-title">Limits and status</h2>
          <dl className="metric-list">
            <div><dt>Default request body limit</dt><dd>{limits.defaultBodyBytes.toLocaleString()} bytes</dd></div>
            <div><dt>Configured body limit range</dt><dd>{limits.minimumBodyBytes.toLocaleString()}–{limits.maximumBodyBytes.toLocaleString()} bytes</dd></div>
            <div><dt>Default anonymous rate limit</dt><dd>{limits.requestsPerWindow} requests / {limits.rateWindowSeconds} seconds per socket IP</dd></div>
            <div><dt>Health and preflight requests</dt><dd>Excluded from rate counting as described by OpenAPI</dd></div>
          </dl>
          <p>{serviceNotes}</p>
          <p><strong>Contract status:</strong> API v1 is deployed for verification but is not formally released or covered by a stable API SLA.</p>
        </section>

        <section className="documentation-section" id="operation-reference" aria-labelledby="operation-reference-title">
          <h2 id="operation-reference-title">Documented operations ({operations.length})</h2>
          <p>Health, documentation, and specification GET endpoints are informational service endpoints. Versioned POST endpoints perform color operations. Only the POST `/v1` operations are selectable in the playground.</p>
          {categories.map((category) => (
            <section className="api-category" key={category} aria-labelledby={`category-${category.replaceAll(" ", "-")}`}>
              <h3 id={`category-${category.replaceAll(" ", "-")}`}>{category === "Color operation" ? "Color operations" : category === "Health endpoint" ? "Health endpoint" : category === "Documentation endpoint" ? "Documentation endpoint" : category === "Specification endpoint" ? "Specification endpoint" : category}</h3>
              {operations.filter((operation) => operation.category === category).map((operation) => <OperationCard key={operation.operationId} operation={operation} />)}
            </section>
          ))}
        </section>

        {schemas ? <CommonSchemas schemas={schemas} /> : null}

        {cors ? (
          <section className="documentation-section" id="cors" aria-labelledby="cors-title">
            <h2 id="cors-title">Browser CORS requirements</h2>
            <p>The API accepts exact configured HTTP(S) origins only. Wildcard and credentialed CORS are not enabled. The checked-in contract documents preflight outcomes below.</p>
            <CodeBlock code={formatJson(cors)} language="json" label="OpenAPI CORS preflight extension" />
            <p>The project README records that no browser origins are currently configured. Local browser integration requires the exact website origin (for local Next.js: <code>http://127.0.0.1:3000</code>) in the API&apos;s <code>CORS_ORIGINS</code>; the API must use a separate port, for example 3001, with the web build configured to that API origin. The production website hostname is assigned by Vercel and must be added as one exact HTTPS origin before Phase 16 live integration verification.</p>
          </section>
        ) : null}

        <p className="documentation-note">The interactive playground sends only documented POST `/v1` operations to its configured ChromaForge API origin. <Link href="/playground/">Open the pre-release API playground</Link>.</p>
      </article>
    </div>
  );
}
