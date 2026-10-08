import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  FileText,
  Download,
  Award,
  Briefcase,
  GraduationCap,
  Code2,
  FileSpreadsheet,
  CheckCircle2,
  Plus,
  Trash2,
  FolderGit2,
} from 'lucide-react';

interface AtsResumeBuilderProps {
  targetCompany?: string;
  targetRole?: string;
}

interface ExperienceItem {
  id: string;
  role: string;
  organization: string;
  location: string;
  duration: string;
  bullets: string[];
}

interface ProjectItem {
  id: string;
  title: string;
  techStack: string;
  link: string;
  duration: string;
  bullets: string[];
}

interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  location: string;
  duration: string;
  score: string;
  coursework: string;
  honors: string;
}

export interface ResumeStructuredData {
  fullName: string;
  professionalTitle: string;
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  codingProfile: string;
  executiveSummary: string;
  education: EducationItem[];
  skills: {
    languages: string;
    coreSystems: string;
    cloudDevOps: string;
    databasesTools: string;
  };
  experience: ExperienceItem[];
  projects: ProjectItem[];
  algorithmicBenchmarks: string[];
  certificationsAndPublications: string[];
  leadershipAndImpact: string[];
}

const MASK_SHORT = '********';
const MASK_MEDIUM = '******** ********';
const MASK_LONG = '******** ******** ******** ******** ********';

const createEmptyStandardTemplate = (): ResumeStructuredData => ({
  fullName: '',
  professionalTitle: '',
  location: '',
  email: '',
  phone: '',
  linkedin: '',
  github: '',
  codingProfile: '',
  executiveSummary: '',
  education: [
    {
      id: 'edu-1',
      degree: '',
      institution: '',
      location: '',
      duration: '',
      score: '',
      coursework: '',
      honors: '',
    },
  ],
  skills: {
    languages: '',
    coreSystems: '',
    cloudDevOps: '',
    databasesTools: '',
  },
  experience: [
    {
      id: 'exp-1',
      role: '',
      organization: '',
      location: '',
      duration: '',
      bullets: ['', ''],
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: '',
      techStack: '',
      link: '',
      duration: '',
      bullets: ['', ''],
    },
  ],
  algorithmicBenchmarks: [''],
  certificationsAndPublications: [''],
  leadershipAndImpact: [''],
});

function valOrMask(value: string, mask = MASK_SHORT): string {
  return value && value.trim().length > 0 ? value.trim() : mask;
}

function convertDataToPlainText(data: ResumeStructuredData): string {
  const name = valOrMask(data.fullName);
  const title = valOrMask(data.professionalTitle, MASK_MEDIUM);
  const loc = valOrMask(data.location);
  const phone = valOrMask(data.phone);
  const email = valOrMask(data.email);
  const linkedin = valOrMask(data.linkedin);
  const github = valOrMask(data.github);
  const coding = valOrMask(data.codingProfile);

  const eduLines = data.education
    .map(
      (e) =>
        `${valOrMask(e.degree, MASK_MEDIUM)} | ${valOrMask(e.institution, MASK_MEDIUM)} (${valOrMask(e.location)})\n` +
        `Duration: ${valOrMask(e.duration)} | CGPA / Score: ${valOrMask(e.score)}\n` +
        `Relevant Coursework: ${valOrMask(e.coursework, MASK_LONG)}\n` +
        `Honors & Distinctions: ${valOrMask(e.honors, MASK_MEDIUM)}`
    )
    .join('\n\n');

  const expLines = data.experience
    .map((x) => {
      const bullets = (x.bullets.length ? x.bullets : [''])
        .map((b) => `• ${valOrMask(b, MASK_LONG)}`)
        .join('\n');
      return `${valOrMask(x.role, MASK_MEDIUM)} — ${valOrMask(x.organization, MASK_MEDIUM)} (${valOrMask(x.location)}) | ${valOrMask(x.duration)}\n${bullets}`;
    })
    .join('\n\n');

  const projLines = data.projects
    .map((p) => {
      const bullets = (p.bullets.length ? p.bullets : [''])
        .map((b) => `• ${valOrMask(b, MASK_LONG)}`)
        .join('\n');
      return `${valOrMask(p.title, MASK_MEDIUM)} | Tech Stack: ${valOrMask(p.techStack, MASK_MEDIUM)} | ${valOrMask(p.link)} (${valOrMask(p.duration)})\n${bullets}`;
    })
    .join('\n\n');

  const achLines = (data.algorithmicBenchmarks.length ? data.algorithmicBenchmarks : [''])
    .map((b) => `• ${valOrMask(b, MASK_LONG)}`)
    .join('\n');

  const certLines = (
    data.certificationsAndPublications.length ? data.certificationsAndPublications : ['']
  )
    .map((c) => `• ${valOrMask(c, MASK_LONG)}`)
    .join('\n');

  const leadLines = (data.leadershipAndImpact.length ? data.leadershipAndImpact : [''])
    .map((l) => `• ${valOrMask(l, MASK_LONG)}`)
    .join('\n');

  return `${name}
${title}
${loc} | ${phone} | ${email}
LinkedIn: ${linkedin} | GitHub: ${github} | Coding Profile: ${coding}

================================================================================
PROFESSIONAL SUMMARY
================================================================================
${valOrMask(data.executiveSummary, MASK_LONG)}

================================================================================
EDUCATION
================================================================================
${eduLines}

================================================================================
TECHNICAL SKILLS
================================================================================
• Programming Languages: ${valOrMask(data.skills.languages, MASK_MEDIUM)}
• Core CS & Architecture: ${valOrMask(data.skills.coreSystems, MASK_MEDIUM)}
• Frameworks, Cloud & DevOps: ${valOrMask(data.skills.cloudDevOps, MASK_MEDIUM)}
• Databases & Developer Tools: ${valOrMask(data.skills.databasesTools, MASK_MEDIUM)}

================================================================================
WORK EXPERIENCE & INTERNSHIPS
================================================================================
${expLines}

================================================================================
KEY ENGINEERING PROJECTS
================================================================================
${projLines}

================================================================================
ALGORITHMIC & ACADEMIC ACHIEVEMENTS
================================================================================
${achLines}

================================================================================
CERTIFICATIONS & PUBLICATIONS
================================================================================
${certLines}

================================================================================
LEADERSHIP & EXTRA-CURRICULAR IMPACT
================================================================================
${leadLines}
`;
}

