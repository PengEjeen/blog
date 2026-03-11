export const humanize = (value = '') => value.replace(/_/g, ' ');

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

const renderInlineMarkdown = (value = '') => {
  const escaped = escapeHtml(value);

  return escaped
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
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
      html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      codeFence = false;
      codeLines = [];
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
      html.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
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

  return html.replace(/<img src="([^"]+)" alt="([^"]*)" \/>/g, (full, src, alt) => {
    if (!src.startsWith('./') && !src.startsWith('../')) {
      return full;
    }

    const normalizedPath = decodeURIComponent(
      new URL(src, `https://local/${directory}`).pathname.slice(1),
    );
    const key = `../../${normalizedPath}`;
    const resolved = assetMap[key];

    if (!resolved) {
      return full;
    }

    return `<img src="${resolved}" alt="${alt}" />`;
  });
};
