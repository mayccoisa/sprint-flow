/**
 * Conversor minimalista Markdown → ADF (Atlassian Document Format v1).
 */

type AdfNode = Record<string, unknown>;

interface InlineMark {
  type: 'strong' | 'em' | 'code' | 'link';
  attrs?: Record<string, unknown>;
}

interface InlineToken {
  text: string;
  marks: InlineMark[];
}

const MAX_TEXT = 30000;

export function markdownToAdf(md: string): AdfNode {
  const source = (md ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = source.split('\n');
  const blocks: AdfNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      i++;
      continue;
    }

    const fence = line.match(/^```(\w+)?\s*$/);
    if (fence) {
      const language = fence[1] ?? '';
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({
        type: 'codeBlock',
        ...(language ? { attrs: { language } } : {}),
        content: [{ type: 'text', text: buf.join('\n') }],
      });
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      blocks.push({
        type: 'heading',
        attrs: { level },
        content: renderInlines(heading[2].trim()),
      });
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({
        type: 'blockquote',
        content: [{ type: 'paragraph', content: renderInlines(buf.join(' ')) }],
      });
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push({ type: 'rule' });
      i++;
      continue;
    }

    if (isListLine(line)) {
      const { node, consumed } = parseList(lines, i);
      blocks.push(node);
      i += consumed;
      continue;
    }

    const paraBuf: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^#{1,6}\s+/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !isListLine(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i])
    ) {
      paraBuf.push(lines[i]);
      i++;
    }
    blocks.push({
      type: 'paragraph',
      content: renderInlines(paraBuf.join(' ')),
    });
  }

  if (blocks.length === 0) {
    blocks.push({ type: 'paragraph', content: [] });
  }

  return { version: 1, type: 'doc', content: blocks };
}

function isListLine(line: string): boolean {
  return /^(\s*)([-*+]|\d+\.)\s+/.test(line);
}

function parseListLine(line: string): { indent: number; ordered: boolean; rest: string } | null {
  const m = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
  if (!m) return null;
  return {
    indent: m[1].length,
    ordered: /\d+\./.test(m[2]),
    rest: m[3],
  };
}

interface ListResult {
  node: AdfNode;
  consumed: number;
}

function parseList(lines: string[], start: number): ListResult {
  const first = parseListLine(lines[start])!;
  const baseIndent = first.indent;
  const ordered = first.ordered;
  const items: AdfNode[] = [];
  let i = start;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') {
      i++;
      continue;
    }
    const parsed = parseListLine(line);
    if (!parsed || parsed.indent < baseIndent) break;
    if (parsed.indent > baseIndent) {
      const sub = parseList(lines, i);
      const last = items[items.length - 1];
      if (last) {
        const content = (last.content as AdfNode[]) ?? [];
        content.push(sub.node);
        last.content = content;
      }
      i += sub.consumed;
      continue;
    }
    if (parsed.ordered !== ordered) break;

    items.push({
      type: 'listItem',
      content: [{ type: 'paragraph', content: renderInlines(parsed.rest) }],
    });
    i++;
  }

  return {
    node: { type: ordered ? 'orderedList' : 'bulletList', content: items },
    consumed: i - start,
  };
}

function renderInlines(text: string): AdfNode[] {
  if (!text) return [];
  let tokens: InlineToken[] = [{ text: text.slice(0, MAX_TEXT), marks: [] }];

  tokens = applyInline(tokens, /`([^`]+)`/g, () => [{ type: 'code' }]);
  tokens = applyInline(
    tokens,
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_full, _label, href) => [{ type: 'link', attrs: { href } }],
    (_full, label) => label,
  );
  tokens = applyInline(tokens, /\*\*([^*]+)\*\*/g, () => [{ type: 'strong' }]);
  tokens = applyInline(tokens, /__([^_]+)__/g, () => [{ type: 'strong' }]);
  tokens = applyInline(tokens, /(?<!\*)\*([^*\n]+)\*(?!\*)/g, () => [{ type: 'em' }]);
  tokens = applyInline(tokens, /(?<![A-Za-z0-9_])_([^_\n]+)_(?![A-Za-z0-9_])/g, () => [{ type: 'em' }]);

  return tokens
    .filter((t) => t.text.length > 0)
    .map((t) => {
      const node: AdfNode = { type: 'text', text: t.text };
      if (t.marks.length) node.marks = t.marks;
      return node;
    });
}

function applyInline(
  tokens: InlineToken[],
  pattern: RegExp,
  marksFor: (full: string, ...groups: string[]) => InlineMark[],
  innerTextFor: (full: string, ...groups: string[]) => string = (_full, inner) => inner,
): InlineToken[] {
  const out: InlineToken[] = [];
  for (const token of tokens) {
    if (token.marks.some((m) => m.type === 'code')) {
      out.push(token);
      continue;
    }
    pattern.lastIndex = 0;
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    let any = false;
    while ((m = pattern.exec(token.text)) !== null) {
      any = true;
      if (m.index > lastIndex) {
        out.push({ text: token.text.slice(lastIndex, m.index), marks: token.marks });
      }
      const newMarks = marksFor(m[0], ...m.slice(1));
      const innerText = innerTextFor(m[0], ...m.slice(1));
      out.push({ text: innerText, marks: [...token.marks, ...newMarks] });
      lastIndex = m.index + m[0].length;
      if (m[0].length === 0) pattern.lastIndex++;
    }
    if (any) {
      if (lastIndex < token.text.length) {
        out.push({ text: token.text.slice(lastIndex), marks: token.marks });
      }
    } else {
      out.push(token);
    }
  }
  return out;
}
