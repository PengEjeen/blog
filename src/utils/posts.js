export const humanize = (value = '') => value.replace(/_/g, ' ');

let _indexCache = null;

const POSTS_GLOB = import.meta.glob('../../content/posts/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

export const getPostsIndex = () => {
  if (_indexCache) return _indexCache;

  const categories = new Map();
  const ensureCategory = (cat) => {
    if (!categories.has(cat)) categories.set(cat, { slug: cat, count: 0, subs: new Map() });
    return categories.get(cat);
  };

  const posts = [];
  for (const [path, raw] of Object.entries(POSTS_GLOB)) {
    const parts = path.split('/posts/')[1]?.split('/') || [];
    if (parts.length < 3) continue;
    const [cat, sub, fileName] = [parts[0], parts[1], parts[parts.length - 1]];
    const { data, content } = extractFrontmatter(raw);
    const slug = getPostSlugFromFileName(fileName);
    const dateRaw = data.date || data.created || data.updated || '';
    const cEntry = ensureCategory(cat);
    cEntry.count += 1;
    if (!cEntry.subs.has(sub)) cEntry.subs.set(sub, { slug: sub, count: 0 });
    cEntry.subs.get(sub).count += 1;
    posts.push({
      path,
      cat,
      sub,
      slug,
      fileName,
      title: data.title || getPostTitleFromFileName(fileName),
      dateRaw,
      dateLabel: formatPostDate(dateRaw),
      excerpt: content.slice(0, 280),
      searchHay: `${data.title || ''} ${cat} ${sub} ${content.slice(0, 1500)}`.toLowerCase(),
    });
  }

  posts.sort((a, b) => {
    const da = new Date(a.dateRaw).getTime();
    const db = new Date(b.dateRaw).getTime();
    if (Number.isNaN(da) && Number.isNaN(db)) return 0;
    if (Number.isNaN(da)) return 1;
    if (Number.isNaN(db)) return -1;
    return db - da;
  });

  _indexCache = {
    categories: Array.from(categories.values())
      .map((c) => ({ slug: c.slug, count: c.count, subs: Array.from(c.subs.values()) }))
      .sort((a, b) => a.slug.localeCompare(b.slug, 'ko')),
    posts,
    total: posts.length,
  };
  return _indexCache;
};

export const searchPosts = (query, limit = 8) => {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  const { posts } = getPostsIndex();
  const scored = [];
  for (const post of posts) {
    let score = 0;
    let matched = true;
    for (const token of tokens) {
      const inTitle = post.title.toLowerCase().includes(token);
      const inHay = post.searchHay.includes(token);
      if (!inTitle && !inHay) { matched = false; break; }
      if (inTitle) score += 4;
      if (inHay) score += 1;
    }
    if (matched) scored.push({ post, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.post);
};

export const sortByNumericPrefix = (a, b) => {
  const matchA = a.match(/^(\d+)/);
  const matchB = b.match(/^(\d+)/);

  if (matchA && matchB) {
    return Number(matchA[1]) - Number(matchB[1]);
  }

  return a.localeCompare(b, 'ko');
};

export const getPostSlugFromFileName = (fileName = '') => fileName.replace(/\.md$/, '');

export const getPostTitleFromFileName = (fileName = '') => humanize(getPostSlugFromFileName(fileName));

export const extractFrontmatter = (raw = '') => {
  if (!raw.startsWith('---\n')) {
    return { data: {}, content: raw.trim() };
  }

  const endIndex = raw.indexOf('\n---\n', 4);

  if (endIndex === -1) {
    return { data: {}, content: raw.trim() };
  }

  const frontmatter = raw.slice(4, endIndex).trim();
  const content = raw.slice(endIndex + 5).trim();
  const data = {};

  frontmatter.split('\n').forEach((line) => {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);

    if (match) {
      data[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  });

  return { data, content };
};

export const formatPostDate = (date) => {
  if (!date) {
    return '날짜 미정';
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString('ko-KR');
};

const escapeHtml = (value = '') => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const LANGUAGE_ALIASES = {
  py: 'python',
  js: 'javascript',
  ts: 'typescript',
  sh: 'bash',
  shell: 'bash',
  yml: 'yaml',
};

const normalizeLanguage = (language = '') => {
  const normalized = language.trim().toLowerCase();
  return LANGUAGE_ALIASES[normalized] || normalized;
};

const highlightWithRules = (code = '', rules = []) => {
  if (!code) {
    return '';
  }

  const tokens = [];
  let output = '';
  let cursor = 0;
  let tokenIndex = 0;

  while (cursor < code.length) {
    let best = null;

    rules.forEach(({ type, regex }) => {
      regex.lastIndex = cursor;
      const match = regex.exec(code);

      if (!match) {
        return;
      }

      const candidate = {
        type,
        index: match.index,
        value: match[0],
      };

      if (
        !best
        || candidate.index < best.index
        || (candidate.index === best.index && candidate.value.length > best.value.length)
      ) {
        best = candidate;
      }
    });

    if (!best || best.index !== cursor) {
      output += escapeHtml(code[cursor]);
      cursor += 1;
      continue;
    }

    const placeholder = `__TOKEN_${tokenIndex}__`;
    tokens.push(`<span class="token ${best.type}">${escapeHtml(best.value)}</span>`);
    output += placeholder;
    tokenIndex += 1;
    cursor = best.index + best.value.length;
  }

  return tokens.reduce(
    (highlighted, token, index) => highlighted.replace(`__TOKEN_${index}__`, token),
    output,
  );
};

const HIGHLIGHT_RULES = {
  python: [
    { type: 'comment', regex: /#.*/gy },
    { type: 'string', regex: /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/gy },
    { type: 'keyword', regex: /\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|False|finally|for|from|if|import|in|is|lambda|None|nonlocal|not|or|pass|raise|return|True|try|while|with|yield)\b/gy },
    { type: 'number', regex: /\b\d+(?:\.\d+)?\b/gy },
    { type: 'operator', regex: /[-+*/%=<>!&|^~:]+/gy },
  ],
  javascript: [
    { type: 'comment', regex: /\/\/.*|\/\*[\s\S]*?\*\//gy },
    { type: 'string', regex: /`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/gy },
    { type: 'keyword', regex: /\b(?:async|await|break|case|catch|class|const|continue|default|delete|do|else|export|extends|false|finally|for|function|if|import|in|instanceof|let|new|null|return|switch|this|throw|true|try|typeof|var|void|while|with|yield)\b/gy },
    { type: 'number', regex: /\b\d+(?:\.\d+)?\b/gy },
    { type: 'operator', regex: /[-+*/%=<>!&|^~?:]+/gy },
  ],
  typescript: [
    { type: 'comment', regex: /\/\/.*|\/\*[\s\S]*?\*\//gy },
    { type: 'string', regex: /`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/gy },
    { type: 'keyword', regex: /\b(?:abstract|any|as|async|await|boolean|break|case|catch|class|const|continue|declare|default|delete|do|else|enum|export|extends|false|finally|for|function|if|implements|import|in|infer|instanceof|interface|keyof|let|module|namespace|never|new|null|number|private|protected|public|readonly|return|static|string|super|switch|this|throw|true|try|type|typeof|undefined|var|void|while|with|yield)\b/gy },
    { type: 'number', regex: /\b\d+(?:\.\d+)?\b/gy },
    { type: 'operator', regex: /[-+*/%=<>!&|^~?:]+/gy },
  ],
  bash: [
    { type: 'comment', regex: /#.*/gy },
    { type: 'string', regex: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/gy },
    { type: 'keyword', regex: /\b(?:if|then|else|fi|for|in|do|done|case|esac|while|until|function|return)\b/gy },
    { type: 'variable', regex: /\$[{(]?[A-Za-z_][A-Za-z0-9_]*[)}]?/gy },
    { type: 'number', regex: /\b\d+\b/gy },
  ],
  json: [
    { type: 'string', regex: /"(?:\\.|[^"\\])*"(?=\s*:)/gy },
    { type: 'string', regex: /"(?:\\.|[^"\\])*"/gy },
    { type: 'number', regex: /\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/gy },
    { type: 'keyword', regex: /\b(?:true|false|null)\b/gy },
  ],
  yaml: [
    { type: 'comment', regex: /#.*/gy },
    { type: 'string', regex: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/gy },
    { type: 'keyword', regex: /^\s*[^:\n]+(?=:)/gmy },
    { type: 'number', regex: /\b\d+(?:\.\d+)?\b/gy },
    { type: 'keyword', regex: /\b(?:true|false|null)\b/gy },
  ],
};

const highlightCodeBlock = (code = '', language = '') => {
  const normalizedLanguage = normalizeLanguage(language);
  const rules = HIGHLIGHT_RULES[normalizedLanguage];

  if (!rules || !code.trim()) {
    return escapeHtml(code);
  }

  return highlightWithRules(code, rules);
};

const renderInlineMarkdown = (value = '') => {
  const escaped = escapeHtml(value);

  return escaped
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" decoding="async" />')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
};

export const slugify = (value = '') =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}\s-]+/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const buildHeadingHtml = (level, rawText) => {
  const id = slugify(rawText) || `h${level}-${Math.random().toString(36).slice(2, 7)}`;
  const inner = renderInlineMarkdown(rawText);
  return `<h${level} id="${id}" class="markdown-heading"><a href="#${id}" class="markdown-anchor" aria-label="섹션 링크">#</a>${inner}</h${level}>`;
};

const isTableSeparatorRow = (line = '') => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);

const parseTableRow = (line = '') => {
  const normalized = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return normalized.split('|').map((cell) => cell.trim());
};

export const markdownToHtml = (raw = '') => {
  const { content } = extractFrontmatter(raw);
  const lines = content.split('\n');
  const html = [];
  let paragraph = [];
  let listType = null;
  let listItems = [];
  let codeFence = false;
  let codeLines = [];
  let codeLanguage = '';

  const closeParagraph = () => {
    if (paragraph.length > 0) {
      html.push(`<p>${renderInlineMarkdown(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };

  const closeList = () => {
    if (listType && listItems.length > 0) {
      html.push(`<${listType}>${listItems.join('')}</${listType}>`);
    }

    listType = null;
    listItems = [];
  };

  const closeCodeBlock = () => {
    if (codeFence) {
      const normalizedLanguage = normalizeLanguage(codeLanguage);
      const languageClass = normalizedLanguage ? ` class="language-${normalizedLanguage}"` : '';
      const rawCode = codeLines.join('\n');
      const highlightedCode = highlightCodeBlock(rawCode, normalizedLanguage);
      const langTag = normalizedLanguage
        ? `<span class="codeblock-lang">${escapeHtml(normalizedLanguage)}</span>`
        : '';
      const encoded = escapeHtml(rawCode);
      html.push(
        `<div class="codeblock" data-code="${encoded}">`
        + `<div class="codeblock-toolbar">${langTag}<button type="button" class="codeblock-copy" data-copy aria-label="코드 복사">Copy</button></div>`
        + `<pre><code${languageClass}>${highlightedCode}</code></pre>`
        + '</div>',
      );
      codeFence = false;
      codeLines = [];
      codeLanguage = '';
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.startsWith('```')) {
      closeParagraph();
      closeList();

      if (codeFence) {
        closeCodeBlock();
      } else {
        codeFence = true;
        codeLanguage = line.slice(3).trim();
      }

      continue;
    }

    if (codeFence) {
      codeLines.push(line);
      continue;
    }

    const nextLine = lines[index + 1] || '';
    const isTableHead = line.includes('|') && isTableSeparatorRow(nextLine);

    if (isTableHead) {
      closeParagraph();
      closeList();

      const headers = parseTableRow(line);
      const bodyRows = [];
      index += 2;

      while (index < lines.length) {
        const rowLine = lines[index];

        if (!rowLine.trim() || !rowLine.includes('|')) {
          index -= 1;
          break;
        }

        bodyRows.push(parseTableRow(rowLine));
        index += 1;
      }

      const headerHtml = headers.map((cell) => `<th>${renderInlineMarkdown(cell)}</th>`).join('');
      const bodyHtml = bodyRows.map(
        (cells) => `<tr>${cells.map((cell) => `<td>${renderInlineMarkdown(cell)}</td>`).join('')}</tr>`,
      ).join('');

      html.push(`<table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`);
      continue;
    }

    if (!line.trim()) {
      closeParagraph();
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);

    if (heading) {
      closeParagraph();
      closeList();
      const level = heading[1].length;
      html.push(buildHeadingHtml(level, heading[2]));
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      closeParagraph();
      closeList();
      html.push('<hr />');
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);

    if (quote) {
      closeParagraph();
      closeList();
      html.push(`<blockquote><p>${renderInlineMarkdown(quote[1])}</p></blockquote>`);
      continue;
    }

    const unordered = line.match(/^[-*+]\s+(.*)$/);
    const ordered = line.match(/^\d+\.\s+(.*)$/);

    if (unordered || ordered) {
      closeParagraph();
      const nextType = unordered ? 'ul' : 'ol';

      if (listType && listType !== nextType) {
        closeList();
      }

      listType = nextType;
      listItems.push(`<li>${renderInlineMarkdown((unordered || ordered)[1])}</li>`);
      continue;
    }

    closeList();
    paragraph.push(line.trim());
  }

  closeParagraph();
  closeList();
  closeCodeBlock();

  return html.join('\n');
};

export const resolveMarkdownAssetUrls = (html = '', markdownPath = '', assetMap = {}) => {
  if (!html || !markdownPath) {
    return html;
  }

  const directory = markdownPath.slice(0, markdownPath.lastIndexOf('/') + 1);

  return html.replace(/<img\s+([^>]*?)\s*\/?>/g, (full, attrs) => {
    const srcMatch = attrs.match(/\bsrc="([^"]+)"/);
    if (!srcMatch) return full;
    const src = srcMatch[1];
    if (!src.startsWith('./') && !src.startsWith('../')) {
      return full;
    }

    let normalizedPath;
    try {
      normalizedPath = decodeURIComponent(
        new URL(src, `https://local/${directory}`).pathname.slice(1),
      );
    } catch {
      return full;
    }
    const key = `../../${normalizedPath}`;
    const resolved = assetMap[key];

    if (!resolved) {
      return full;
    }

    const newAttrs = attrs.replace(/\bsrc="[^"]+"/, `src="${resolved}"`);
    return `<img ${newAttrs} />`;
  });
};
