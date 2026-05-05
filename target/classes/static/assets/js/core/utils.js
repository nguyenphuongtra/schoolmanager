export function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function highlightText(text, term) {
  if (!term) {
    return escapeHtml(text);
  }

  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matcher = new RegExp(escapedTerm, 'ig');
  return escapeHtml(text).replace(matcher, function (match) {
    return '<mark>' + match + '</mark>';
  });
}

export async function parseErrorMessage(response, fallback) {
  const contentType = response.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return data.message || data.error || JSON.stringify(data);
    }

    const text = await response.text();
    return text || fallback;
  } catch (error) {
    return fallback;
  }
}

export function parseResponse(data) {
  console.log('[API Response]', data);

  if (data && Array.isArray(data.content)) {
    return {
      items: data.content,
      totalPages: typeof data.totalPages === 'number' ? data.totalPages : 1,
      totalElements: typeof data.totalElements === 'number' ? data.totalElements : data.content.length,
    };
  }

  const wrapperKeys = ['data', 'students', 'items', 'result', 'list'];
  for (const key of wrapperKeys) {
    if (data && Array.isArray(data[key])) {
      const items = data[key];
      return {
        items: items,
        totalPages: data.totalPages || data.total_pages || 1,
        totalElements: data.totalElements || data.total || items.length,
      };
    }
  }

  if (Array.isArray(data)) {
    return {
      items: data,
      totalPages: 1,
      totalElements: data.length,
    };
  }

  console.warn('[API] Cấu trúc JSON không nhận diện được:', data);
  return { items: [], totalPages: 0, totalElements: 0 };
}
