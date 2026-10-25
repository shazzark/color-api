"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { CodeBlock } from "@/components/code-block";
import { CopyButton } from "@/features/shared/color-results";
import type { ApiOriginConfiguration } from "@/lib/api-origin";
import type { PlaygroundOperation } from "@/lib/openapi-source";
import {
  API_REQUEST_TIMEOUT_MS,
  API_RESPONSE_LIMIT_BYTES,
  buildOperationUrl,
  buildRequestSnippets,
  parseJsonRequest,
  parseResponseBody,
  readBoundedResponse,
  ResponseTooLargeError
} from "./api-transport";

interface ApiPlaygroundProps {
  operations: readonly PlaygroundOperation[];
  apiOrigin: ApiOriginConfiguration;
  maxRequestBytes: number;
}

interface ApiResult {
  status: number;
  statusText: string;
  ok: boolean;
  requestId: string | null;
  retryAfter: string | null;
  bodyText: string;
  isJson: boolean;
  invalidJson: boolean;
}

type TransportIssue = { kind: "network" | "timeout" | "cancelled" | "response-limit" | "request"; message: string; status?: number };

export function ApiPlayground({ operations, apiOrigin, maxRequestBytes }: ApiPlaygroundProps) {
  const [operationId, setOperationId] = useState(operations[0]?.operationId ?? "");
  const firstOperation = operations[0];
  const [requestBody, setRequestBody] = useState(firstOperation ? JSON.stringify(firstOperation.requestExample, null, 2) : "{}");
  const [result, setResult] = useState<ApiResult>();
  const [issue, setIssue] = useState<TransportIssue>();
  const [pending, setPending] = useState(false);
  const activeController = useRef<AbortController | undefined>(undefined);
  const abortReason = useRef<"timeout" | "cancelled" | undefined>(undefined);
  const operation = operations.find((item) => item.operationId === operationId);
  const validation = useMemo(() => parseJsonRequest(requestBody, maxRequestBytes), [requestBody, maxRequestBytes]);

  useEffect(() => () => activeController.current?.abort(), []);

  function updateOperation(nextId: string) {
    const next = operations.find((item) => item.operationId === nextId);
    if (!next) return;
    setOperationId(nextId);
    setRequestBody(JSON.stringify(next.requestExample, null, 2));
    setResult(undefined);
    setIssue(undefined);
  }

  async function sendRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(undefined);
    setIssue(undefined);
    if (!apiOrigin.available) {
      setIssue({ kind: "request", message: apiOrigin.message });
      return;
    }
    if (!operation) {
      setIssue({ kind: "request", message: "Choose a documented API operation first." });
      return;
    }
    if (!validation.valid) {
      setIssue({ kind: "request", message: validation.message });
      return;
    }

    let url: string;
    try {
      url = buildOperationUrl(apiOrigin.origin, operation);
    } catch (error) {
      setIssue({ kind: "request", message: error instanceof Error ? error.message : "The selected API operation is unavailable." });
      return;
    }

    const controller = new AbortController();
    activeController.current = controller;
    abortReason.current = undefined;
    setPending(true);
    const timeoutId = window.setTimeout(() => {
      abortReason.current = "timeout";
      controller.abort();
    }, API_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: operation.method,
        redirect: "error",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(validation.value),
        signal: controller.signal
      });
      let bodyText: string;
      try {
        bodyText = await readBoundedResponse(response, API_RESPONSE_LIMIT_BYTES);
      } catch (error) {
        if (error instanceof ResponseTooLargeError) {
          setIssue({ kind: "response-limit", status: response.status, message: error.message });
          return;
        }
        throw error;
      }
      const parsed = parseResponseBody(response.headers.get("content-type") ?? "", bodyText);
      setResult({
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        requestId: response.headers.get("x-request-id"),
        retryAfter: response.headers.get("retry-after"),
        bodyText,
        isJson: parsed.isJson,
        invalidJson: parsed.invalidJson
      });
    } catch {
      if (abortReason.current === "timeout") {
        setIssue({ kind: "timeout", message: `The API request exceeded the ${API_REQUEST_TIMEOUT_MS / 1000}-second timeout.` });
      } else if (abortReason.current === "cancelled") {
        setIssue({ kind: "cancelled", message: "The API request was cancelled." });
      } else {
        setIssue({ kind: "network", message: "The browser could not read a response. This can mean a network failure or an exact-origin CORS denial; browsers do not expose enough information to distinguish those cases reliably." });
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (activeController.current === controller) activeController.current = undefined;
      setPending(false);
    }
  }

  function cancelRequest() {
    abortReason.current = "cancelled";
    activeController.current?.abort();
  }

  function reset() {
    cancelRequest();
    if (firstOperation) updateOperation(firstOperation.operationId);
    setResult(undefined);
    setIssue(undefined);
  }

  const requestUrl = apiOrigin.available && operation ? buildOperationUrl(apiOrigin.origin, operation) : "";
  const snippets = validation.valid && requestUrl ? buildRequestSnippets(requestUrl, validation.value) : undefined;

  return (
    <section className="api-playground" aria-labelledby="playground-title">
      <header className="documentation-header">
        <p className="eyebrow">INTERACTIVE HTTP TOOL <span className="status-tag status-tag--warning">/v1 PRE-RELEASE</span></p>
        <h1 id="playground-title">API playground</h1>
        <p>Select a documented operation, edit its example JSON, and send a request only when you choose. Requests go directly from this browser to the configured ChromaForge API origin.</p>
      </header>

      <aside className="playground-notice" role="note">
        <strong>Pre-release API</strong>
        <p>API v1 is deployed for verification, but it is not formally released. Its request or response shapes may evolve before release.</p>
      </aside>

      {!apiOrigin.available ? <p className="tool-error" role="alert">{apiOrigin.message}</p> : (
        <p className="playground-origin"><strong>Configured API origin:</strong> <code>{apiOrigin.origin}</code> <span>({apiOrigin.source})</span></p>
      )}

      {operations.length === 0 ? <p className="tool-error" role="alert">No documented POST `/v1` operations are available in the OpenAPI contract.</p> : (
        <div className="playground-grid">
          <form className="tool-panel playground-editor" noValidate onSubmit={sendRequest}>
            <label className="field-label" htmlFor="playground-operation">Documented operation</label>
            <select id="playground-operation" value={operationId} disabled={pending} onChange={(event) => updateOperation(event.target.value)}>
              {operations.map((item) => <option key={item.operationId} value={item.operationId}>{item.method} {item.path} — {item.summary}</option>)}
            </select>

            {operation ? <>
              <p className="playground-endpoint"><span className="method-tag method-tag--post">{operation.method}</span> <code>{operation.path}</code></p>
              {operation.description ? <p className="tool-help">{operation.description}</p> : null}
            </> : null}

            <label className="field-label" htmlFor="playground-request">Request JSON <span className="field-label__hint">{validation.bytes.toLocaleString()} / {maxRequestBytes.toLocaleString()} bytes</span></label>
            <textarea
              id="playground-request"
              aria-describedby="playground-json-help playground-json-state"
              aria-invalid={!validation.valid}
              value={requestBody}
              disabled={pending || !apiOrigin.available}
              onChange={(event) => { setRequestBody(event.target.value); setResult(undefined); setIssue(undefined); }}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
            />
            <p className="tool-help" id="playground-json-help">JSON only. Request data is sent only after you activate Send request.</p>
            {!validation.valid ? <p className="tool-error" id="playground-json-state" role="alert">{validation.message}</p> : <p className="tool-feedback" id="playground-json-state" role="status">Valid JSON syntax.</p>}

            <div className="tool-actions">
              <button className="tool-button" type="submit" disabled={pending || !apiOrigin.available || !validation.valid}>Send request</button>
              {pending ? <button className="tool-button tool-button--quiet" type="button" onClick={cancelRequest}>Cancel request</button> : null}
              <button className="tool-button tool-button--quiet" type="button" onClick={reset}>Reset</button>
            </div>
          </form>

          <div className="playground-results">
            <section className="tool-panel" aria-labelledby="playground-result-title">
              <h2 id="playground-result-title">Response</h2>
              {pending ? <p className="tool-feedback" role="status">Request in progress. Requests time out after {API_REQUEST_TIMEOUT_MS / 1000} seconds.</p> : null}
              {issue ? <p className="tool-error" role="alert"><strong>{issue.kind === "network" ? "Network or CORS failure" : issue.kind === "timeout" ? "Request timed out" : issue.kind === "cancelled" ? "Request cancelled" : issue.kind === "response-limit" ? "Response too large" : "Request not sent"}</strong>{issue.status ? ` · HTTP ${issue.status}` : ""}: {issue.message}</p> : null}
              {result ? <>
                <p className={result.ok ? "tool-feedback" : "tool-error"} role="status">HTTP {result.status}{result.statusText ? ` ${result.statusText}` : ""} · {result.ok ? "API response received" : "API returned an error response"}</p>
                {result.requestId ? <p><strong>Request ID:</strong> <code>{result.requestId}</code></p> : null}
                {result.status === 429 ? <p className="tool-error" role="alert">Rate limit reached.{result.retryAfter ? ` Retry after ${result.retryAfter} seconds.` : " The API did not expose a Retry-After value to this browser."}</p> : null}
                {result.invalidJson ? <p className="tool-error" role="alert">The API returned a response labeled as JSON, but its body is not valid JSON.</p> : null}
                <pre className="api-response-body" tabIndex={0} aria-label="API response body"><code>{result.isJson && !result.invalidJson ? JSON.stringify(JSON.parse(result.bodyText), null, 2) : result.bodyText || "(empty response)"}</code></pre>
                {result.bodyText ? <CopyButton value={result.bodyText} label="API response body" /> : null}
              </> : !pending && !issue ? <p className="tool-empty" role="status">No request has been sent. The real HTTP status and response will appear here.</p> : null}
            </section>

            {snippets ? <section className="tool-panel" aria-labelledby="playground-snippets-title">
              <h2 id="playground-snippets-title">Use this request in your application</h2>
              <details><summary>Fetch (TypeScript/JavaScript)</summary><CodeBlock code={snippets.fetch} language="typescript" label="fetch request example" /></details>
              <details><summary>cURL (POSIX shell)</summary><CodeBlock code={snippets.curl} language="shell" label="curl request example" /></details>
            </section> : null}
          </div>
        </div>
      )}
    </section>
  );
}
