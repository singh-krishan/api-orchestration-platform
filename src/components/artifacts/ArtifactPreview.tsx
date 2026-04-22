import type { Artifact } from '@/types';

/** Lightweight syntax tinting without a full highlighter. */
function tokenize(content: string, type: Artifact['type']): string {
  // For now keep as plain text — browsers render fine; the data itself is readable.
  // We wrap keywords / keys with span class in the component render instead.
  return content;
}

function highlightLine(line: string, type: Artifact['type']): React.ReactNode {
  if (type === 'yaml') {
    // key: value
    const m = line.match(/^(\s*)([\w-]+)(:)(\s*)(.*)$/);
    if (m) {
      return (
        <>
          <span>{m[1]}</span>
          <span className="text-sky-300">{m[2]}</span>
          <span className="text-slate-500">{m[3]}</span>
          <span>{m[4]}</span>
          <span className="text-emerald-300">{m[5]}</span>
        </>
      );
    }
    // list marker
    if (/^\s*-\s/.test(line)) {
      const idx = line.indexOf('-');
      return (
        <>
          <span>{line.slice(0, idx)}</span>
          <span className="text-slate-500">-</span>
          <span className="text-emerald-300">{line.slice(idx + 1)}</span>
        </>
      );
    }
  }
  if (type === 'json') {
    // "key": value
    return line.split(/("(?:\\.|[^"\\])*")/g).map((chunk, i) => {
      if (/^"/.test(chunk)) {
        // colored differently if looks like a key (followed by colon after whitespace downstream)
        return (
          <span key={i} className="text-sky-300">
            {chunk}
          </span>
        );
      }
      // numbers / keywords
      return (
        <span key={i}>
          {chunk.split(/(\b(?:true|false|null|\d+(?:\.\d+)?)\b)/g).map((c, j) =>
            /^(true|false|null|\d+(\.\d+)?)$/.test(c) ? (
              <span key={j} className="text-amber-300">
                {c}
              </span>
            ) : (
              <span key={j}>{c}</span>
            )
          )}
        </span>
      );
    });
  }
  if (type === 'java') {
    return line.split(
      /(\b(?:public|private|class|void|return|new|import|package|static|final|if|else|@Test|@RestController|@RequestMapping|@GetMapping|@PostMapping|@PathVariable|@RequestBody|@Valid|@Autowired|@MockBean|@WebMvcTest|@PreAuthorize)\b)/g
    ).map((c, i) =>
      /^@/.test(c) ? (
        <span key={i} className="text-cyan-300">{c}</span>
      ) : /^(public|private|class|void|return|new|import|package|static|final|if|else)$/.test(c) ? (
        <span key={i} className="text-violet-300">{c}</span>
      ) : (
        <span key={i}>{c}</span>
      )
    );
  }
  if (type === 'markdown') {
    if (/^#{1,6}\s/.test(line)) {
      return <span className="text-cyan-300 font-semibold">{line}</span>;
    }
    if (/^\*\*/.test(line)) {
      return <span className="text-slate-100 font-semibold">{line}</span>;
    }
    if (/^>/.test(line)) {
      return <span className="text-amber-300">{line}</span>;
    }
  }
  return line;
}

export function ArtifactPreview({ artifact }: { artifact: Artifact }) {
  const lines = artifact.content.split('\n');
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
        <div>
          <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-100">
            <span className="font-mono">{artifact.name}</span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
              {artifact.type}
            </span>
          </div>
          <div className="mt-0.5 text-[11.5px] text-slate-400">{artifact.description}</div>
        </div>
      </div>
      <pre className="flex-1 overflow-auto px-4 py-3 font-mono text-[11.5px] leading-relaxed text-slate-300">
        <code>
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="mr-3 w-7 shrink-0 select-none text-right text-slate-600">{i + 1}</span>
              <span className="whitespace-pre">{highlightLine(line, artifact.type)}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
