"use client";

import { CopyButton } from "@/features/shared/color-results";

type CodeLanguage = "json" | "typescript" | "shell";
type CodeToken = { text: string; kind?: "key" | "string" | "number" | "literal" | "keyword" | "comment" };

function tokenize(code: string, language: CodeLanguage): CodeToken[] {
  const pattern = language === "json"
    ? /("(?:\\.|[^"\\])*")(?=\s*:)|("(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g
    : /(\/\/[^\r\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:import|from|export|const|let|function|return|try|catch|throw|if|else|new|type|await|async)\b|\b\d+(?:\.\d+)?\b)/g;
  const tokens: CodeToken[] = [];
  let position = 0;
  for (const match of code.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > position) tokens.push({ text: code.slice(position, index) });
    const text = match[0];
    const kind = language === "json"
      ? match[1] !== undefined ? "key" : text.startsWith('"') ? "string" : /^(true|false|null)$/.test(text) ? "literal" : "number"
      : text.startsWith("//") ? "comment"
        : /^(import|from|export|const|let|function|return|try|catch|throw|if|else|new|type|await|async)$/.test(text) ? "keyword"
          : /^\d/.test(text) ? "number" : "string";
    tokens.push({ text, kind });
    position = index + text.length;
  }
  if (position < code.length) tokens.push({ text: code.slice(position) });
  return tokens;
}

export function CodeBlock({ code, language, label }: { code: string; language: CodeLanguage; label: string }) {
  return (
    <div className="code-block">
      <div className="code-block__toolbar"><span>{language === "typescript" ? "TypeScript" : language === "json" ? "JSON" : "Shell"}</span><CopyButton value={code} label={label} /></div>
      <pre tabIndex={0} aria-label={`${label} code`}><code className={`language-${language}`}>{tokenize(code, language).map((token, index) => token.kind
        ? <span className={`code-token code-token--${token.kind}`} key={index}>{token.text}</span>
        : token.text)}</code></pre>
    </div>
  );
}
