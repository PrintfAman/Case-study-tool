const base = 'http://localhost:5000/api/v1';
const cookieJar = [];

async function request(path, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers ?? {}) };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (cookieJar.length) headers.Cookie = cookieJar.join('; ');
  const response = await fetch(`${base}${path}`, { ...options, headers });
  const setCookie = response.headers.getSetCookie?.() ?? [];
  for (const cookie of setCookie) cookieJar.push(cookie.split(';')[0]);
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  console.log(`${options.method ?? 'GET'} ${path} -> ${response.status}`);
  console.log(JSON.stringify(body));
  return { response, body };
}

await request('/auth/register', {
  method: 'POST',
  body: JSON.stringify({ name: 'Audit User', email: 'audit2@example.com', password: 'TestPassword123!' }),
});
await request('/auth/me');
const project = await request('/projects/', {
  method: 'POST',
  body: JSON.stringify({ name: 'Example Project', websiteUrl: 'https://example.com', githubUrl: 'https://github.com/microsoft/vscode' }),
});
const projectId = project.body?.data?.id;
if (projectId) {
  await request(`/projects/${projectId}`);
  await request(`/analysis/projects/${projectId}/case-study`);
}
