import type { FastifyInstance } from "fastify";
import { OPENAPI_SPEC } from "../openapi.js";

const documentationHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Color API reference</title>
  <style>
    body{font:16px/1.5 system-ui,sans-serif;max-width:1100px;margin:2rem auto;padding:0 1rem;color:#18212f}
    h1{margin-bottom:.25rem} .muted{color:#536174} main{display:grid;grid-template-columns:minmax(220px,1fr) 2fr;gap:2rem;margin-top:2rem}
    select,textarea,button{font:inherit;padding:.6rem;width:100%;box-sizing:border-box} textarea{min-height:240px;font:14px/1.45 ui-monospace,monospace}
    button{cursor:pointer;background:#174ea6;color:white;border:0;border-radius:4px;margin:.5rem 0} pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f2f5f9;padding:1rem}
    @media(max-width:700px){main{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <h1>Color API</h1>
  <p class="muted">Interactive reference generated from the <a href="/openapi.json">OpenAPI 3.1 contract</a>. API version 1 is not yet publicly released.</p>
  <main>
    <section><label for="operation">Operation</label><select id="operation"></select><p id="description" class="muted"></p><details><summary>Request schema</summary><pre id="requestSchema"></pre></details><details><summary>Success response schema</summary><pre id="responseSchema"></pre></details><details><summary>Success response examples</summary><pre id="responseExamples"></pre></details><details><summary>Responses and errors</summary><pre id="responseCodes"></pre></details></section>
    <section><label for="example">Request example</label><select id="example"></select><label for="request">JSON request body</label><textarea id="request" spellcheck="false"></textarea><button id="send">Try it</button><h2>Response <span id="status"></span></h2><pre id="response">Choose an operation and send a request.</pre></section>
  </main>
  <script type="module">
    const spec = await (await fetch('/openapi.json')).json();
    const selector = document.querySelector('#operation');
    const request = document.querySelector('#request');
    const description = document.querySelector('#description');
    const response = document.querySelector('#response');
    const status = document.querySelector('#status');
    const exampleSelector = document.querySelector('#example');
    function expandRefs(value, seen = new Set()) {
      if (Array.isArray(value)) return value.map(item => expandRefs(item, seen));
      if (typeof value !== 'object' || value === null) return value;
      if (typeof value.$ref === 'string' && value.$ref.startsWith('#/components/schemas/')) {
        const name = value.$ref.slice('#/components/schemas/'.length);
        if (seen.has(name) || spec.components?.schemas?.[name] === undefined) return { description: 'Unresolved or recursive reference: ' + value.$ref };
        const next = new Set(seen); next.add(name);
        return expandRefs(spec.components.schemas[name], next);
      }
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, expandRefs(item, seen)]));
    }
    const operations = [];
    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        if (!['get', 'post'].includes(method) || path.startsWith('/docs') || path === '/openapi.json') continue;
        operations.push({path, method, operation});
      }
    }
    for (const item of operations) {
      const option = document.createElement('option');
      option.value = String(operations.indexOf(item));
      option.textContent = item.method.toUpperCase() + ' ' + item.path + ' — ' + item.operation.summary;
      selector.append(option);
    }
    function chooseOperation() {
      const item = operations[Number(selector.value)];
      description.textContent = item.operation.description;
      const content = item.operation.requestBody?.content?.['application/json'];
      const entries = [];
      if (content?.example !== undefined) entries.push(['Default example', content.example]);
      for (const [name, example] of Object.entries(content?.examples ?? {})) entries.push([example.summary || name, example.value]);
      exampleSelector.replaceChildren();
      entries.forEach(([label], index) => {
        const option = document.createElement('option');
        option.value = String(index);
        option.textContent = label;
        exampleSelector.append(option);
      });
      exampleSelector.onchange = () => { request.value = JSON.stringify(entries[Number(exampleSelector.value)]?.[1] ?? {}, null, 2); };
      request.value = JSON.stringify(entries[0]?.[1] ?? {}, null, 2);
      document.querySelector('#requestSchema').textContent = JSON.stringify(expandRefs(content?.schema ?? {}), null, 2);
      const successContent = item.operation.responses?.['200']?.content ?? {};
      document.querySelector('#responseSchema').textContent = JSON.stringify(expandRefs(Object.fromEntries(Object.entries(successContent).map(([type, media]) => [type, media.schema]))), null, 2);
      document.querySelector('#responseExamples').textContent = JSON.stringify(expandRefs(Object.fromEntries(Object.entries(successContent).map(([type, media]) => [type, { ...(media.example === undefined ? {} : { example: media.example }), ...(media.examples === undefined ? {} : { examples: media.examples }) }]))), null, 2);
      document.querySelector('#responseCodes').textContent = JSON.stringify(expandRefs(item.operation.responses ?? {}), null, 2);
      status.textContent = '';
    }
    selector.addEventListener('change', chooseOperation);
    document.querySelector('#send').addEventListener('click', async () => {
      const item = operations[Number(selector.value)];
      const init = {method: item.method.toUpperCase(), headers: {}};
      if (item.method === 'post') {
        init.headers['content-type'] = 'application/json';
        try { init.body = JSON.stringify(JSON.parse(request.value)); }
        catch (error) { response.textContent = 'Invalid JSON: ' + error.message; status.textContent = ''; return; }
      }
      try {
        const result = await fetch(item.path, init);
        status.textContent = String(result.status);
        response.textContent = await result.text();
      } catch (error) { response.textContent = error.message; status.textContent = ''; }
    });
    chooseOperation();
  </script>
</body>
</html>`;

export async function documentationRoutes(app: FastifyInstance): Promise<void> {
  app.get("/openapi.json", async (_request, reply) => reply.type("application/json; charset=utf-8").send(OPENAPI_SPEC));
  app.get("/docs", async (_request, reply) => reply.type("text/html; charset=utf-8").send(documentationHtml));
}
