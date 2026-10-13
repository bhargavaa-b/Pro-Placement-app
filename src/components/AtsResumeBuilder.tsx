import React, { useState, useMemo, useRef } from 'react';
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
  AlertTriangle,
  Sparkles,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  Check,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface AtsResumeBuilderProps {
  targetCompany?: string;
  targetRole?: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  organization: string;
  location: string;
  duration: string;
  bullets: string[];
}

export interface ProjectItem {
  id: string;
  title: string;
  techStack: string;
  link: string;
  duration: string;
  bullets: string[];
}

export interface EducationItem {
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

export interface MissingFieldInfo {
  id: string;
  section: string;
  label: string;
  inputElementId: string;
}

// Gold-Standard Global Exemplar Profile (Harvard/Silicon Valley Placement standard)
const GLOBAL_STANDARD_SAMPLE: ResumeStructuredData = {
  fullName: 'Arjun Venkatesh',
  professionalTitle: 'Software Development Engineer | Full-Stack & Distributed Systems',
  location: 'Bengaluru, India',
  email: 'arjun.venkatesh@alumni.edu',
  phone: '+91 98765 43210',
  linkedin: 'linkedin.com/in/arjun-venkatesh-tech',
  github: 'github.com/arjun-venkatesh',
  codingProfile: 'leetcode.com/u/arjun_dev (650+ Solved)',
  executiveSummary:
    'Results-driven Computer Science graduate specializing in scalable backend architectures, distributed cloud systems, and real-time data pipelines. Proven record building low-latency microservices with 99.98% uptime, optimizing query latency by 42%, and mentoring 250+ aspiring engineers.',
  education: [
    {
      id: 'edu-1',
      degree: 'B.Tech in Computer Science & Engineering (Honors)',
      institution: 'National Institute of Technology (NIT)',
      location: 'Karnataka, India',
      duration: '2022 – 2026',
      score: 'CGPA: 9.32 / 10.0 (Top 2% of Department)',
      coursework: 'Data Structures & Algorithms, Distributed Systems, Database Management Systems, Computer Networks, Operating Systems, System Design',
      honors: 'Dean’s Honor List (All Semesters), Merit Scholarship for Academic Excellence',
    },
  ],
  skills: {
    languages: 'TypeScript, JavaScript (ES2024), Python 3, Java, C++, SQL (PostgreSQL), Go',
    coreSystems: 'Object-Oriented Design, Distributed Caching, RESTful & GraphQL APIs, System Architecture, Concurrency & Multithreading',
    cloudDevOps: 'Node.js, Express, React, Next.js, Docker, Kubernetes, AWS (EC2, S3, Lambda), Redis, Kafka, CI/CD GitHub Actions',
    databasesTools: 'PostgreSQL, MongoDB, Redis, Git, Linux / Bash, Postman, Vitest, Jest, Tailwind CSS',
  },
  experience: [
    {
      id: 'exp-1',
      role: 'Software Engineering Intern',
      organization: 'HexaCloud Technologies',
      location: 'Bengaluru, India',
      duration: 'May 2025 – July 2025',
      bullets: [
        'Architected an event-driven analytics microservice using Node.js, Kafka, and Redis caching that processed 4.2M daily telemetry events with sub-45ms latency.',
        'Refactored legacy PostgreSQL queries and established composite indexes, reducing p99 database response times by 38% across core candidate endpoints.',
        'Implemented end-to-end unit and integration test pipelines with Vitest, elevating critical-path code coverage from 64% to 92%.',
      ],
    },
    {
      id: 'exp-2',
      role: 'Technical Lead & Open Source Fellow',
      organization: 'Campus Developers Guild',
      location: 'NIT Campus',
      duration: 'August 2024 – Present',
      bullets: [
        'Led an 8-member engineering team delivering the university placement portal serving 3,800+ active candidates and 120+ visiting recruiters.',
        'Constructed role-based access control (RBAC) and OAuth 2.0 authentication flows ensuring zero security breaches during peak recruitment drive.',
      ],
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'CloudFlow — Distributed Task Orchestrator',
      techStack: 'Go, Redis Streams, Docker, PostgreSQL, Prometheus',
      link: 'github.com/arjun-venkatesh/cloudflow',
      duration: 'Jan 2025 – March 2025',
      bullets: [
        'Engineered a distributed priority job execution engine supporting worker node autoscaling and automatic retry idempotency for failed tasks.',
        'Benchmarked throughput at 14,000 tasks/second on an 8-core cluster with automated heartbeat health monitoring.',
      ],
    },
    {
      id: 'proj-2',
      title: 'ApexMock — AI Real-Time Behavioral Interview Coach',
      techStack: 'TypeScript, React, Web Audio API, Google Gemini API, Tailwind CSS',
      link: 'github.com/arjun-venkatesh/apexmock',
      duration: 'Oct 2024 – Dec 2024',
      bullets: [
        'Built a full-duplex speech feedback platform evaluating interview answers across STAR structure, technical depth, and pacing in sub-1.2 seconds.',
        'Adopted by 450+ campus students with an average 27% increase in mock interview confidence ratings.',
      ],
    },
  ],
  algorithmicBenchmarks: [
    'Solved 650+ Data Structures & Algorithms challenges across LeetCode (Knight Badge, Top 4.8%) and Codeforces (Rating 1640+).',
    'Ranked 142nd out of 18,000+ teams in National Hackathon 2025 for building a real-time fault-tolerant edge gateway.',
  ],
  certificationsAndPublications: [
    'AWS Certified Solutions Architect – Associate (Validation ID: AWS-SAA-2025-88219)',
    'Meta Certified Front-End Developer & Professional Backend Systems Engineering',
    'Published paper on "Optimizing Write Latency in Hybrid Sharded Document Stores" in Student IEEE Symposium 2025',
  ],
  leadershipAndImpact: [
    'Chief Student Coordinator, Annual Tech Fest: Supervised 40+ campus volunteers and managed a ₹6.5 Lakh technical event budget.',
    'Head Mentor, Competitive Programming Club: Conducted 24 weekly workshops on Dynamic Programming and Graphs for 250+ sophomores.',
  ],
};

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
      bullets: [''],
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: '',
      techStack: '',
      link: '',
      duration: '',
      bullets: [''],
    },
  ],
  algorithmicBenchmarks: [''],
  certificationsAndPublications: [''],
  leadershipAndImpact: [''],
});

/**
 * Validates that EVERY input required for a standard global ATS resume is completed.
 * Returns exact missing fields, their category, and focus IDs.
 */
