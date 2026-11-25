const base = 'http://localhost:5000/api/v1';
let cookie = '';

async function request(path, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers ?? {}) };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (cookie) headers.Cookie = cookie;
  const response = await fetch(`${base}${path}`, { ...options, headers });
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { response, body };
}

const email = `live${Date.now()}@example.com`;
await request('/auth/register', { method: 'POST', body: JSON.stringify({ name: 'Live Test', email, password: 'TestPassword123!' }) });
const projectResult = await request('/projects/', { method: 'POST', body: JSON.stringify({ name: 'Live External Analysis', websiteUrl: 'https://example.com', githubUrl: 'https://github.com/microsoft/vscode' }) });
if (!projectResult.body.success) {
  console.log(JSON.stringify(projectResult));
  process.exit(1);
}

const projectId = projectResult.body.data.id;
console.log(`Project ${projectId}`);
const analysis = await request(`/analysis/projects/${projectId}/analyze`, { method: 'POST' });
console.log(`Analysis HTTP ${analysis.response.status}`);
console.log(JSON.stringify(analysis.body).slice(0, 4000));

if (analysis.body.success) {
  const report = await request(`/reports/projects/${projectId}/report`, { method: 'POST' });
  console.log(`Report HTTP ${report.response.status}`);
  console.log(JSON.stringify(report.body));
}