function convertDataToMarkdown(data: ResumeStructuredData): string {
  const name = valOrMask(data.fullName);
  const title = valOrMask(data.professionalTitle, MASK_MEDIUM);

  return `# ${name}
**${title}**  
${valOrMask(data.location)} · ${valOrMask(data.phone)} · ${valOrMask(data.email)}  
LinkedIn: ${valOrMask(data.linkedin)} · GitHub: ${valOrMask(data.github)} · Coding Profile: ${valOrMask(data.codingProfile)}

---

## Professional Summary
${valOrMask(data.executiveSummary, MASK_LONG)}

## Education
${data.education
  .map(
    (e) =>
      `### ${valOrMask(e.degree, MASK_MEDIUM)} — ${valOrMask(e.institution, MASK_MEDIUM)} (${valOrMask(e.location)})
*${valOrMask(e.duration)} | ${valOrMask(e.score)}*
- **Coursework:** ${valOrMask(e.coursework, MASK_LONG)}
- **Honors:** ${valOrMask(e.honors, MASK_MEDIUM)}`
  )
  .join('\n\n')}

## Technical Skills
- **Programming Languages:** ${valOrMask(data.skills.languages, MASK_MEDIUM)}
- **Core CS & System Architecture:** ${valOrMask(data.skills.coreSystems, MASK_MEDIUM)}
- **Frameworks, Cloud & DevOps:** ${valOrMask(data.skills.cloudDevOps, MASK_MEDIUM)}
- **Databases & Developer Tools:** ${valOrMask(data.skills.databasesTools, MASK_MEDIUM)}

## Work Experience & Internships
${data.experience
  .map(
    (x) =>
      `### ${valOrMask(x.role, MASK_MEDIUM)} — ${valOrMask(x.organization, MASK_MEDIUM)} (${valOrMask(x.location)})
*${valOrMask(x.duration)}*
${(x.bullets.length ? x.bullets : ['']).map((b) => `- ${valOrMask(b, MASK_LONG)}`).join('\n')}`
  )
  .join('\n\n')}

## Key Engineering Projects
${data.projects
  .map(
    (p) =>
      `### ${valOrMask(p.title, MASK_MEDIUM)} | *${valOrMask(p.techStack, MASK_MEDIUM)}*
*${valOrMask(p.duration)} · ${valOrMask(p.link)}*
${(p.bullets.length ? p.bullets : ['']).map((b) => `- ${valOrMask(b, MASK_LONG)}`).join('\n')}`
  )
  .join('\n\n')}

## Achievements & Competitive Programming
${(data.algorithmicBenchmarks.length ? data.algorithmicBenchmarks : [''])
  .map((b) => `- ${valOrMask(b, MASK_LONG)}`)
  .join('\n')}

## Certifications & Publications
${(data.certificationsAndPublications.length ? data.certificationsAndPublications : [''])
  .map((c) => `- ${valOrMask(c, MASK_LONG)}`)
  .join('\n')}

## Leadership & Responsibility
${(data.leadershipAndImpact.length ? data.leadershipAndImpact : [''])
  .map((l) => `- ${valOrMask(l, MASK_LONG)}`)
  .join('\n')}
`;
}