export function validateResumeData(data: ResumeStructuredData): {
  isValid: boolean;
  missingFields: MissingFieldInfo[];
  completionPercentage: number;
  totalFieldsCount: number;
  filledFieldsCount: number;
} {
  const missing: MissingFieldInfo[] = [];
  let totalCount = 0;
  let filledCount = 0;

  const checkField = (
    value: string | undefined,
    id: string,
    section: string,
    label: string,
    inputElementId: string,
    minLength = 1
  ) => {
    totalCount++;
    if (!value || value.trim().length < minLength) {
      missing.push({ id, section, label, inputElementId });
    } else {
      filledCount++;
    }
  };

  // 1. Personal Identity & Contact
  checkField(data.fullName, 'fullName', 'Identity', 'Full Name', 'input-fullName');
  checkField(data.professionalTitle, 'professionalTitle', 'Identity', 'Professional Title / Target Role', 'input-professionalTitle');
  checkField(data.email, 'email', 'Contact', 'Email Address', 'input-email');
  checkField(data.phone, 'phone', 'Contact', 'Phone Number', 'input-phone');
  checkField(data.location, 'location', 'Contact', 'City, Country', 'input-location');
  checkField(data.linkedin, 'linkedin', 'Links', 'LinkedIn Profile URL', 'input-linkedin');
  checkField(data.github, 'github', 'Links', 'GitHub Profile URL', 'input-github');
  checkField(data.codingProfile, 'codingProfile', 'Links', 'LeetCode / Coding Profile', 'input-codingProfile');
  checkField(data.executiveSummary, 'executiveSummary', 'Summary', 'Professional Summary', 'input-executiveSummary', 20);

  // 2. Education (all entries must be complete)
  if (!data.education || data.education.length === 0) {
    totalCount++;
    missing.push({
      id: 'edu-empty',
      section: 'Education',
      label: 'At least 1 Education entry is required',
      inputElementId: 'input-edu-degree-0',
    });
  } else {
    data.education.forEach((edu, idx) => {
      checkField(edu.degree, `edu-degree-${idx}`, 'Education', `Degree & Major (Entry #${idx + 1})`, `input-edu-degree-${idx}`);
      checkField(edu.institution, `edu-institution-${idx}`, 'Education', `University / College (Entry #${idx + 1})`, `input-edu-institution-${idx}`);
      checkField(edu.location, `edu-location-${idx}`, 'Education', `Location (Entry #${idx + 1})`, `input-edu-location-${idx}`);
      checkField(edu.duration, `edu-duration-${idx}`, 'Education', `Duration / Years (Entry #${idx + 1})`, `input-edu-duration-${idx}`);
      checkField(edu.score, `edu-score-${idx}`, 'Education', `CGPA / Percentage (Entry #${idx + 1})`, `input-edu-score-${idx}`);
      checkField(edu.coursework, `edu-coursework-${idx}`, 'Education', `Relevant Coursework (Entry #${idx + 1})`, `input-edu-coursework-${idx}`);
      checkField(edu.honors, `edu-honors-${idx}`, 'Education', `Honors / Distinctions (Entry #${idx + 1})`, `input-edu-honors-${idx}`);
    });
  }

  // 3. Technical Skills
  checkField(data.skills.languages, 'skills-languages', 'Skills', 'Programming Languages', 'input-skills-languages');
  checkField(data.skills.coreSystems, 'skills-coreSystems', 'Skills', 'Core CS & System Architecture', 'input-skills-coreSystems');
  checkField(data.skills.cloudDevOps, 'skills-cloudDevOps', 'Skills', 'Frameworks, Cloud & DevOps', 'input-skills-cloudDevOps');
  checkField(data.skills.databasesTools, 'skills-databasesTools', 'Skills', 'Databases & Developer Tools', 'input-skills-databasesTools');

  // 4. Work Experience & Internships
  if (!data.experience || data.experience.length === 0) {
    totalCount++;
    missing.push({
      id: 'exp-empty',
      section: 'Experience',
      label: 'At least 1 Work Experience or Internship entry is required',
      inputElementId: 'input-exp-role-0',
    });
  } else {
    data.experience.forEach((exp, idx) => {
      checkField(exp.role, `exp-role-${idx}`, 'Experience', `Job Role (Entry #${idx + 1})`, `input-exp-role-${idx}`);
      checkField(exp.organization, `exp-organization-${idx}`, 'Experience', `Organization / Company (Entry #${idx + 1})`, `input-exp-organization-${idx}`);
      checkField(exp.location, `exp-location-${idx}`, 'Experience', `Location (Entry #${idx + 1})`, `input-exp-location-${idx}`);
      checkField(exp.duration, `exp-duration-${idx}`, 'Experience', `Duration (Entry #${idx + 1})`, `input-exp-duration-${idx}`);

      const validBullets = exp.bullets.filter((b) => b && b.trim().length > 0);
      totalCount++;
      if (validBullets.length === 0) {
        missing.push({
          id: `exp-bullets-${idx}`,
          section: 'Experience',
          label: `At least 1 bullet point describing experience (Entry #${idx + 1})`,
          inputElementId: `input-exp-bullets-${idx}`,
        });
      } else {
        filledCount++;
      }
    });
  }

  // 5. Key Engineering Projects
  if (!data.projects || data.projects.length === 0) {
    totalCount++;
    missing.push({
      id: 'proj-empty',
      section: 'Projects',
      label: 'At least 1 Project entry is required',
      inputElementId: 'input-proj-title-0',
    });
  } else {
    data.projects.forEach((proj, idx) => {
      checkField(proj.title, `proj-title-${idx}`, 'Projects', `Project Title (Entry #${idx + 1})`, `input-proj-title-${idx}`);
      checkField(proj.techStack, `proj-techStack-${idx}`, 'Projects', `Tech Stack (Entry #${idx + 1})`, `input-proj-techStack-${idx}`);
      checkField(proj.link, `proj-link-${idx}`, 'Projects', `Project Link / Repo (Entry #${idx + 1})`, `input-proj-link-${idx}`);
      checkField(proj.duration, `proj-duration-${idx}`, 'Projects', `Project Duration (Entry #${idx + 1})`, `input-proj-duration-${idx}`);

      const validBullets = proj.bullets.filter((b) => b && b.trim().length > 0);
      totalCount++;
      if (validBullets.length === 0) {
        missing.push({
          id: `proj-bullets-${idx}`,
          section: 'Projects',
          label: `At least 1 bullet point describing project (Entry #${idx + 1})`,
          inputElementId: `input-proj-bullets-${idx}`,
        });
      } else {
        filledCount++;
      }
    });
  }

  // 6. Achievements
  const validAchievements = data.algorithmicBenchmarks.filter((b) => b && b.trim().length > 0);
  totalCount++;
  if (validAchievements.length === 0) {
    missing.push({
      id: 'achievements',
      section: 'Achievements',
      label: 'Algorithmic & Academic Achievements (At least 1 item)',
      inputElementId: 'input-algorithmicBenchmarks',
    });
  } else {
    filledCount++;
  }

  // 7. Certifications
  const validCerts = data.certificationsAndPublications.filter((c) => c && c.trim().length > 0);
  totalCount++;
  if (validCerts.length === 0) {
    missing.push({
      id: 'certifications',
      section: 'Certifications',
      label: 'Certifications & Publications (At least 1 item)',
      inputElementId: 'input-certificationsAndPublications',
    });
  } else {
    filledCount++;
  }

  // 8. Leadership
  const validLeadership = data.leadershipAndImpact.filter((l) => l && l.trim().length > 0);
  totalCount++;
  if (validLeadership.length === 0) {
    missing.push({
      id: 'leadership',
      section: 'Leadership',
      label: 'Leadership & Extra-Curricular Impact (At least 1 item)',
      inputElementId: 'input-leadershipAndImpact',
    });
  } else {
    filledCount++;
  }

  const completionPercentage = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

  return {
    isValid: missing.length === 0,
    missingFields: missing,
    completionPercentage,
    totalFieldsCount: totalCount,
    filledFieldsCount: filledCount,
  };
}

/**
 * Builds clean, un-congested, highly readable plain text for TXT export
 */
function convertDataToSpaciousPlainText(data: ResumeStructuredData): string {
  const border = '================================================================================';
  const subBorder = '--------------------------------------------------------------------------------';

  const eduBlocks = data.education
    .map(
      (e) =>
        `${e.degree.trim()} | ${e.institution.trim()} (${e.location.trim()})\n` +
        `Duration: ${e.duration.trim()} | Score / CGPA: ${e.score.trim()}\n` +
        `Relevant Coursework: ${e.coursework.trim()}\n` +
        `Honors & Distinctions: ${e.honors.trim()}`
    )
    .join('\n\n');

  const expBlocks = data.experience
    .map((x) => {
      const bullets = x.bullets
        .filter((b) => b.trim().length > 0)
        .map((b) => `  • ${b.trim()}`)
        .join('\n');
      return `${x.role.trim()} — ${x.organization.trim()} (${x.location.trim()}) | ${x.duration.trim()}\n${bullets}`;
    })
    .join('\n\n');

  const projBlocks = data.projects
    .map((p) => {
      const bullets = p.bullets
        .filter((b) => b.trim().length > 0)
        .map((b) => `  • ${b.trim()}`)
        .join('\n');
      return `${p.title.trim()} | Tech Stack: ${p.techStack.trim()} | ${p.duration.trim()}\nLink: ${p.link.trim()}\n${bullets}`;
    })
    .join('\n\n');

  const achBlocks = data.algorithmicBenchmarks
    .filter((b) => b.trim().length > 0)
    .map((b) => `  • ${b.trim()}`)
    .join('\n');

  const certBlocks = data.certificationsAndPublications
    .filter((c) => c.trim().length > 0)
    .map((c) => `  • ${c.trim()}`)
    .join('\n');

  const leadBlocks = data.leadershipAndImpact
    .filter((l) => l.trim().length > 0)
    .map((l) => `  • ${l.trim()}`)
    .join('\n');

  return `${data.fullName.trim().toUpperCase()}
${data.professionalTitle.trim()}
${data.location.trim()} | ${data.phone.trim()} | ${data.email.trim()}
LinkedIn: ${data.linkedin.trim()} | GitHub: ${data.github.trim()} | Coding: ${data.codingProfile.trim()}

${border}
PROFESSIONAL SUMMARY
${border}
${data.executiveSummary.trim()}

${border}
EDUCATION & ACADEMIC CREDENTIALS
${border}
${eduBlocks}

${border}
TECHNICAL SKILLS MATRIX
${border}
• Programming Languages: ${data.skills.languages.trim()}
• Core CS & Architecture: ${data.skills.coreSystems.trim()}
• Frameworks, Cloud & DevOps: ${data.skills.cloudDevOps.trim()}
• Databases & Developer Tools: ${data.skills.databasesTools.trim()}

${border}
WORK EXPERIENCE & INTERNSHIPS
${border}
${expBlocks}

${border}
KEY ENGINEERING PROJECTS
${border}
${projBlocks}

${border}
ALGORITHMIC & ACADEMIC ACHIEVEMENTS
${border}
${achBlocks}

${border}
CERTIFICATIONS & PUBLICATIONS
${border}
${certBlocks}

${border}
LEADERSHIP & EXTRA-CURRICULAR IMPACT
${border}
${leadBlocks}
`;
}

