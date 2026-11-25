import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { env } from '../config/env';

function text(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return 'Not available';
  if (Array.isArray(value)) return value.map((item) => text(item)).join('\n');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

export async function createPdfReport(projectName: string, content: Record<string, unknown>): Promise<{ path: string; fileName: string }> {
  const outputDir = resolve(env.REPORT_STORAGE_DIR);
  mkdirSync(outputDir, { recursive: true });
  const fileName = `${projectName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'case-study'}-${Date.now()}.pdf`;
  const path = join(outputDir, fileName);

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const size = 10;
  let page = pdf.addPage([595.28, 841.89]);
  const margin = 54;
  const bottom = 54;
  let y = 790;

  const footer = (index: number, total: number) => {
    page.drawText(`Case Study Tool  |  Confidential`, { x: margin, y: 28, size: 8, font, color: rgb(0.35, 0.35, 0.35) });
    page.drawText(`${index + 1} / ${total}`, { x: 525, y: 28, size: 8, font, color: rgb(0.35, 0.35, 0.35) });
  };

  const ensureSpace = (lines: number, height = 14) => {
    if (y - lines * height < bottom) {
      page = pdf.addPage([595.28, 841.89]);
      y = 790;
    }
  };

  const drawWrapped = (value: string, currentSize = size, style = font, indent = 0) => {
    const maxWidth = 487 - indent;
    for (const paragraph of value.split('\n')) {
      const words = paragraph.split(/\s+/).filter(Boolean);
      let line = '';
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (style.widthOfTextAtSize(candidate, currentSize) > maxWidth) {
          ensureSpace(1);
          page.drawText(line, { x: margin + indent, y, size: currentSize, font: style });
          y -= 14;
          line = word;
        } else {
          line = candidate;
        }
      }
      if (line) {
        ensureSpace(1);
        page.drawText(line, { x: margin + indent, y, size: currentSize, font: style });
        y -= 14;
      }
    }
  };

  page.drawText(projectName, { x: margin, y, size: 24, font: bold });
  y -= 38;
  page.drawText('Professional Case Study Report', { x: margin, y, size: 14, font });
  y -= 28;
  page.drawText(`Generated ${new Date().toLocaleDateString()}`, { x: margin, y, size: 9, font, color: rgb(0.35, 0.35, 0.35) });
  y -= 42;

  const sections: Array<[string, string]> = [
    ['Table of Contents', ''],
    ['Executive Summary', text(content.executiveSummary)],
    ['Project Overview', text(content.projectOverview)],
    ['Business Background', text(content.businessBackground)],
    ['Problem Statement', text(content.problemStatement)],
    ['Objectives', text(content.objectives)],
    ['Website Analysis', text(content.websiteAnalysis)],
    ['Technical Architecture', text(content.technicalArchitecture)],
    ['Technology Stack', text(content.technologyStack)],
    ['Repository Analysis', text(content.repositoryAnalysis)],
    ['Business Model', text(content.businessModel)],
    ['Target Audience', text(content.targetAudience)],
    ['Market Analysis', text(content.marketAnalysis)],
    ['Competitor Analysis', text(content.competitorAnalysis)],
    ['Competitor Comparison', text(content.competitorComparison)],
    ['Business Scope', text(content.businessScope)],
    ['Market Opportunities', text(content.marketOpportunities)],
    ['Revenue Model', text(content.revenueModel)],
    ['Profitability Analysis', text(content.profitabilityAnalysis)],
    ['Risks and Limitations', text(content.risksAndLimitations)],
    ['SWOT Analysis', text(content.swotAnalysis)],
    ['Recommendations', text(content.recommendations)],
    ['Growth Strategy', text(content.growthStrategy)],
    ['Implementation Roadmap', text(content.implementationRoadmap)],
    ['Conclusion', text(content.conclusion)],
  ];

  const tocNames = sections.slice(1).map(([title]) => title);
  for (const title of tocNames) {
    ensureSpace(1);
    page.drawText(title, { x: margin + 12, y, size: 9, font });
    y -= 16;
  }

  for (const [title, body] of sections.slice(1)) {
    ensureSpace(3);
    page.drawText(title, { x: margin, y, size: 15, font: bold, color: rgb(0.1, 0.1, 0.1) });
    y -= 24;
    drawWrapped(body);
    y -= 20;
  }

  const pages = pdf.getPages();
  pages.forEach((currentPage, index) => {
    page = currentPage;
    footer(index, pages.length);
  });

  writeFileSync(path, await pdf.save());
  return { path, fileName };
}
