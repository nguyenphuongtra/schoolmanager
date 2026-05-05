export function buildAuthHeaders(authState, extraHeaders) {
  const headers = Object.assign({}, extraHeaders || {});

  if (authState && authState.token) {
    headers.Authorization = 'Bearer ' + authState.token;
  }

  return headers;
}

export async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  return { response, data };
}
