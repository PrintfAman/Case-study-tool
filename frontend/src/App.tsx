import { type FormEvent, useEffect, useState } from 'react';
import { BackendStatusPanel } from './components/BackendStatusPanel';
import { Badge } from './components/Badge';
import { DependenciesPanel } from './components/DependenciesPanel';
import { LiveStatusChip } from './components/LiveStatusChip';
import { Panel } from './components/Panel';
import { useApiHealth } from './hooks/useApiHealth';
import { API_BASE_URL } from './services/api-client';
import { createProject, deleteProject, generateProjectReport, getProjectCaseStudy, listProjects, runProjectAnalysis } from './services/project-api';
import type { Project } from './types/projects';

export default function App() {
  const health = useApiHealth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsBusy, setProjectsBusy] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [caseStudy, setCaseStudy] = useState<Record<string, unknown> | null>(null);
  const [analysisBusyId, setAnalysisBusyId] = useState<string | null>(null);
  const [reportBusyId, setReportBusyId] = useState<string | null>(null);

  async function refreshProjects() {
    setProjectsBusy(true);
    setProjectError(null);
    try {
      const result = await listProjects();
      setProjects(result.projects);
    } catch (error) {
      setProjectError(error instanceof Error ? error.message : 'Unable to load projects');
    } finally {
      setProjectsBusy(false);
    }
  }

  useEffect(() => {
    void refreshProjects();
  }, []);

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProjectError(null);
    const form = new FormData(event.currentTarget);
    const formElement = event.currentTarget;
    const name = String(form.get('name') ?? '').trim();
    const websiteUrl = String(form.get('websiteUrl') ?? '').trim() || null;
    const githubUrl = String(form.get('githubUrl') ?? '').trim() || null;

    try {
      const project = await createProject({ name, websiteUrl, githubUrl });
      formElement.reset();
      setProjects((current) => [project, ...current]);
      setActiveProjectId(project.id);
    } catch (error) {
      setProjectError(error instanceof Error ? error.message : 'Unable to create project');
    }
  }

  async function handleDeleteProject(id: string) {
    if (!window.confirm('Delete this project and its case study?')) return;
    try {
      await deleteProject(id);
      setProjects((current) => current.filter((project) => project.id !== id));
      if (activeProjectId === id) {
        setActiveProjectId(null);
        setCaseStudy(null);
      }
    } catch (error) {
      setProjectError(error instanceof Error ? error.message : 'Unable to delete project');
    }
  }

  async function handleAnalysis(id: string) {
    setAnalysisBusyId(id);
    setProjectError(null);
    setActiveProjectId(id);
    setCaseStudy(null);
    try {
      const result = await runProjectAnalysis(id);
      setCaseStudy(result.content);
      await refreshProjects();
    } catch (error) {
      setProjectError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setAnalysisBusyId(null);
    }
  }

  async function handlePreview(id: string) {
    setActiveProjectId(id);
    setProjectError(null);
    try {
      const result = await getProjectCaseStudy(id);
      setCaseStudy(result.content);
    } catch (error) {
      setCaseStudy(null);
      setProjectError(error instanceof Error ? error.message : 'Case study not available yet');
    }
  }

  async function handleReport(id: string) {
    setReportBusyId(id);
    setProjectError(null);
    try {
      const report = await generateProjectReport(id);
      const origin = API_BASE_URL.replace(/\/api\/v1$/, '');
      const response = await fetch(`${origin}${report.downloadUrl}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Unable to download PDF report');
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = report.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setProjectError(error instanceof Error ? error.message : 'Unable to generate report');
    } finally {
      setReportBusyId(null);
    }
  }

  return (
    <div className="tp-web-stage min-h-screen">
      <div className="tp-fx" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1180px] flex-col px-4 py-4 sm:px-6 sm:py-6">
        <nav className="pill-nav" aria-label="Primary navigation">
          <a className="pill-nav__brand" href="/">Case Study Tool</a>
          <a className="nav-link nav-link--active" href="#console">Console</a>
          <a className="nav-link" href="#projects">Projects</a>
          <a className="nav-link" href="#report-preview">Reports</a>
          <LiveStatusChip status={health.status} />
        </nav>

        <main id="console" className="flex flex-1 flex-col py-6 sm:py-8">
          <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="micro-label mb-2">Project analysis console</p><h1 className="display hero-title">Case study workspace</h1></div>
            <Badge tone="outline">Evidence workspace</Badge>
          </header>

          <div className="bento">
            <Panel label="new project" title="Collect analysis sources" variant="hero" className="bento__wide">
              <form className="project-form" onSubmit={(event) => void handleCreateProject(event)}>
                <label>Project name<input name="name" required minLength={2} maxLength={120} placeholder="Example product analysis" /></label>
                <label>Website URL <span>(optional with GitHub)</span><input name="websiteUrl" type="url" placeholder="https://example.com" /></label>
                <label>GitHub repository <span>(optional with website)</span><input name="githubUrl" type="url" placeholder="https://github.com/owner/repository" /></label>
                {projectError ? <p className="form-error" role="alert">{projectError}</p> : null}
                <button className="btn btn--invert" type="submit">Create project</button>
              </form>
            </Panel>

            <Panel id="projects" label="project history" title="Your projects" actions={projectsBusy ? <Badge tone="muted">Loading</Badge> : <Badge tone="outline">{projects.length} projects</Badge>} className="bento__wide">
              {projects.length === 0 && !projectsBusy ? <p className="muted">No projects yet. Create one above to begin analysis.</p> : null}
              {projectsBusy ? <p className="muted">Loading projects...</p> : null}
              <div className="project-list">
                {projects.map((project) => (
                  <article className="project-row" key={project.id}>
                    <div className="project-row__main"><span className="micro-label">{project.status}</span><h3 className="display text-[16px]">{project.name}</h3>{project.websiteUrl ? <a href={project.websiteUrl} target="_blank" rel="noreferrer">{project.websiteUrl}</a> : null}{project.githubUrl ? <a href={project.githubUrl} target="_blank" rel="noreferrer">{project.githubUrl}</a> : null}</div>
                    <div className="project-row__actions"><button className="btn" type="button" disabled={analysisBusyId === project.id} onClick={() => void handleAnalysis(project.id)}>{analysisBusyId === project.id ? 'Analyzing...' : 'Analyze'}</button><button className="btn" type="button" onClick={() => void handlePreview(project.id)}>Preview</button><button className="btn" type="button" disabled={reportBusyId === project.id} onClick={() => void handleReport(project.id)}>{reportBusyId === project.id ? 'Building...' : 'PDF'}</button><button className="btn btn--danger" type="button" onClick={() => void handleDeleteProject(project.id)}>Delete</button></div>
                  </article>
                ))}
              </div>
            </Panel>

            <Panel id="report-preview" label="case study" title="Report preview" actions={activeProjectId ? <Badge tone="outline">Selected project</Badge> : <Badge tone="muted">No selection</Badge>} className="bento__wide">
              {!caseStudy ? <p className="muted">Run an analysis or select Preview from a project to view the case study.</p> : <CaseStudyPreview content={caseStudy} />}
            </Panel>

            <BackendStatusPanel health={health} className="bento__wide" />
            <DependenciesPanel health={health} className="bento__half" />
          </div>
        </main>
        <footer className="footer-line"><span>Case Study Tool</span><span>Frontend / React</span><span>API / Express</span></footer>
      </div>
    </div>
  );
}

function previewText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(previewText).join('\n');
  if (value && typeof value === 'object') return JSON.stringify(value, null, 2);
  if (value == null) return 'Not available';
  return String(value);
}

function CaseStudyPreview({ content }: { content: Record<string, unknown> }) {
  const sections = ['executiveSummary','projectOverview','businessBackground','problemStatement','objectives','websiteAnalysis','technicalArchitecture','technologyStack','repositoryAnalysis','businessModel','targetAudience','marketAnalysis','competitorAnalysis','competitorComparison','businessScope','marketOpportunities','revenueModel','profitabilityAnalysis','risksAndLimitations','swotAnalysis','recommendations','growthStrategy','implementationRoadmap','conclusion'];
  return <div className="report-preview">{sections.map((key) => { const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase()); return <section key={key}><h3>{label}</h3><p>{previewText(content[key])}</p></section>; })}</div>;
}
