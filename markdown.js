(() => {
    const content = document.querySelector('.post-content[data-markdown]');
    if (!content) return;

    const source = content.getAttribute('data-markdown');
    if (!source) return;

    const titleEl = document.querySelector('.post-title');
    const dateEl = document.querySelector('.post-date');

    fetch(source)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to load markdown: ${response.status}`);
            }
            return response.text();
        })
        .then((raw) => {
            const { metadata, body } = extractFrontMatter(raw);
            const heading = findFirstHeading(body);

            if (metadata.title && titleEl) titleEl.textContent = metadata.title;
            if (!metadata.title && heading && titleEl) titleEl.textContent = heading.text;
            if (metadata.date && dateEl) dateEl.textContent = metadata.date;

            const resolvedTitle = metadata.title || (heading ? heading.text : '');
            if (resolvedTitle) {
                document.title = `${resolvedTitle} | Ryan N`;
            }

            const cleanedBody = heading ? body.replace(heading.pattern, '').trim() : body.trim();
            content.innerHTML = renderMarkdown(cleanedBody);
        })
        .catch((error) => {
            content.innerHTML = '<p>Unable to load this post right now.</p>';
            console.error(error);
        });

    function extractFrontMatter(raw) {
        const frontMatterMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
        if (!frontMatterMatch) return { metadata: {}, body: raw };

        const block = frontMatterMatch[1];
        const metadata = {};

        block.split(/\r?\n/).forEach((line) => {
            const separatorIndex = line.indexOf(':');
            if (separatorIndex === -1) return;

            const key = line.slice(0, separatorIndex).trim().toLowerCase();
            const value = line.slice(separatorIndex + 1).trim();

            if (key) metadata[key] = value;
        });

        const body = raw.slice(frontMatterMatch[0].length);
        return { metadata, body };
    }

    function findFirstHeading(body) {
        const match = body.match(/^#\s+(.+)$/m);
        if (!match) return null;
        return { text: match[1].trim(), pattern: match[0] };
    }

    function renderMarkdown(text) {
        if (window.marked && typeof window.marked.parse === 'function') {
            return window.marked.parse(text);
        }

        return `<pre>${escapeHtml(text)}</pre>`;
    }

    function escapeHtml(value) {
        return value.replace(/[&<>"']/g, (char) => {
            switch (char) {
                case '&':
                    return '&amp;';
                case '<':
                    return '&lt;';
                case '>':
                    return '&gt;';
                case '"':
                    return '&quot;';
                case "'":
                    return '&#39;';
                default:
                    return char;
            }
        });
    }
})();