/**
 * Builds clean, spacious, universally standard Word (.doc) document
 */
function buildSpaciousWordHtmlDocument(data: ResumeStructuredData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${data.fullName} - Resume</title>
  <style>
    @page { size: A4; margin: 20mm 20mm 20mm 20mm; }
    body {
      font-family: 'Calibri', 'Segoe UI', 'Arial', sans-serif;
      font-size: 10.5pt;
      color: #111827;
      line-height: 1.55;
      margin: 0;
      padding: 32px 40px;
      max-width: 820px;
      margin-left: auto;
      margin-right: auto;
      background: #ffffff;
    }
    h1 {
      font-size: 22pt;
      font-weight: 800;
      color: #0B2545;
      margin: 0 0 4pt 0;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
    }
    .subtitle {
      font-size: 11.5pt;
      font-weight: 700;
      color: #13315C;
      margin-bottom: 6pt;
    }
    .contact-bar {
      font-size: 9.5pt;
      color: #374151;
      border-bottom: 2pt solid #0B2545;
      padding-bottom: 8pt;
      margin-bottom: 16pt;
      line-height: 1.6;
    }
    h2 {
      font-size: 11pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8pt;
      color: #0B2545;
      border-bottom: 1pt solid #CBD5E1;
      padding-bottom: 3pt;
      margin-top: 16pt;
      margin-bottom: 8pt;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      font-weight: 700;
      font-size: 10.5pt;
      color: #0F172A;
      margin-bottom: 2pt;
    }
    .item-sub {
      display: flex;
      justify-content: space-between;
      font-size: 9.5pt;
      color: #475569;
      margin-bottom: 4pt;
    }
    ul {
      margin: 4pt 0 10pt 20pt;
      padding: 0;
    }
    li {
      margin-bottom: 3pt;
      line-height: 1.55;
    }
    p {
      margin: 4pt 0 8pt 0;
      line-height: 1.55;
    }
  </style>
</head>
<body>
  <h1>${data.fullName}</h1>
  <div class="subtitle">${data.professionalTitle}</div>
  <div class="contact-bar">
    ${data.location} &bull; ${data.phone} &bull; ${data.email}<br/>
    LinkedIn: ${data.linkedin} &bull; GitHub: ${data.github} &bull; Coding: ${data.codingProfile}
  </div>

  <h2>Professional Summary</h2>
  <p>${data.executiveSummary}</p>

  <h2>Education &amp; Academic Credentials</h2>
  ${data.education
    .map(
      (e) => `
    <div class="item-header">
      <span>${e.degree} — ${e.institution}</span>
      <span>${e.duration}</span>
    </div>
    <div class="item-sub">
      <span>${e.location}</span>
      <span>${e.score}</span>
    </div>
    <p><strong>Relevant Coursework:</strong> ${e.coursework}</p>
    <p><strong>Academic Honors:</strong> ${e.honors}</p>
  `
    )
    .join('')}

  <h2>Technical Skills Matrix</h2>
  <ul>
    <li><strong>Programming Languages:</strong> ${data.skills.languages}</li>
    <li><strong>Core CS &amp; System Architecture:</strong> ${data.skills.coreSystems}</li>
    <li><strong>Frameworks, Cloud &amp; DevOps:</strong> ${data.skills.cloudDevOps}</li>
    <li><strong>Databases &amp; Developer Tools:</strong> ${data.skills.databasesTools}</li>
  </ul>

  <h2>Work Experience &amp; Internships</h2>
  ${data.experience
    .map(
      (x) => `
    <div class="item-header">
      <span>${x.role} — ${x.organization}</span>
      <span>${x.duration}</span>
    </div>
    <div class="item-sub">
      <span>${x.location}</span>
    </div>
    <ul>
      ${x.bullets
        .filter((b) => b.trim().length > 0)
        .map((b) => `<li>${b}</li>`)
        .join('')}
    </ul>
  `
    )
    .join('')}

  <h2>Key Engineering Projects</h2>
  ${data.projects
    .map(
      (p) => `
    <div class="item-header">
      <span>${p.title}</span>
      <span>${p.duration}</span>
    </div>
    <div class="item-sub">
      <span>Tech Stack: ${p.techStack}</span>
      <span>${p.link}</span>
    </div>
    <ul>
      ${p.bullets
        .filter((b) => b.trim().length > 0)
        .map((b) => `<li>${b}</li>`)
        .join('')}
    </ul>
  `
    )
    .join('')}

  <h2>Algorithmic &amp; Academic Achievements</h2>
  <ul>
    ${data.algorithmicBenchmarks
      .filter((b) => b.trim().length > 0)
      .map((b) => `<li>${b}</li>`)
      .join('')}
  </ul>

  <h2>Certifications &amp; Publications</h2>
  <ul>
    ${data.certificationsAndPublications
      .filter((c) => c.trim().length > 0)
      .map((c) => `<li>${c}</li>`)
      .join('')}
  </ul>

  <h2>Leadership &amp; Extra-Curricular Impact</h2>
  <ul>
    ${data.leadershipAndImpact
      .filter((l) => l.trim().length > 0)
      .map((l) => `<li>${l}</li>`)
      .join('')}
  </ul>
</body>
</html>`;
}

export const AtsResumeBuilder: React.FC<AtsResumeBuilderProps> = () => {
  const [resumeData, setResumeData] = useState<ResumeStructuredData>(() =>
    createEmptyStandardTemplate()
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [hasAttemptedProcess, setHasAttemptedProcess] = useState(false);
  const [previewZoom, setPreviewZoom] = useState<'normal' | 'large' | 'compact'>('normal');

  // Real-time validation computation
  const validation = useMemo(() => validateResumeData(resumeData), [resumeData]);

  // Safe filename
  const getSafeFilenameBase = () => {
    const cleaned = resumeData.fullName.trim().replace(/[^a-zA-Z0-9]+/g, '_');
    return cleaned.length > 0 ? `${cleaned}_Resume` : 'Standard_Resume';
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

  /**
   * Helper to scroll directly to any missing input field
   */
  const scrollToField = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
    }
  };

  /**
   * Enforces that ALL details are filled before processing or generating any download
   */
  const ensureValidBeforeProceed = (): boolean => {
    setHasAttemptedProcess(true);
    if (!validation.isValid) {
      setShowValidationAlert(true);
      // Smoothly scroll to top of form or first missing field
      if (validation.missingFields.length > 0) {
        scrollToField(validation.missingFields[0].inputElementId);
      }
      return false;
    }
    setShowValidationAlert(false);
    return true;
  };

  // Download PDF with validation gate
  const handleDownloadPdf = async () => {
    if (!ensureValidBeforeProceed()) return;

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

  // Download Text with validation gate
  const handleDownloadTxt = () => {
    if (!ensureValidBeforeProceed()) return;
    triggerBlobDownload(
      convertDataToSpaciousPlainText(resumeData),
      'text/plain;charset=utf-8',
      'txt'
    );
  };

  // Download Word doc with validation gate
  const handleDownloadWordDoc = () => {
    if (!ensureValidBeforeProceed()) return;
    const html = buildSpaciousWordHtmlDocument(resumeData);
    triggerBlobDownload(
      '\ufeff' + html,
      'application/msword;charset=utf-8',
      'doc'
    );
  };

  // Process & Validate button action
  const handleProcessResume = () => {
    setHasAttemptedProcess(true);
    if (validation.isValid) {
      setShowValidationAlert(false);
    } else {
      setShowValidationAlert(true);
      if (validation.missingFields.length > 0) {
        scrollToField(validation.missingFields[0].inputElementId);
      }
    }
  };

  // Load standard pre-filled exemplar
  const handleLoadSample = () => {
    setResumeData(JSON.parse(JSON.stringify(GLOBAL_STANDARD_SAMPLE)));
    setShowValidationAlert(false);
    setHasAttemptedProcess(false);
  };

  // Clear all fields
  const handleClearForm = () => {
    if (
      window.confirm(
        'Are you sure you want to clear all fields? Any unsaved input will be reset.'
      )
    ) {
      setResumeData(createEmptyStandardTemplate());
      setShowValidationAlert(false);
      setHasAttemptedProcess(false);
    }
  };

  // Check if a specific input is missing when validation is checked
  const isFieldMissing = (inputElementId: string) => {
    return hasAttemptedProcess && validation.missingFields.some((f) => f.inputElementId === inputElementId);
  };

  const getFieldClass = (inputElementId: string, baseClass = '') => {
    const missing = isFieldMissing(inputElementId);
    if (missing) {
      return `${baseClass} border-rose-400 ring-2 ring-rose-200/60 bg-rose-50/20 text-slate-900 focus:border-rose-500 focus:ring-rose-300`;
    }
    return `${baseClass} border-slate-200 focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545]/20`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-7 shadow-xs text-slate-900 space-y-6">
      {/* Dedicated Print-Only Stylesheet for pristine A4 export */}
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
            padding: 16mm 18mm !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            line-height: 1.6 !important;
          }
        }
      `}</style>

      {/* Top Header & Overview */}
      <div className="border-b border-slate-100 pb-4 print:hidden flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Resume Builder
            </h2>
            <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Valid Across Globe
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Spacious, non-congested standard format compliant with Harvard, Stanford & global engineering standards. All fields are mandatory to process.
          </p>
        </div>

        {/* Quick Sample Profile Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadSample}
            title="Load a complete, high-scoring sample candidate profile"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 hover:border-amber-400 text-amber-900 font-bold text-xs transition shadow-2xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Load Global Standard Sample</span>
          </button>

          <button
            type="button"
            onClick={handleClearForm}
            title="Clear all fields"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Real-Time Readiness Tracker & Action Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                validation.isValid
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {validation.completionPercentage}%
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  Resume Details Completion:
                </span>
                {validation.isValid ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    100% Complete · Ready to Process
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    {validation.missingFields.length} Required Field
                    {validation.missingFields.length === 1 ? '' : 's'} Pending
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {validation.filledFieldsCount} of {validation.totalFieldsCount} mandatory details completed. Global standard processing requires all details.
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleProcessResume}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                validation.isValid
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-[#0B2545] hover:bg-[#13315C] text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>
                {validation.isValid
                  ? 'Resume Verified & Valid'
                  : 'Process & Verify All Details'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B2545] hover:bg-[#13315C] text-white text-xs font-bold transition shadow-xs whitespace-nowrap cursor-pointer disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5 text-[#FDE047]" />
              <span>{isGeneratingPdf ? 'Generating Spacious PDF...' : 'Download PDF (.pdf)'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadWordDoc}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-800 transition whitespace-nowrap cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-700" />
              <span>Word (.doc)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTxt}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-800 transition whitespace-nowrap cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-700" />
              <span>Text (.txt)</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              validation.isValid ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `${validation.completionPercentage}%` }}
          />
        </div>
      </div>

      {/* PROMINENT WARNING BANNER WHEN UNFILLED DETAILS EXIST */}
      {showValidationAlert && !validation.isValid && (
        <div
          role="alert"
          className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 text-rose-950 space-y-3 animate-in fade-in duration-200 print:hidden"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-100 rounded-xl text-rose-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-extrabold text-rose-900 tracking-tight flex items-center gap-2">
                <span>Incomplete Resume Warning: All Details Must Be Filled</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
                  {validation.missingFields.length} Unfilled Fields
                </span>
              </h3>
              <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                To generate a professional resume valid across global recruiters, <strong>every input field must be filled</strong>. Unfilled fields have been highlighted below with red warning outlines. Click any item in the list below to jump directly to it:
              </p>

              {/* Clickable List of Missing Fields */}
              <div className="mt-3 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-white/70 rounded-xl border border-rose-200">
                {validation.missingFields.map((field) => (
                  <button
                    key={field.id}
                    type="button"
                    onClick={() => scrollToField(field.inputElementId)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 text-[11px] font-semibold transition cursor-pointer border border-rose-200 text-left"
                  >
                    <span>{field.label}</span>
                    <ChevronRight className="w-3 h-3 text-rose-500" />
                  </button>
                ))}
              </div>

              {/* Quick shortcut to auto-fill sample */}
              <div className="mt-3 pt-2 border-t border-rose-200/80 flex items-center justify-between text-xs">
                <span className="text-rose-700">
                  Want to test immediately? Load a pre-filled global standard profile with one click:
                </span>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="font-bold text-rose-900 underline hover:text-rose-700 cursor-pointer ml-2"
                >
                  Load Sample Data &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Split Workspace: Left = Form Inputs | Right = Spacious Global Standard Sheet */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-7 items-start">
        {/* Left 5 Columns: Ready-to-Enter User Input Fields */}
        <div className="xl:col-span-5 space-y-5 max-h-[960px] overflow-y-auto pr-1 print:hidden">
          {/* 01. Candidate Identity & Contact Details */}
          <div className="bg-[#FAFAFA] border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0B2545]">
                <Briefcase className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>01. Candidate Identity & Contact Info</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">All Mandatory</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-fullName"
                  type="text"
                  value={resumeData.fullName}
                  onChange={(e) =>
                    setResumeData({ ...resumeData, fullName: e.target.value })
                  }
                  placeholder="e.g. Arjun Venkatesh"
                  className={getFieldClass(
                    'input-fullName',
                    'w-full px-3 py-2 bg-white border rounded-lg font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none'
                  )}
                />
                {isFieldMissing('input-fullName') && (
                  <p className="text-[10px] text-rose-600 font-semibold mt-1">
                    ⚠️ Full name is required to process resume.
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Target Role / Professional Title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-professionalTitle"
                  type="text"
                  value={resumeData.professionalTitle}
                  onChange={(e) =>
                    setResumeData({
                      ...resumeData,
                      professionalTitle: e.target.value,
                    })
                  }
                  placeholder="e.g. Software Development Engineer | Distributed Systems"
                  className={getFieldClass(
                    'input-professionalTitle',
                    'w-full px-3 py-2 bg-white border rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none'
                  )}
                />
                {isFieldMissing('input-professionalTitle') && (
                  <p className="text-[10px] text-rose-600 font-semibold mt-1">
                    ⚠️ Professional title is required.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-email"
                  type="email"
                  value={resumeData.email}
                  onChange={(e) =>
                    setResumeData({ ...resumeData, email: e.target.value })
                  }
                  placeholder="arjun.venkatesh@alumni.edu"
                  className={getFieldClass(
                    'input-email',
                    'w-full px-3 py-2 bg-white border rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none'
                  )}
                />
                {isFieldMissing('input-email') && (
                  <p className="text-[10px] text-rose-600 font-semibold mt-1">
                    ⚠️ Valid email address required.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-phone"
                  type="text"
                  value={resumeData.phone}
                  onChange={(e) =>
                    setResumeData({ ...resumeData, phone: e.target.value })
                  }
                  placeholder="+91 98765 43210"
                  className={getFieldClass(
                    'input-phone',
                    'w-full px-3 py-2 bg-white border rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none'
                  )}
                />
                {isFieldMissing('input-phone') && (
                  <p className="text-[10px] text-rose-600 font-semibold mt-1">
                    ⚠️ Phone number required.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  City, Country <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-location"
                  type="text"
                  value={resumeData.location}
                  onChange={(e) =>
                    setResumeData({ ...resumeData, location: e.target.value })
                  }
                  placeholder="Bengaluru, India"
                  className={getFieldClass(
                    'input-location',
                    'w-full px-3 py-2 bg-white border rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none'
                  )}
                />
                {isFieldMissing('input-location') && (
                  <p className="text-[10px] text-rose-600 font-semibold mt-1">
                    ⚠️ Location required.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  LinkedIn Profile URL <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-linkedin"
                  type="text"
                  value={resumeData.linkedin}
                  onChange={(e) =>
                    setResumeData({ ...resumeData, linkedin: e.target.value })
                  }
                  placeholder="linkedin.com/in/username"
                  className={getFieldClass(
                    'input-linkedin',
                    'w-full px-3 py-2 bg-white border rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none'
                  )}
                />
                {isFieldMissing('input-linkedin') && (
                  <p className="text-[10px] text-rose-600 font-semibold mt-1">
                    ⚠️ LinkedIn required.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  GitHub Profile / Portfolio <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-github"
                  type="text"
                  value={resumeData.github}
                  onChange={(e) =>
                    setResumeData({ ...resumeData, github: e.target.value })
                  }
                  placeholder="github.com/username"
                  className={getFieldClass(
                    'input-github',
                    'w-full px-3 py-2 bg-white border rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none'
                  )}
                />
                {isFieldMissing('input-github') && (
                  <p className="text-[10px] text-rose-600 font-semibold mt-1">
                    ⚠️ GitHub required.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  LeetCode / Coding Profile <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-codingProfile"
                  type="text"
                  value={resumeData.codingProfile}
                  onChange={(e) =>
                    setResumeData({
                      ...resumeData,
                      codingProfile: e.target.value,
                    })
                  }
                  placeholder="leetcode.com/username (500+ solved)"
                  className={getFieldClass(
                    'input-codingProfile',
                    'w-full px-3 py-2 bg-white border rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none'
                  )}
                />
                {isFieldMissing('input-codingProfile') && (
                  <p className="text-[10px] text-rose-600 font-semibold mt-1">
                    ⚠️ Coding profile required.
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Professional Executive Summary (Min 20 characters){' '}
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="input-executiveSummary"
                rows={3}
                value={resumeData.executiveSummary}
                onChange={(e) =>
                  setResumeData({
                    ...resumeData,
                    executiveSummary: e.target.value,
                  })
                }
                placeholder="Results-driven Software Engineer specializing in scalable backend architectures and distributed systems..."
                className={getFieldClass(
                  'input-executiveSummary',
                  'w-full p-2.5 bg-white border rounded-lg text-xs text-slate-800 placeholder:text-slate-400 leading-relaxed focus:outline-none'
                )}
              />
              {isFieldMissing('input-executiveSummary') && (
                <p className="text-[10px] text-rose-600 font-semibold mt-1">
                  ⚠️ Professional summary must be filled.
                </p>
              )}
            </div>
          </div>

          {/* 02. Education */}
          <div className="bg-[#FAFAFA] border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
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
                className="flex items-center gap-1 text-[11px] font-semibold text-[#0B2545] hover:underline cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Education</span>
              </button>
            </div>

            {resumeData.education.map((edu, idx) => (
              <div
                key={edu.id}
                className="bg-white border border-slate-200 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-700 text-xs">
                    Education Entry #{idx + 1}
                  </span>
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
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Remove education entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      id={`input-edu-degree-${idx}`}
                      type="text"
                      value={edu.degree}
                      onChange={(e) => {
                        const next = [...resumeData.education];
                        next[idx] = { ...edu, degree: e.target.value };
                        setResumeData({ ...resumeData, education: next });
                      }}
                      placeholder="Degree & Major (e.g. B.Tech in Computer Science)"
                      className={getFieldClass(
                        `input-edu-degree-${idx}`,
                        'w-full px-2.5 py-1.5 bg-[#FAFAFA] border rounded font-semibold text-slate-900 placeholder:text-slate-400'
                      )}
                    />
                  </div>

                  <input
                    id={`input-edu-institution-${idx}`}
                    type="text"
                    value={edu.institution}
                    onChange={(e) => {
                      const next = [...resumeData.education];
                      next[idx] = { ...edu, institution: e.target.value };
                      setResumeData({ ...resumeData, education: next });
                    }}
                    placeholder="University / College"
                    className={getFieldClass(
                      `input-edu-institution-${idx}`,
                      'w-full px-2.5 py-1.5 bg-[#FAFAFA] border rounded text-slate-800 placeholder:text-slate-400'
                    )}
                  />

                  <input
                    id={`input-edu-location-${idx}`}
                    type="text"
                    value={edu.location}
                    onChange={(e) => {
                      const next = [...resumeData.education];
                      next[idx] = { ...edu, location: e.target.value };
                      setResumeData({ ...resumeData, education: next });
                    }}
                    placeholder="Location (e.g. Karnataka, India)"
                    className={getFieldClass(
                      `input-edu-location-${idx}`,
                      'w-full px-2.5 py-1.5 bg-[#FAFAFA] border rounded text-slate-800 placeholder:text-slate-400'
                    )}
                  />

                  <input
                    id={`input-edu-duration-${idx}`}
                    type="text"
                    value={edu.duration}
                    onChange={(e) => {
                      const next = [...resumeData.education];
                      next[idx] = { ...edu, duration: e.target.value };
                      setResumeData({ ...resumeData, education: next });
                    }}
                    placeholder="Duration (e.g. 2022 – 2026)"
                    className={getFieldClass(
                      `input-edu-duration-${idx}`,
                      'w-full px-2.5 py-1.5 bg-[#FAFAFA] border rounded text-slate-800 placeholder:text-slate-400'
                    )}
                  />

                  <input
                    id={`input-edu-score-${idx}`}
                    type="text"
                    value={edu.score}
                    onChange={(e) => {
                      const next = [...resumeData.education];
                      next[idx] = { ...edu, score: e.target.value };
                      setResumeData({ ...resumeData, education: next });
                    }}
                    placeholder="CGPA / Score (e.g. CGPA: 9.32 / 10.0)"
                    className={getFieldClass(
                      `input-edu-score-${idx}`,
                      'w-full px-2.5 py-1.5 bg-[#FAFAFA] border rounded text-slate-800 placeholder:text-slate-400'
                    )}
                  />
                </div>

                <input
                  id={`input-edu-coursework-${idx}`}
                  type="text"
                  value={edu.coursework}
                  onChange={(e) => {
                    const next = [...resumeData.education];
                    next[idx] = { ...edu, coursework: e.target.value };
                    setResumeData({ ...resumeData, education: next });
                  }}
                  placeholder="Relevant Coursework (DSA, OS, DBMS, Networks, System Design)"
                  className={getFieldClass(
                    `input-edu-coursework-${idx}`,
                    'w-full px-2.5 py-1.5 bg-[#FAFAFA] border rounded text-slate-800 placeholder:text-slate-400'
                  )}
                />

                <input
                  id={`input-edu-honors-${idx}`}
                  type="text"
                  value={edu.honors}
                  onChange={(e) => {
                    const next = [...resumeData.education];
                    next[idx] = { ...edu, honors: e.target.value };
                    setResumeData({ ...resumeData, education: next });
                  }}
                  placeholder="Academic Honors / Distinctions / Scholarships"
                  className={getFieldClass(
                    `input-edu-honors-${idx}`,
                    'w-full px-2.5 py-1.5 bg-[#FAFAFA] border rounded text-slate-800 placeholder:text-slate-400'
                  )}
                />
              </div>
            ))}
          </div>

          {/* 03. Technical Skills Matrix */}
          <div className="bg-[#FAFAFA] border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2 font-bold text-[#0B2545]">
                <Code2 className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>03. Technical Skills Matrix</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">All 4 Mandatory</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Programming Languages <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-skills-languages"
                type="text"
                value={resumeData.skills.languages}
                onChange={(e) =>
                  setResumeData({
                    ...resumeData,
                    skills: { ...resumeData.skills, languages: e.target.value },
                  })
                }
                placeholder="e.g. TypeScript, JavaScript, Python, Java, C++, SQL, Go"
                className={getFieldClass(
                  'input-skills-languages',
                  'w-full px-2.5 py-1.5 bg-white border rounded text-slate-800 placeholder:text-slate-400'
                )}
              />
              {isFieldMissing('input-skills-languages') && (
                <p className="text-[10px] text-rose-600 font-semibold mt-1">
                  ⚠️ Programming languages must be entered.
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Core CS & Systems Architecture <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-skills-coreSystems"
                type="text"
                value={resumeData.skills.coreSystems}
                onChange={(e) =>
                  setResumeData({
                    ...resumeData,
                    skills: { ...resumeData.skills, coreSystems: e.target.value },
                  })
                }
                placeholder="e.g. OOP, Distributed Systems, Microservices, REST APIs, Concurrency"
                className={getFieldClass(
                  'input-skills-coreSystems',
                  'w-full px-2.5 py-1.5 bg-white border rounded text-slate-800 placeholder:text-slate-400'
                )}
              />
              {isFieldMissing('input-skills-coreSystems') && (
                <p className="text-[10px] text-rose-600 font-semibold mt-1">
                  ⚠️ Core CS & architecture must be entered.
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Frameworks, Cloud & DevOps <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-skills-cloudDevOps"
                type="text"
                value={resumeData.skills.cloudDevOps}
                onChange={(e) =>
                  setResumeData({
                    ...resumeData,
                    skills: { ...resumeData.skills, cloudDevOps: e.target.value },
                  })
                }
                placeholder="e.g. React, Node.js, Next.js, Docker, Kubernetes, AWS, Redis, Kafka"
                className={getFieldClass(
                  'input-skills-cloudDevOps',
                  'w-full px-2.5 py-1.5 bg-white border rounded text-slate-800 placeholder:text-slate-400'
                )}
              />
              {isFieldMissing('input-skills-cloudDevOps') && (
                <p className="text-[10px] text-rose-600 font-semibold mt-1">
                  ⚠️ Cloud & DevOps tools must be entered.
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Databases & Developer Tools <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-skills-databasesTools"
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
                placeholder="e.g. PostgreSQL, MongoDB, Redis, Git, Linux, Bash, Postman, Jest"
                className={getFieldClass(
                  'input-skills-databasesTools',
                  'w-full px-2.5 py-1.5 bg-white border rounded text-slate-800 placeholder:text-slate-400'
                )}
              />
              {isFieldMissing('input-skills-databasesTools') && (
                <p className="text-[10px] text-rose-600 font-semibold mt-1">
                  ⚠️ Databases & developer tools must be entered.
                </p>
              )}
            </div>
          </div>

          {/* 04. Work Experience & Internships */}
          <div className="bg-[#FAFAFA] border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
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
                        bullets: [''],
                      },
                    ],
                  })
                }
                className="flex items-center gap-1 text-[11px] font-semibold text-[#0B2545] hover:underline cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Experience</span>
              </button>
            </div>

            {resumeData.experience.map((exp, expIdx) => (
              <div
                key={exp.id}
                className="bg-white border border-slate-200 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-700 text-xs">
                    Experience Entry #{expIdx + 1}
                  </span>
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
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Remove experience"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    id={`input-exp-role-${expIdx}`}
                    type="text"
                    value={exp.role}
                    onChange={(e) => {
                      const next = [...resumeData.experience];
                      next[expIdx] = { ...exp, role: e.target.value };
                      setResumeData({ ...resumeData, experience: next });
                    }}
                    placeholder="Role Title (e.g. Software Engineering Intern)"
                    className={getFieldClass(
                      `input-exp-role-${expIdx}`,
                      'w-full px-2.5 py-1.5 bg-[#FAFAFA] border rounded font-semibold text-slate-900 placeholder:text-slate-400'
                    )}
                  />
                  <input
                    id={`input-exp-organization-${expIdx}`}
                    type="text"
                    value={exp.organization}
                    onChange={(e) => {
                      const next = [...resumeData.experience];
                      next[expIdx] = { ...exp, organization: e.target.value };
                      setResumeData({ ...resumeData, experience: next });
                    }}
                    placeholder="Company / Organization"
                    className={getFieldClass(
                      `input-exp-organization-${expIdx}`,
                      'w-full px-2.5 py-1.5 bg-[#FAFAFA] border rounded text-slate-800 placeholder:text-slate-400'
                    )}
                  />
                  <input
                    id={`input-exp-location-${expIdx}`}
                    type="text"
                    value={exp.location}
                    onChange={(e) => {
                      const next = [...resumeData.experience];
                      next[expIdx] = { ...exp, location: e.target.value };
                      setResumeData({ ...resumeData, experience: next });
                    }}
                    placeholder="Location (e.g. Bengaluru, India)"
                    className={getFieldClass(
                      `input-exp-location-${expIdx}`,
                      'w-full px-2.5 py-1.5 bg-[#FAFAFA] border rounded text-slate-800 placeholder:text-slate-400'
                    )}
                  />
                  <input
                    id={`input-exp-duration-${expIdx}`}
                    type="text"
                    value={exp.duration}
                    onChange={(e) => {
                      const next = [...resumeData.experience];
                      next[expIdx] = { ...exp, duration: e.target.value };
                      setResumeData({ ...resumeData, experience: next });
                    }}
                    placeholder="Duration (e.g. May 2025 – July 2025)"
                    className={getFieldClass(
                      `input-exp-duration-${expIdx}`,
                      'w-full px-2.5 py-1.5 bg-[#FAFAFA] border rounded text-slate-800 placeholder:text-slate-400'
                    )}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    Accomplishments & Impact Bullets (1 per line) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id={`input-exp-bullets-${expIdx}`}
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
                      '• Architected an analytics microservice processing 4.2M daily events with sub-45ms latency.\n• Refactored PostgreSQL queries and added indexes, decreasing p99 latency by 38%.'
                    }
                    className={getFieldClass(
                      `input-exp-bullets-${expIdx}`,
                      'w-full p-2 bg-[#FAFAFA] border rounded text-[11px] text-slate-800 placeholder:text-slate-400 leading-relaxed'
                    )}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 05. Key Engineering Projects */}
          <div className="bg-[#FAFAFA] border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2 font-bold text-[#0B2545]">
                <Code2 className="w-3.5 h-3.5 text-[#B8860B]" />
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
                        bullets: [''],
                      },
                    ],
                  })
                }
                className="flex items-center gap-1 text-[11px] font-semibold text-[#0B2545] hover:underline cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Project</span>
              </button>
            </div>

            {resumeData.projects.map((proj, projIdx) => (
              <div
                key={proj.id}
                className="bg-white border border-slate-200 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-700 text-xs">
                    Project Entry #{projIdx + 1}
                  </span>
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
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Remove project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    id={`input-proj-title-${projIdx}`}
                    type="text"
                    value={proj.title}
                    onChange={(e) => {
                      const next = [...resumeData.projects];
                      next[projIdx] = { ...proj, title: e.target.value };
                      setResumeData({ ...resumeData, projects: next });
                    }}
                    placeholder="Project Title (e.g. CloudFlow — Task Engine)"
                    className={getFieldClass(
                      `input-proj-title-${projIdx}`,
                      'w-full px-2.5 py-1.5 bg-[#FAFAFA] border rounded font-semibold text-slate-900 placeholder:text-slate-400'
                    )}
                  />
                  <input
                    id={`input-proj-techStack-${projIdx}`}
                    type="text"
                    value={proj.techStack}
                    onChange={(e) => {
                      const next = [...resumeData.projects];
                      next[projIdx] = { ...proj, techStack: e.target.value };
                      setResumeData({ ...resumeData, projects: next });
                    }}
                    placeholder="Tech Stack (e.g. Go, Redis, Docker, PostgreSQL)"
                    className={getFieldClass(
                      `input-proj-techStack-${projIdx}`,
                      'w-full px-2.5 py-1.5 bg-[#FAFAFA] border rounded text-slate-800 placeholder:text-slate-400'
                    )}
                  />
                  <input
                    id={`input-proj-link-${projIdx}`}
                    type="text"
                    value={proj.link}
                    onChange={(e) => {
                      const next = [...resumeData.projects];
                      next[projIdx] = { ...proj, link: e.target.value };
                      setResumeData({ ...resumeData, projects: next });
                    }}
                    placeholder="Project Repo / Live Link (e.g. github.com/user/repo)"
                    className={getFieldClass(
                      `input-proj-link-${projIdx}`,
                      'w-full px-2.5 py-1.5 bg-[#FAFAFA] border rounded text-slate-800 placeholder:text-slate-400'
                    )}
                  />
                  <input
                    id={`input-proj-duration-${projIdx}`}
                    type="text"
                    value={proj.duration}
                    onChange={(e) => {
                      const next = [...resumeData.projects];
                      next[projIdx] = { ...proj, duration: e.target.value };
                      setResumeData({ ...resumeData, projects: next });
                    }}
                    placeholder="Duration (e.g. Jan 2025 – March 2025)"
                    className={getFieldClass(
                      `input-proj-duration-${projIdx}`,
                      'w-full px-2.5 py-1.5 bg-[#FAFAFA] border rounded text-slate-800 placeholder:text-slate-400'
                    )}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    Architecture & Measurable Impact Bullets (1 per line) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id={`input-proj-bullets-${projIdx}`}
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
                      '• Engineered a distributed priority job execution engine supporting worker node autoscaling.\n• Benchmarked throughput at 14,000 tasks/second on an 8-core cluster.'
                    }
                    className={getFieldClass(
                      `input-proj-bullets-${projIdx}`,
                      'w-full p-2 bg-[#FAFAFA] border rounded text-[11px] text-slate-800 placeholder:text-slate-400 leading-relaxed'
                    )}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 06. Achievements, Certifications & Leadership */}
          <div className="bg-[#FAFAFA] border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2 font-bold text-[#0B2545]">
                <Award className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>06. Achievements, Certifications & Leadership</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">All Mandatory</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Algorithmic & Academic Achievements (1 per line) <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="input-algorithmicBenchmarks"
                rows={2}
                value={resumeData.algorithmicBenchmarks.join('\n')}
                onChange={(e) =>
                  setResumeData({
                    ...resumeData,
                    algorithmicBenchmarks: e.target.value.split('\n'),
                  })
                }
                placeholder="e.g. Solved 650+ DSA problems across LeetCode (Knight Badge, Top 4.8%)."
                className={getFieldClass(
                  'input-algorithmicBenchmarks',
                  'w-full p-2.5 bg-white border rounded-lg text-[11px] text-slate-800 placeholder:text-slate-400 leading-relaxed'
                )}
              />
              {isFieldMissing('input-algorithmicBenchmarks') && (
                <p className="text-[10px] text-rose-600 font-semibold mt-1">
                  ⚠️ At least one algorithmic achievement required.
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Certifications & Publications (1 per line) <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="input-certificationsAndPublications"
                rows={2}
                value={resumeData.certificationsAndPublications.join('\n')}
                onChange={(e) =>
                  setResumeData({
                    ...resumeData,
                    certificationsAndPublications: e.target.value.split('\n'),
                  })
                }
                placeholder="e.g. AWS Certified Solutions Architect – Associate (Validation ID: AWS-SAA-2025)"
                className={getFieldClass(
                  'input-certificationsAndPublications',
                  'w-full p-2.5 bg-white border rounded-lg text-[11px] text-slate-800 placeholder:text-slate-400 leading-relaxed'
                )}
              />
              {isFieldMissing('input-certificationsAndPublications') && (
                <p className="text-[10px] text-rose-600 font-semibold mt-1">
                  ⚠️ At least one certification or publication required.
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Leadership & Extra-Curricular Impact (1 per line) <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="input-leadershipAndImpact"
                rows={2}
                value={resumeData.leadershipAndImpact.join('\n')}
                onChange={(e) =>
                  setResumeData({
                    ...resumeData,
                    leadershipAndImpact: e.target.value.split('\n'),
                  })
                }
                placeholder="e.g. Head Mentor, Coding Club — Conducted 24 weekly workshops for 250+ sophomores."
                className={getFieldClass(
                  'input-leadershipAndImpact',
                  'w-full p-2.5 bg-white border rounded-lg text-[11px] text-slate-800 placeholder:text-slate-400 leading-relaxed'
                )}
              />
              {isFieldMissing('input-leadershipAndImpact') && (
                <p className="text-[10px] text-rose-600 font-semibold mt-1">
                  ⚠️ At least one leadership or impact item required.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right 7 Columns: Highly Spacious Standard A4 Resume Template Sheet */}
        <div className="xl:col-span-7 space-y-3">
          {/* Top Sheet Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-500 print:hidden">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Standard Spacious A4 Resume Layout (Worldwide Compliant)
              </span>
            </span>

            {/* View Zoom controls */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setPreviewZoom('compact')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                  previewZoom === 'compact'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fit Page
              </button>
              <button
                type="button"
                onClick={() => setPreviewZoom('normal')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                  previewZoom === 'normal'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => setPreviewZoom('large')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                  previewZoom === 'large'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Comfort
              </button>
            </div>
          </div>

          {/* THE RESUME SHEET: Spacious, un-congested, world-class typography */}
          <div
            id="standard-ats-resume-sheet"
            className={`bg-white border border-slate-300 rounded-xl shadow-md text-slate-900 transition-all ${
              previewZoom === 'compact'
                ? 'p-6 sm:p-8 text-xs'
                : previewZoom === 'large'
                ? 'p-8 sm:p-12 text-sm'
                : 'p-7 sm:p-10 text-xs'
            }`}
            style={{
              lineHeight: 1.6,
              fontFamily: "'Plus Jakarta Sans', 'Calibri', 'Inter', sans-serif",
            }}
          >
            {/* Header: Candidate Identity & Universal Contact Strip */}
            <div className="border-b-2 border-[#0B2545] pb-4 mb-5 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B2545] uppercase">
                  {resumeData.fullName ? (
                    resumeData.fullName
                  ) : (
                    <span className="text-slate-400 italic font-normal">[Candidate Full Name]</span>
                  )}
                </h1>
                <span className="text-xs font-semibold text-slate-600">
                  {resumeData.location ? (
                    resumeData.location
                  ) : (
                    <span className="text-slate-400 italic">[City, Country]</span>
                  )}
                </span>
              </div>

              <div className="text-xs sm:text-sm font-bold text-[#13315C] mt-1 tracking-wide">
                {resumeData.professionalTitle ? (
                  resumeData.professionalTitle
                ) : (
                  <span className="text-slate-400 italic font-normal">
                    [Professional Title / Target Engineering Role]
                  </span>
                )}
              </div>

              {/* Spacious, elegant contact bar */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-[11px] text-slate-600 mt-2.5 font-medium">
                <span>
                  {resumeData.phone ? resumeData.phone : <span className="text-slate-400 italic">[Phone]</span>}
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  {resumeData.email ? resumeData.email : <span className="text-slate-400 italic">[Email]</span>}
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  {resumeData.linkedin ? (
                    resumeData.linkedin
                  ) : (
                    <span className="text-slate-400 italic">[LinkedIn]</span>
                  )}
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  {resumeData.github ? (
                    resumeData.github
                  ) : (
                    <span className="text-slate-400 italic">[GitHub]</span>
                  )}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-[#0B2545]">
                  {resumeData.codingProfile ? (
                    resumeData.codingProfile
                  ) : (
                    <span className="text-slate-400 italic">[LeetCode / Coding Profile]</span>
                  )}
                </span>
              </div>
            </div>

            {/* Section 1: Professional Summary */}
            <div className="mb-5">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#0B2545] border-b border-slate-300 pb-1 mb-2.5">
                Professional Summary
              </h2>
              <p className="text-slate-800 leading-relaxed">
                {resumeData.executiveSummary ? (
                  resumeData.executiveSummary
                ) : (
                  <span className="text-slate-400 italic">
                    [Executive summary summarizing core problem-solving specialization, architecture background, and engineering achievements...]
                  </span>
                )}
              </p>
            </div>

            {/* Section 2: Education & Academic Credentials */}
            <div className="mb-5 space-y-3">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#0B2545] border-b border-slate-300 pb-1 mb-2.5">
                Education & Academic Credentials
              </h2>
              {resumeData.education.map((edu) => (
                <div key={edu.id} className="space-y-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {edu.degree ? edu.degree : <span className="text-slate-400 italic">[Degree & Major]</span>} —{' '}
                      {edu.institution ? edu.institution : <span className="text-slate-400 italic">[University]</span>}{' '}
                      <span className="font-normal text-slate-600">
                        ({edu.location ? edu.location : <span className="text-slate-400 italic">[Location]</span>})
                      </span>
                    </span>
                    <span className="font-semibold text-slate-700 tabular-nums text-xs">
                      {edu.duration ? edu.duration : <span className="text-slate-400 italic">[Duration]</span>} &bull;{' '}
                      <span className="text-[#0B2545] font-bold">
                        {edu.score ? edu.score : <span className="text-slate-400 italic">[Score / CGPA]</span>}
                      </span>
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    <strong className="text-slate-900">Relevant Coursework:</strong>{' '}
                    {edu.coursework ? (
                      edu.coursework
                    ) : (
                      <span className="text-slate-400 italic">[DSA, OS, DBMS, Networks, System Design]</span>
                    )}
                  </p>
                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    <strong className="text-slate-900">Honors & Distinctions:</strong>{' '}
                    {edu.honors ? (
                      edu.honors
                    ) : (
                      <span className="text-slate-400 italic">[Dean's List, Academic Merit Scholarships]</span>
                    )}
                  </p>
                </div>
              ))}
            </div>

            {/* Section 3: Technical Skills Matrix */}
            <div className="mb-5">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#0B2545] border-b border-slate-300 pb-1 mb-2.5">
                Technical Skills Matrix
              </h2>
              <div className="grid grid-cols-1 gap-1.5 text-slate-800 leading-relaxed">
                <div>
                  <strong className="text-slate-900">Programming Languages:</strong>{' '}
                  {resumeData.skills.languages ? (
                    resumeData.skills.languages
                  ) : (
                    <span className="text-slate-400 italic">[TypeScript, Python, Java, C++, SQL, Go]</span>
                  )}
                </div>
                <div>
                  <strong className="text-slate-900">Core CS & System Architecture:</strong>{' '}
                  {resumeData.skills.coreSystems ? (
                    resumeData.skills.coreSystems
                  ) : (
                    <span className="text-slate-400 italic">[OOP, Distributed Systems, Microservices, REST APIs]</span>
                  )}
                </div>
                <div>
                  <strong className="text-slate-900">Frameworks, Cloud & DevOps:</strong>{' '}
                  {resumeData.skills.cloudDevOps ? (
                    resumeData.skills.cloudDevOps
                  ) : (
                    <span className="text-slate-400 italic">[React, Node.js, Docker, Kubernetes, AWS, Redis, Kafka]</span>
                  )}
                </div>
                <div>
                  <strong className="text-slate-900">Databases & Developer Tools:</strong>{' '}
                  {resumeData.skills.databasesTools ? (
                    resumeData.skills.databasesTools
                  ) : (
                    <span className="text-slate-400 italic">[PostgreSQL, MongoDB, Redis, Git, Linux, Postman]</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Work Experience & Internships */}
            <div className="mb-5 space-y-3.5">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#0B2545] border-b border-slate-300 pb-1 mb-2.5">
                Work Experience & Internships
              </h2>
              {resumeData.experience.map((exp) => (
                <div key={exp.id} className="space-y-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {exp.role ? exp.role : <span className="text-slate-400 italic">[Role Title]</span>}
                      </span>
                      <span className="text-slate-700 text-xs font-medium">
                        {' '}
                        — {exp.organization ? exp.organization : <span className="text-slate-400 italic">[Organization]</span>} (
                        {exp.location ? exp.location : <span className="text-slate-400 italic">[Location]</span>})
                      </span>
                    </div>
                    <span className="font-semibold text-slate-600 tabular-nums text-xs">
                      {exp.duration ? exp.duration : <span className="text-slate-400 italic">[Duration]</span>}
                    </span>
                  </div>
                  <ul className="list-disc list-outside ml-4 space-y-1 text-slate-800 leading-relaxed text-[11px] sm:text-xs">
                    {(exp.bullets.length ? exp.bullets : ['']).map((b, i) => (
                      <li key={i}>
                        {b.trim().length > 0 ? (
                          b
                        ) : (
                          <span className="text-slate-400 italic">
                            [Describe architecture, scale, latency reduction, and measurable business/system impact]
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Section 5: Key Engineering Projects */}
            <div className="mb-5 space-y-3.5">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#0B2545] border-b border-slate-300 pb-1 mb-2.5">
                Key Engineering Projects
              </h2>
              {resumeData.projects.map((proj) => (
                <div key={proj.id} className="space-y-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {proj.title ? proj.title : <span className="text-slate-400 italic">[Project Title]</span>}
                      </span>
                      <span className="text-slate-600 text-xs">
                        {' '}
                        | Tech Stack:{' '}
                        {proj.techStack ? (
                          proj.techStack
                        ) : (
                          <span className="text-slate-400 italic">[Go, Redis, Docker, PostgreSQL]</span>
                        )}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-600 tabular-nums text-xs">
                      {proj.duration ? proj.duration : <span className="text-slate-400 italic">[Year]</span>} &bull;{' '}
                      <span className="text-[#0B2545]">
                        {proj.link ? proj.link : <span className="text-slate-400 italic">[Project Link]</span>}
                      </span>
                    </span>
                  </div>
                  <ul className="list-disc list-outside ml-4 space-y-1 text-slate-800 leading-relaxed text-[11px] sm:text-xs">
                    {(proj.bullets.length ? proj.bullets : ['']).map((b, i) => (
                      <li key={i}>
                        {b.trim().length > 0 ? (
                          b
                        ) : (
                          <span className="text-slate-400 italic">
                            [Engineered fault-tolerant mechanism, benchmarked throughput at 14,000 tasks/second]
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Section 6: Algorithmic & Academic Achievements */}
            <div className="mb-4">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#0B2545] border-b border-slate-300 pb-1 mb-2.5">
                Algorithmic & Academic Achievements
              </h2>
              <ul className="list-disc list-outside ml-4 space-y-1 text-slate-800 leading-relaxed text-[11px] sm:text-xs">
                {(resumeData.algorithmicBenchmarks.length
                  ? resumeData.algorithmicBenchmarks
                  : ['']
                ).map((item, idx) => (
                  <li key={idx}>
                    {item.trim().length > 0 ? (
                      item
                    ) : (
                      <span className="text-slate-400 italic">
                        [Solved 600+ DSA challenges across LeetCode & Codeforces, Top 5% ranking]
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Section 7: Certifications & Publications */}
            <div className="mb-4">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#0B2545] border-b border-slate-300 pb-1 mb-2.5">
                Certifications & Publications
              </h2>
              <ul className="list-disc list-outside ml-4 space-y-1 text-slate-800 leading-relaxed text-[11px] sm:text-xs">
                {(resumeData.certificationsAndPublications.length
                  ? resumeData.certificationsAndPublications
                  : ['']
                ).map((item, idx) => (
                  <li key={idx}>
                    {item.trim().length > 0 ? (
                      item
                    ) : (
                      <span className="text-slate-400 italic">
                        [AWS Certified Solutions Architect – Associate / Published paper in IEEE Symposium]
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Section 8: Leadership & Extra-Curricular Impact */}
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#0B2545] border-b border-slate-300 pb-1 mb-2.5">
                Leadership & Extra-Curricular Impact
              </h2>
              <ul className="list-disc list-outside ml-4 space-y-1 text-slate-800 leading-relaxed text-[11px] sm:text-xs">
                {(resumeData.leadershipAndImpact.length
                  ? resumeData.leadershipAndImpact
                  : ['']
                ).map((item, idx) => (
                  <li key={idx}>
                    {item.trim().length > 0 ? (
                      item
                    ) : (
                      <span className="text-slate-400 italic">
                        [Head Mentor, Coding Club — Mentored 250+ students in dynamic programming & algorithms]
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AtsResumeBuilder;