function buildStandaloneHtmlDocument(data: ResumeStructuredData): string {
  const safeName = valOrMask(data.fullName);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${safeName === MASK_SHORT ? 'Standard_ATS_Resume' : safeName} - Resume</title>
  <style>
    @page { size: A4; margin: 12mm 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Calibri', 'Plus Jakarta Sans', 'Arial', sans-serif;
      font-size: 10pt;
      color: #111827;
      line-height: 1.38;
      margin: 0;
      padding: 24px 32px;
      max-width: 820px;
      margin-left: auto;
      margin-right: auto;
      background: #ffffff;
    }
    h1 {
      font-size: 20pt;
      font-weight: 800;
      margin: 0 0 2pt 0;
      text-transform: uppercase;
      letter-spacing: 0.4pt;
      color: #0B2545;
    }
    .subtitle {
      font-size: 10.5pt;
      font-weight: 700;
      color: #1E3A8A;
      margin-bottom: 4pt;
    }
    .contact {
      font-size: 9pt;
      color: #374151;
      margin-bottom: 10pt;
      border-bottom: 1.5pt solid #0B2545;
      padding-bottom: 6pt;
    }
    h2 {
      font-size: 10pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #0B2545;
      border-bottom: 1pt solid #CBD5E1;
      padding-bottom: 2pt;
      margin-top: 9pt;
      margin-bottom: 4pt;
      letter-spacing: 0.6pt;
    }
    p, li { font-size: 9.5pt; margin: 2pt 0; }
    ul { margin: 2pt 0 5pt 16pt; padding: 0; }
    .row-between {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-weight: 700;
      font-size: 9.8pt;
      color: #111827;
    }
    .row-sub {
      font-size: 9pt;
      color: #4B5563;
      font-style: italic;
      margin-bottom: 2pt;
    }
    @media print {
      body { padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <h1>${valOrMask(data.fullName)}</h1>
  <div class="subtitle">${valOrMask(data.professionalTitle, MASK_MEDIUM)}</div>
  <div class="contact">
    ${valOrMask(data.location)} &bull; ${valOrMask(data.phone)} &bull; ${valOrMask(data.email)}<br/>
    LinkedIn: ${valOrMask(data.linkedin)} &bull; GitHub: ${valOrMask(data.github)} &bull; Coding: ${valOrMask(data.codingProfile)}
  </div>

  <h2>Professional Summary</h2>
  <p>${valOrMask(data.executiveSummary, MASK_LONG)}</p>

  <h2>Education</h2>
  ${data.education
    .map(
      (e) => `
    <div class="row-between">
      <span>${valOrMask(e.degree, MASK_MEDIUM)} — ${valOrMask(e.institution, MASK_MEDIUM)} (${valOrMask(e.location)})</span>
      <span>${valOrMask(e.duration)} | ${valOrMask(e.score)}</span>
    </div>
    <p><strong>Relevant Coursework:</strong> ${valOrMask(e.coursework, MASK_LONG)}</p>
    <p><strong>Academic Honors:</strong> ${valOrMask(e.honors, MASK_MEDIUM)}</p>
  `
    )
    .join('')}

  <h2>Technical Skills</h2>
  <ul>
    <li><strong>Programming Languages:</strong> ${valOrMask(data.skills.languages, MASK_MEDIUM)}</li>
    <li><strong>Core CS &amp; System Architecture:</strong> ${valOrMask(data.skills.coreSystems, MASK_MEDIUM)}</li>
    <li><strong>Frameworks, Cloud &amp; DevOps:</strong> ${valOrMask(data.skills.cloudDevOps, MASK_MEDIUM)}</li>
    <li><strong>Databases &amp; Developer Tools:</strong> ${valOrMask(data.skills.databasesTools, MASK_MEDIUM)}</li>
  </ul>

  <h2>Work Experience &amp; Internships</h2>
  ${data.experience
    .map(
      (x) => `
    <div class="row-between">
      <span>${valOrMask(x.role, MASK_MEDIUM)} — ${valOrMask(x.organization, MASK_MEDIUM)} (${valOrMask(x.location)})</span>
      <span>${valOrMask(x.duration)}</span>
    </div>
    <ul>${(x.bullets.length ? x.bullets : [''])
      .map((b) => `<li>${valOrMask(b, MASK_LONG)}</li>`)
      .join('')}</ul>
  `
    )
    .join('')}

  <h2>Key Engineering Projects</h2>
  ${data.projects
    .map(
      (p) => `
    <div class="row-between">
      <span>${valOrMask(p.title, MASK_MEDIUM)} | ${valOrMask(p.techStack, MASK_MEDIUM)}</span>
      <span>${valOrMask(p.duration)} &bull; ${valOrMask(p.link)}</span>
    </div>
    <ul>${(p.bullets.length ? p.bullets : [''])
      .map((b) => `<li>${valOrMask(b, MASK_LONG)}</li>`)
      .join('')}</ul>
  `
    )
    .join('')}

  <h2>Achievements &amp; Competitive Programming</h2>
  <ul>${(data.algorithmicBenchmarks.length ? data.algorithmicBenchmarks : [''])
    .map((b) => `<li>${valOrMask(b, MASK_LONG)}</li>`)
    .join('')}</ul>

  <h2>Certifications &amp; Publications</h2>
  <ul>${(data.certificationsAndPublications.length ? data.certificationsAndPublications : [''])
    .map((c) => `<li>${valOrMask(c, MASK_LONG)}</li>`)
    .join('')}</ul>

  <h2>Leadership &amp; Positions of Responsibility</h2>
  <ul>${(data.leadershipAndImpact.length ? data.leadershipAndImpact : [''])
    .map((l) => `<li>${valOrMask(l, MASK_LONG)}</li>`)
    .join('')}</ul>
</body>
</html>`;
}

export const AtsResumeBuilder: React.FC<AtsResumeBuilderProps> = () => {
  const [resumeData, setResumeData] = useState<ResumeStructuredData>(() =>
    createEmptyStandardTemplate()
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const getSafeFilenameBase = () => {
    const cleaned = resumeData.fullName.trim().replace(/[^a-zA-Z0-9]+/g, '_');
    return cleaned.length > 0 ? `${cleaned}_Resume` : 'Standard_ATS_Resume';
  };

  const triggerBlobDownload = (content: string, mimeType: string, extension: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${getSafeFilenameBase()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const element = document.getElementById('standard-ats-resume-sheet');
      if (element) {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
        pdf.save(`${getSafeFilenameBase()}.pdf`);
        setIsGeneratingPdf(false);
        return;
      }
    } catch (err) {
      console.warn('html2canvas PDF generation error:', err);
    }
    setIsGeneratingPdf(false);
    window.print();
  };

  const handleDownloadTxt = () => {
    triggerBlobDownload(
      convertDataToPlainText(resumeData),
      'text/plain;charset=utf-8',
      'txt'
    );
  };

  const handleDownloadWordDoc = () => {
    const html = buildStandaloneHtmlDocument(resumeData);
    triggerBlobDownload(
      '\ufeff' + html,
      'application/msword;charset=utf-8',
      'doc'
    );
  };

  const renderMaskedText = (
    value: string,
    mask = MASK_SHORT,
    className = ''
  ) => {
    if (value && value.trim().length > 0) {
      return <span className={className}>{value}</span>;
    }
    return (
      <span
        className={`font-mono tracking-wider text-gray-400/85 select-none ${className}`}
        title="Waiting for your input"
      >
        {mask}
      </span>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-7 shadow-xs text-gray-900 space-y-5">
      {/* Dedicated Print-Only Stylesheet so "Download PDF" exports ONLY the clean A4 resume sheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #standard-ats-resume-sheet,
          #standard-ats-resume-sheet * {
            visibility: visible !important;
          }
          #standard-ats-resume-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 12mm 14mm !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      {/* Top Header — Short & Universal Single Page Format */}
      <div className="border-b border-gray-100 pb-3 print:hidden">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Resume Builder
        </h2>
        <p className="text-xs text-gray-500 mt-0.5 font-medium">
          Universal Single-Page Resume Format
        </p>
      </div>

      {/* Export Toolbar — PDF, Text, and Word ONLY */}
      <div className="bg-[#FAFAFA] border border-gray-200 rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="text-xs font-semibold text-gray-700">
          Download Options:
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B2545] hover:bg-[#13315C] text-white text-xs font-semibold transition shadow-2xs whitespace-nowrap cursor-pointer disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5 text-[#FDE047]" />
            <span>{isGeneratingPdf ? 'Preparing PDF...' : 'Download PDF (.pdf)'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadTxt}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-gray-300 text-xs font-semibold text-gray-800 transition whitespace-nowrap cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#0B2545]" />
            <span>Download Text (.txt)</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadWordDoc}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-gray-300 text-xs font-semibold text-gray-800 transition whitespace-nowrap cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-700" />
            <span>Word (.doc)</span>
          </button>
        </div>
      </div>

      {/* Main Split Workspace: Left = User Input Form | Right = Live Standard A4 Template with ******** Background */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 5 Columns: Ready-to-Enter User Input Fields */}
        <div className="xl:col-span-5 space-y-5 max-h-[920px] overflow-y-auto pr-1 print:hidden">
          {/* 01. Personal & Contact Details */}
          <div className="bg-[#FAFAFA] border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0B2545]">
                <Briefcase className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>01. Candidate Identity & Contact Info</span>
              </div>
              <span className="text-[11px] font-mono text-gray-400">********</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={resumeData.fullName}
                  onChange={(e) =>
                    setResumeData({ ...resumeData, fullName: e.target.value })
                  }
                  placeholder="******** (Enter your full name)"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-mono focus:outline-none focus:border-[#0B2545]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Target Role / Professional Title
                </label>
                <input
                  type="text"
                  value={resumeData.professionalTitle}
                  onChange={(e) =>
                    setResumeData({
                      ...resumeData,
                      professionalTitle: e.target.value,
                    })
                  }
                  placeholder="******** (e.g., Software Development Engineer)"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 placeholder:font-mono focus:outline-none focus:border-[#0B2545]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={resumeData.email}
                  onChange={(e) =>
                    setResumeData({ ...resumeData, email: e.target.value })
                  }
                  placeholder="********"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 placeholder:font-mono focus:outline-none focus:border-[#0B2545]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={resumeData.phone}
                  onChange={(e) =>
                    setResumeData({ ...resumeData, phone: e.target.value })
                  }
                  placeholder="********"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 placeholder:font-mono focus:outline-none focus:border-[#0B2545]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  City, State / Country
                </label>
                <input
                  type="text"
                  value={resumeData.location}
                  onChange={(e) =>
                    setResumeData({ ...resumeData, location: e.target.value })
                  }
                  placeholder="********"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 placeholder:font-mono focus:outline-none focus:border-[#0B2545]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  LinkedIn Profile URL
                </label>
                <input
                  type="text"
                  value={resumeData.linkedin}
                  onChange={(e) =>
                    setResumeData({ ...resumeData, linkedin: e.target.value })
                  }
                  placeholder="********"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 placeholder:font-mono focus:outline-none focus:border-[#0B2545]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  GitHub / Portfolio URL
                </label>
                <input
                  type="text"
                  value={resumeData.github}
                  onChange={(e) =>
                    setResumeData({ ...resumeData, github: e.target.value })
                  }
                  placeholder="********"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 placeholder:font-mono focus:outline-none focus:border-[#0B2545]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  LeetCode / Coding Profile
                </label>
                <input
                  type="text"
                  value={resumeData.codingProfile}
                  onChange={(e) =>
                    setResumeData({
                      ...resumeData,
                      codingProfile: e.target.value,
                    })
                  }
                  placeholder="********"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 placeholder:font-mono focus:outline-none focus:border-[#0B2545]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Professional Summary (2–3 Lines)
              </label>
              <textarea
                rows={3}
                value={resumeData.executiveSummary}
                onChange={(e) =>
                  setResumeData({
                    ...resumeData,
                    executiveSummary: e.target.value,
                  })
                }
                placeholder="******** (Summarize your core specialization, problem-solving track record, and production engineering impact)"
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 placeholder:text-gray-400 placeholder:font-mono leading-relaxed focus:outline-none focus:border-[#0B2545]"
              />
            </div>
          </div>

          {/* 02. Education */}
          <div className="bg-[#FAFAFA] border border-gray-200 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div className="flex items-center gap-2 font-bold text-[#0B2545]">
                <GraduationCap className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>02. Education & Academic Credentials</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setResumeData({
                    ...resumeData,
                    education: [
                      ...resumeData.education,
                      {
                        id: `edu-${Date.now()}`,
                        degree: '',
                        institution: '',
                        location: '',
                        duration: '',
                        score: '',
                        coursework: '',
                        honors: '',
                      },
                    ],
                  })
                }
                className="flex items-center gap-1 text-[11px] font-semibold text-[#0B2545] hover:underline"
              >
                <Plus className="w-3 h-3" />
                <span>Add Education</span>
              </button>
            </div>

            {resumeData.education.map((edu, idx) => (
              <div
                key={edu.id}
                className="bg-white border border-gray-200 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => {
                      const next = [...resumeData.education];
                      next[idx] = { ...edu, degree: e.target.value };
                      setResumeData({ ...resumeData, education: next });
                    }}
                    placeholder="******** (Degree & Major, e.g. B.Tech in CSE)"
                    className="w-full px-2.5 py-1.5 bg-[#FAFAFA] border border-gray-200 rounded font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-mono"
                  />
                  {resumeData.education.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setResumeData({
                          ...resumeData,
                          education: resumeData.education.filter(
                            (_, i) => i !== idx
                          ),
                        })
                      }
                      className="text-gray-400 hover:text-rose-600 p-1"
                      title="Remove education"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => {
                      const next = [...resumeData.education];
                      next[idx] = { ...edu, institution: e.target.value };
                      setResumeData({ ...resumeData, education: next });
                    }}
                    placeholder="******** (University / College)"
                    className="w-full px-2.5 py-1.5 bg-[#FAFAFA] border border-gray-200 rounded text-gray-800 placeholder:text-gray-400 placeholder:font-mono"
                  />
                  <input
                    type="text"
                    value={edu.location}
                    onChange={(e) => {
                      const next = [...resumeData.education];
                      next[idx] = { ...edu, location: e.target.value };
                      setResumeData({ ...resumeData, education: next });
                    }}
                    placeholder="******** (Location)"
                    className="w-full px-2.5 py-1.5 bg-[#FAFAFA] border border-gray-200 rounded text-gray-800 placeholder:text-gray-400 placeholder:font-mono"
                  />
                  <input
                    type="text"
                    value={edu.duration}
                    onChange={(e) => {
                      const next = [...resumeData.education];
                      next[idx] = { ...edu, duration: e.target.value };
                      setResumeData({ ...resumeData, education: next });
                    }}
                    placeholder="******** (Duration, e.g. Start Year – Graduation Year)"
                    className="w-full px-2.5 py-1.5 bg-[#FAFAFA] border border-gray-200 rounded text-gray-800 placeholder:text-gray-400 placeholder:font-mono"
                  />
                  <input
                    type="text"
                    value={edu.score}
                    onChange={(e) => {
                      const next = [...resumeData.education];
                      next[idx] = { ...edu, score: e.target.value };
                      setResumeData({ ...resumeData, education: next });
                    }}
                    placeholder="******** (CGPA / Percentage)"
                    className="w-full px-2.5 py-1.5 bg-[#FAFAFA] border border-gray-200 rounded text-gray-800 placeholder:text-gray-400 placeholder:font-mono"
                  />
                </div>

                <input
                  type="text"
                  value={edu.coursework}
                  onChange={(e) => {
                    const next = [...resumeData.education];
                    next[idx] = { ...edu, coursework: e.target.value };
                    setResumeData({ ...resumeData, education: next });
                  }}
                  placeholder="******** (Relevant Coursework: DSA, OS, DBMS, Computer Networks)"
                  className="w-full px-2.5 py-1.5 bg-[#FAFAFA] border border-gray-200 rounded text-gray-800 placeholder:text-gray-400 placeholder:font-mono"
                />

                <input
                  type="text"
                  value={edu.honors}
                  onChange={(e) => {
                    const next = [...resumeData.education];
                    next[idx] = { ...edu, honors: e.target.value };
                    setResumeData({ ...resumeData, education: next });
                  }}
                  placeholder="******** (Academic Honors / Scholarships)"
                  className="w-full px-2.5 py-1.5 bg-[#FAFAFA] border border-gray-200 rounded text-gray-800 placeholder:text-gray-400 placeholder:font-mono"
                />
              </div>
            ))}
          </div>

          {/* 03. Technical Skills */}
          <div className="bg-[#FAFAFA] border border-gray-200 rounded-xl p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div className="flex items-center gap-2 font-bold text-[#0B2545]">
                <Code2 className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>03. Technical Skills Matrix</span>
              </div>
              <span className="text-[11px] font-mono text-gray-400">********</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Programming Languages
              </label>
              <input
                type="text"
                value={resumeData.skills.languages}
                onChange={(e) =>
                  setResumeData({
                    ...resumeData,
                    skills: { ...resumeData.skills, languages: e.target.value },
                  })
                }
                placeholder="******** (e.g., C++, Java, Python, TypeScript, SQL)"
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 placeholder:font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Core CS & System Architecture
              </label>
              <input
                type="text"
                value={resumeData.skills.coreSystems}
                onChange={(e) =>
                  setResumeData({
                    ...resumeData,
                    skills: {
                      ...resumeData.skills,
                      coreSystems: e.target.value,
                    },
                  })
                }
                placeholder="******** (e.g., Data Structures & Algorithms, OOP, OS, DBMS, System Design)"
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 placeholder:font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Frameworks, Cloud & DevOps
              </label>
              <input
                type="text"
                value={resumeData.skills.cloudDevOps}
                onChange={(e) =>
                  setResumeData({
                    ...resumeData,
                    skills: {
                      ...resumeData.skills,
                      cloudDevOps: e.target.value,
                    },
                  })
                }
                placeholder="******** (e.g., React, Node.js, Spring Boot, AWS, Docker, CI/CD)"
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 placeholder:font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Databases, Caching & Developer Tools
              </label>
              <input
                type="text"
                value={resumeData.skills.databasesTools}
                onChange={(e) =>
                  setResumeData({
                    ...resumeData,
                    skills: {
                      ...resumeData.skills,
                      databasesTools: e.target.value,
                    },
                  })
                }
                placeholder="******** (e.g., PostgreSQL, MongoDB, Redis, Git, Linux)"
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 placeholder:font-mono"
              />
            </div>
          </div>

          {/* 04. Work Experience & Internships */}
          <div className="bg-[#FAFAFA] border border-gray-200 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div className="flex items-center gap-2 font-bold text-[#0B2545]">
                <Briefcase className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>04. Work Experience & Internships</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setResumeData({
                    ...resumeData,
                    experience: [
                      ...resumeData.experience,
                      {
                        id: `exp-${Date.now()}`,
                        role: '',
                        organization: '',
                        location: '',
                        duration: '',
                        bullets: ['', ''],
                      },
                    ],
                  })
                }
                className="flex items-center gap-1 text-[11px] font-semibold text-[#0B2545] hover:underline"
              >
                <Plus className="w-3 h-3" />
                <span>Add Role</span>
              </button>
            </div>

            {resumeData.experience.map((exp, expIdx) => (
              <div
                key={exp.id}
                className="bg-white border border-gray-200 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={exp.role}
                    onChange={(e) => {
                      const next = [...resumeData.experience];
                      next[expIdx] = { ...exp, role: e.target.value };
                      setResumeData({ ...resumeData, experience: next });
                    }}
                    placeholder="******** (Role Title, e.g. Software Engineering Intern)"
                    className="w-full px-2.5 py-1.5 bg-[#FAFAFA] border border-gray-200 rounded font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-mono"
                  />
                  {resumeData.experience.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setResumeData({
                          ...resumeData,
                          experience: resumeData.experience.filter(
                            (_, i) => i !== expIdx
                          ),
                        })
                      }
                      className="text-gray-400 hover:text-rose-600 p-1"
                      title="Remove role"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={exp.organization}
                    onChange={(e) => {
                      const next = [...resumeData.experience];
                      next[expIdx] = { ...exp, organization: e.target.value };
                      setResumeData({ ...resumeData, experience: next });
                    }}
                    placeholder="******** (Company)"
                    className="px-2.5 py-1.5 bg-[#FAFAFA] border border-gray-200 rounded text-gray-800 placeholder:text-gray-400 placeholder:font-mono"
                  />
                  <input
                    type="text"
                    value={exp.location}
                    onChange={(e) => {
                      const next = [...resumeData.experience];
                      next[expIdx] = { ...exp, location: e.target.value };
                      setResumeData({ ...resumeData, experience: next });
                    }}
                    placeholder="******** (Location)"
                    className="px-2.5 py-1.5 bg-[#FAFAFA] border border-gray-200 rounded text-gray-800 placeholder:text-gray-400 placeholder:font-mono"
                  />
                  <input
                    type="text"
                    value={exp.duration}
                    onChange={(e) => {
                      const next = [...resumeData.experience];
                      next[expIdx] = { ...exp, duration: e.target.value };
                      setResumeData({ ...resumeData, experience: next });
                    }}
                    placeholder="******** (Dates)"
                    className="px-2.5 py-1.5 bg-[#FAFAFA] border border-gray-200 rounded text-gray-800 placeholder:text-gray-400 placeholder:font-mono"
                  />
                </div>

                <textarea
                  rows={3}
                  value={exp.bullets.join('\n')}
                  onChange={(e) => {
                    const next = [...resumeData.experience];
                    next[expIdx] = {
                      ...exp,
                      bullets: e.target.value
                        .split('\n')
                        .map((line) => line.replace(/^[•-]\s*/, '')),
                    };
                    setResumeData({ ...resumeData, experience: next });
                  }}
                  placeholder={
                    '******** (Enter 1 impact bullet per line using Action Verb + Metric + Technology)\n********'
                  }
                  className="w-full p-2 bg-[#FAFAFA] border border-gray-200 rounded text-[11px] text-gray-800 placeholder:text-gray-400 placeholder:font-mono leading-relaxed"
                />
              </div>
            ))}
          </div>

          {/* 05. Key Engineering Projects */}
          <div className="bg-[#FAFAFA] border border-gray-200 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div className="flex items-center gap-2 font-bold text-[#0B2545]">
                <FolderGit2 className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>05. Key Engineering Projects</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setResumeData({
                    ...resumeData,
                    projects: [
                      ...resumeData.projects,
                      {
                        id: `proj-${Date.now()}`,
                        title: '',
                        techStack: '',
                        link: '',
                        duration: '',
                        bullets: ['', ''],
                      },
                    ],
                  })
                }
                className="flex items-center gap-1 text-[11px] font-semibold text-[#0B2545] hover:underline"
              >
                <Plus className="w-3 h-3" />
                <span>Add Project</span>
              </button>
            </div>

            {resumeData.projects.map((proj, projIdx) => (
              <div
                key={proj.id}
                className="bg-white border border-gray-200 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={proj.title}
                    onChange={(e) => {
                      const next = [...resumeData.projects];
                      next[projIdx] = { ...proj, title: e.target.value };
                      setResumeData({ ...resumeData, projects: next });
                    }}
                    placeholder="******** (Project Title)"
                    className="w-full px-2.5 py-1.5 bg-[#FAFAFA] border border-gray-200 rounded font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-mono"
                  />
                  {resumeData.projects.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setResumeData({
                          ...resumeData,
                          projects: resumeData.projects.filter(
                            (_, i) => i !== projIdx
                          ),
                        })
                      }
                      className="text-gray-400 hover:text-rose-600 p-1"
                      title="Remove project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={proj.techStack}
                    onChange={(e) => {
                      const next = [...resumeData.projects];
                      next[projIdx] = { ...proj, techStack: e.target.value };
                      setResumeData({ ...resumeData, projects: next });
                    }}
                    placeholder="******** (Tech Stack)"
                    className="px-2.5 py-1.5 bg-[#FAFAFA] border border-gray-200 rounded text-gray-800 placeholder:text-gray-400 placeholder:font-mono"
                  />
                  <input
                    type="text"
                    value={proj.link}
                    onChange={(e) => {
                      const next = [...resumeData.projects];
                      next[projIdx] = { ...proj, link: e.target.value };
                      setResumeData({ ...resumeData, projects: next });
                    }}
                    placeholder="******** (GitHub / Live URL)"
                    className="px-2.5 py-1.5 bg-[#FAFAFA] border border-gray-200 rounded text-gray-800 placeholder:text-gray-400 placeholder:font-mono"
                  />
                  <input
                    type="text"
                    value={proj.duration}
                    onChange={(e) => {
                      const next = [...resumeData.projects];
                      next[projIdx] = { ...proj, duration: e.target.value };
                      setResumeData({ ...resumeData, projects: next });
                    }}
                    placeholder="******** (Year / Duration)"
                    className="px-2.5 py-1.5 bg-[#FAFAFA] border border-gray-200 rounded text-gray-800 placeholder:text-gray-400 placeholder:font-mono"
                  />
                </div>

                <textarea
                  rows={3}
                  value={proj.bullets.join('\n')}
                  onChange={(e) => {
                    const next = [...resumeData.projects];
                    next[projIdx] = {
                      ...proj,
                      bullets: e.target.value
                        .split('\n')
                        .map((line) => line.replace(/^[•-]\s*/, '')),
                    };
                    setResumeData({ ...resumeData, projects: next });
                  }}
                  placeholder={
                    '******** (Describe architecture, scale, and measurable result — 1 bullet per line)\n********'
                  }
                  className="w-full p-2 bg-[#FAFAFA] border border-gray-200 rounded text-[11px] text-gray-800 placeholder:text-gray-400 placeholder:font-mono leading-relaxed"
                />
              </div>
            ))}
          </div>

          {/* 06. Achievements, Certifications & Leadership */}
          <div className="bg-[#FAFAFA] border border-gray-200 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div className="flex items-center gap-2 font-bold text-[#0B2545]">
                <Award className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>06. Achievements, Certifications & Leadership</span>
              </div>
              <span className="text-[11px] font-mono text-gray-400">********</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Algorithmic & Academic Achievements (One per line)
              </label>
              <textarea
                rows={2}
                value={resumeData.algorithmicBenchmarks.join('\n')}
                onChange={(e) =>
                  setResumeData({
                    ...resumeData,
                    algorithmicBenchmarks: e.target.value.split('\n'),
                  })
                }
                placeholder="******** (e.g., Solved 500+ DSA problems across LeetCode & Codeforces)"
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-[11px] text-gray-800 placeholder:text-gray-400 placeholder:font-mono leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Certifications & Publications (One per line)
              </label>
              <textarea
                rows={2}
                value={resumeData.certificationsAndPublications.join('\n')}
                onChange={(e) =>
                  setResumeData({
                    ...resumeData,
                    certificationsAndPublications: e.target.value.split('\n'),
                  })
                }
                placeholder="******** (e.g., AWS Certified Solutions Architect / Google Cloud Associate)"
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-[11px] text-gray-800 placeholder:text-gray-400 placeholder:font-mono leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Leadership & Positions of Responsibility (One per line)
              </label>
              <textarea
                rows={2}
                value={resumeData.leadershipAndImpact.join('\n')}
                onChange={(e) =>
                  setResumeData({
                    ...resumeData,
                    leadershipAndImpact: e.target.value.split('\n'),
                  })
                }
                placeholder="******** (e.g., Technical Lead, Coding Club — Mentored 200+ students)"
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-[11px] text-gray-800 placeholder:text-gray-400 placeholder:font-mono leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Right 7 Columns: Single Standard Highly-Valid A4 Resume Template Sheet */}
        <div className="xl:col-span-7 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-gray-500 print:hidden">
            <span className="font-semibold text-gray-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Live A4 Standard Resume Sheet (Unfilled fields show{' '}
                <code className="font-mono font-bold text-gray-600">********</code>{' '}
                in background)
              </span>
            </span>
            <span className="font-mono text-[11px] text-gray-400">
              ISO A4 · 1-Page Standard Layout
            </span>
          </div>

          <div
            id="standard-ats-resume-sheet"
            className="bg-white border-2 border-gray-300 rounded-xl p-6 sm:p-9 shadow-sm text-gray-900 space-y-4"
          >
            {/* Standard Candidate Header */}
            <div className="border-b-2 border-[#0B2545] pb-3.5 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B2545] uppercase">
                  {renderMaskedText(resumeData.fullName, MASK_SHORT)}
                </h1>
                <span className="text-xs font-mono font-semibold text-gray-600">
                  {renderMaskedText(resumeData.location, MASK_SHORT)}
                </span>
              </div>

              <div className="text-xs sm:text-sm font-bold text-[#13315C] mt-0.5">
                {renderMaskedText(resumeData.professionalTitle, MASK_MEDIUM)}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 gap-y-1 text-[11px] text-gray-600 mt-2 font-medium">
                <span>
                  Phone: {renderMaskedText(resumeData.phone, MASK_SHORT)}
                </span>
                <span>·</span>
                <span>
                  Email: {renderMaskedText(resumeData.email, MASK_SHORT)}
                </span>
                <span>·</span>
                <span>
                  LinkedIn: {renderMaskedText(resumeData.linkedin, MASK_SHORT)}
                </span>
                <span>·</span>
                <span>
                  GitHub: {renderMaskedText(resumeData.github, MASK_SHORT)}
                </span>
                <span>·</span>
                <span className="font-semibold text-[#0B2545]">
                  Coding: {renderMaskedText(resumeData.codingProfile, MASK_SHORT)}
                </span>
              </div>
            </div>

            {/* Section 1: Professional Summary */}
            <div className="space-y-1">
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-[#0B2545] border-b border-gray-300 pb-0.5">
                Professional Summary
              </h3>
              <p className="text-xs text-gray-800 leading-relaxed">
                {renderMaskedText(resumeData.executiveSummary, MASK_LONG)}
              </p>
            </div>

            {/* Section 2: Education */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-[#0B2545] border-b border-gray-300 pb-0.5">
                Education
              </h3>
              {resumeData.education.map((edu) => (
                <div key={edu.id} className="space-y-0.5 text-xs">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-bold text-gray-900">
                      {renderMaskedText(edu.degree, MASK_MEDIUM)} —{' '}
                      {renderMaskedText(edu.institution, MASK_MEDIUM)} (
                      {renderMaskedText(edu.location, MASK_SHORT)})
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-gray-700 tabular-nums">
                      {renderMaskedText(edu.duration, MASK_SHORT)} ·{' '}
                      {renderMaskedText(edu.score, MASK_SHORT)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-700">
                    <strong className="text-gray-900">
                      Relevant Coursework:
                    </strong>{' '}
                    {renderMaskedText(edu.coursework, MASK_LONG)}
                  </p>
                  <p className="text-[11px] text-gray-700">
                    <strong className="text-gray-900">
                      Honors & Distinctions:
                    </strong>{' '}
                    {renderMaskedText(edu.honors, MASK_MEDIUM)}
                  </p>
                </div>
              ))}
            </div>

            {/* Section 3: Technical Skills */}
            <div className="space-y-1.5">
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-[#0B2545] border-b border-gray-300 pb-0.5">
                Technical Skills
              </h3>
              <div className="grid grid-cols-1 gap-1 text-xs text-gray-800">
                <div>
                  <strong className="text-gray-900">
                    Programming Languages:
                  </strong>{' '}
                  {renderMaskedText(resumeData.skills.languages, MASK_MEDIUM)}
                </div>
                <div>
                  <strong className="text-gray-900">
                    Core CS & System Architecture:
                  </strong>{' '}
                  {renderMaskedText(resumeData.skills.coreSystems, MASK_MEDIUM)}
                </div>
                <div>
                  <strong className="text-gray-900">
                    Frameworks, Cloud & DevOps:
                  </strong>{' '}
                  {renderMaskedText(resumeData.skills.cloudDevOps, MASK_MEDIUM)}
                </div>
                <div>
                  <strong className="text-gray-900">
                    Databases & Developer Tools:
                  </strong>{' '}
                  {renderMaskedText(
                    resumeData.skills.databasesTools,
                    MASK_MEDIUM
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Work Experience & Internships */}
            <div className="space-y-2.5">
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-[#0B2545] border-b border-gray-300 pb-0.5">
                Work Experience & Internships
              </h3>
              {resumeData.experience.map((exp) => (
                <div key={exp.id} className="space-y-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-gray-900">
                        {renderMaskedText(exp.role, MASK_MEDIUM)}
                      </span>
                      <span className="text-xs text-gray-700">
                        {' '}
                        — {renderMaskedText(exp.organization, MASK_MEDIUM)} (
                        {renderMaskedText(exp.location, MASK_SHORT)})
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-gray-600 tabular-nums">
                      {renderMaskedText(exp.duration, MASK_SHORT)}
                    </span>
                  </div>
                  <ul className="list-disc list-outside ml-4 space-y-1 text-xs text-gray-800 leading-relaxed">
                    {(exp.bullets.length ? exp.bullets : ['']).map((b, i) => (
                      <li key={i}>{renderMaskedText(b, MASK_LONG)}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Section 5: Key Engineering Projects */}
            <div className="space-y-2.5">
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-[#0B2545] border-b border-gray-300 pb-0.5">
                Key Engineering Projects
              </h3>
              {resumeData.projects.map((proj) => (
                <div key={proj.id} className="space-y-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-gray-900">
                        {renderMaskedText(proj.title, MASK_MEDIUM)}
                      </span>
                      <span className="text-xs text-gray-600">
                        {' '}
                        | Tech Stack:{' '}
                        {renderMaskedText(proj.techStack, MASK_MEDIUM)}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-gray-600 tabular-nums">
                      {renderMaskedText(proj.duration, MASK_SHORT)} ·{' '}
                      {renderMaskedText(proj.link, MASK_SHORT)}
                    </span>
                  </div>
                  <ul className="list-disc list-outside ml-4 space-y-1 text-xs text-gray-800 leading-relaxed">
                    {(proj.bullets.length ? proj.bullets : ['']).map((b, i) => (
                      <li key={i}>{renderMaskedText(b, MASK_LONG)}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Section 6: Achievements & Competitive Programming */}
            <div className="space-y-1">
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-[#0B2545] border-b border-gray-300 pb-0.5">
                Algorithmic & Academic Achievements
              </h3>
              <ul className="list-disc list-outside ml-4 space-y-1 text-xs text-gray-800 leading-relaxed">
                {(resumeData.algorithmicBenchmarks.length
                  ? resumeData.algorithmicBenchmarks
                  : ['']
                ).map((item, idx) => (
                  <li key={idx}>{renderMaskedText(item, MASK_LONG)}</li>
                ))}
              </ul>
            </div>

            {/* Section 7: Certifications & Publications */}
            <div className="space-y-1">
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-[#0B2545] border-b border-gray-300 pb-0.5">
                Certifications & Publications
              </h3>
              <ul className="list-disc list-outside ml-4 space-y-1 text-xs text-gray-800 leading-relaxed">
                {(resumeData.certificationsAndPublications.length
                  ? resumeData.certificationsAndPublications
                  : ['']
                ).map((item, idx) => (
                  <li key={idx}>{renderMaskedText(item, MASK_LONG)}</li>
                ))}
              </ul>
            </div>

            {/* Section 8: Leadership & Positions of Responsibility */}
            <div className="space-y-1">
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-[#0B2545] border-b border-gray-300 pb-0.5">
                Leadership & Positions of Responsibility
              </h3>
              <ul className="list-disc list-outside ml-4 space-y-1 text-xs text-gray-800 leading-relaxed">
                {(resumeData.leadershipAndImpact.length
                  ? resumeData.leadershipAndImpact
                  : ['']
                ).map((item, idx) => (
                  <li key={idx}>{renderMaskedText(item, MASK_LONG)}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
