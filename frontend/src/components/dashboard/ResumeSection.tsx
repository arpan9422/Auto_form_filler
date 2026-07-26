'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Briefcase,
  Calendar,
  CheckCircle,
  Cpu,
  Download,
  FileText,
  HardDrive,
  LayoutList,
  Link,
  Plus,
  Star,
  Trash2,
  Upload,
  User,
  Wrench,
  GraduationCap,
} from 'lucide-react';
import { resumesApi, type Resume as ApiResume } from '@/lib/services';

type ResumeItem = {
  id: string;
  filename: string;
  uploadedAt: Date;
  size: string;
  title: string;
  targetJob: string;
  description: string;
};

const EXTRACT_ITEMS = [
  { icon: User, label: 'Contact Information' },
  { icon: Briefcase, label: 'Work Experience' },
  { icon: GraduationCap, label: 'Education' },
  { icon: Wrench, label: 'Skills and Certifications' },
  { icon: Link, label: 'Projects and Links' },
  { icon: LayoutList, label: 'Custom Sections' },
];

const INITIAL_RESUMES: ResumeItem[] = [
  {
    id: 'resume-1',
    filename: 'John_Doe_Product_Resume.pdf',
    uploadedAt: new Date('2026-03-18'),
    size: '2.4 MB',
    title: 'Product Resume',
    targetJob: 'Product-focused frontend roles',
    description: 'Default version for general product companies and startup application flows.',
  },
  {
    id: 'resume-2',
    filename: 'John_Doe_Fintech_Resume.pdf',
    uploadedAt: new Date('2026-03-24'),
    size: '2.1 MB',
    title: 'Fintech Resume',
    targetJob: 'Fintech frontend engineer',
    description: 'Highlights payments, dashboards, trust-building UX, and regulated domain work.',
  },
];

export function ResumeSection() {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [currentResumeId, setCurrentResumeId] = useState<string>('');
  const [dragging, setDragging] = useState(false);
  const [pendingTitle, setPendingTitle] = useState('');
  const [pendingTargetJob, setPendingTargetJob] = useState('');
  const [pendingDescription, setPendingDescription] = useState('');
  const [replaceResumeId, setReplaceResumeId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    resumesApi.list().then(r => {
      const mapped: ResumeItem[] = r.data.map((res: ApiResume) => ({
        id: res.id,
        filename: res.pdfUrl.split('/').pop() ?? res.label,
        uploadedAt: new Date(res.createdAt),
        size: '—',
        title: res.label,
        targetJob: res.target ?? 'General applications',
        description: res.description ?? '',
      }));
      setResumes(mapped);
      const def = r.data.find((res: ApiResume) => res.isDefault);
      if (def) setCurrentResumeId(def.id);
      else if (mapped.length > 0) setCurrentResumeId(mapped[0].id);
    }).catch(() => {});
  }, []);

  const currentResume =
    resumes.find(resume => resume.id === currentResumeId) ?? resumes[0] ?? null;

  const openPicker = (resumeId?: string) => {
    setReplaceResumeId(resumeId ?? null);
    fileInputRef.current?.click();
  };

  const resetComposer = () => {
    setPendingTitle('');
    setPendingTargetJob('');
    setPendingDescription('');
    setReplaceResumeId(null);
  };

  const upsertResumeFromFile = async (file?: File) => {
    if (!file) return;
    const size = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
    setUploadError(null);
    setUploading(true);

    try {
      if (replaceResumeId) {
        const existing = resumes.find(r => r.id === replaceResumeId);
        if (existing) {
          const { data: { fileUrl } } = await resumesApi.uploadPdf(file);
          await resumesApi.update(replaceResumeId, {
            label: existing.title,
            target: existing.targetJob,
            description: existing.description,
            pdfUrl: fileUrl,
          });
          setResumes(curr => curr.map(r => r.id === replaceResumeId ? { ...r, filename: file.name, uploadedAt: new Date(), size } : r));
        }
        resetComposer();
        return;
      }

      const label = pendingTitle.trim() || file.name.replace(/\.pdf$/i, '');
      const target = pendingTargetJob.trim() || 'General applications';
      const description = pendingDescription.trim() || 'Resume version tailored for a specific application track.';

      const { data: { fileUrl } } = await resumesApi.uploadPdf(file);

      // Use functional updater to get accurate current count — avoids stale closure
      let isFirst = false;
      setResumes(curr => { isFirst = curr.length === 0; return curr; });

      const res = await resumesApi.create({ label, target, description, pdfUrl: fileUrl, isDefault: isFirst });
      const nextResume: ResumeItem = {
        id: res.data.id,
        filename: file.name,
        uploadedAt: new Date(),
        size,
        title: label,
        targetJob: target,
        description,
      };
      setResumes(curr => [nextResume, ...curr]);
      setCurrentResumeId(prev => prev || nextResume.id);
      resetComposer();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      console.error('[ResumeSection] upload error:', msg);
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file?.type === 'application/pdf') {
      upsertResumeFromFile(file);
    }
  };

  const deleteResume = async (resumeId: string) => {
    const nextResumes = resumes.filter(resume => resume.id !== resumeId);
    setResumes(nextResumes);
    if (resumeId === currentResumeId) setCurrentResumeId(nextResumes[0]?.id ?? '');
    await resumesApi.remove(resumeId).catch(() => {});
  };

  const setCurrentResume = async (id: string) => {
    setCurrentResumeId(id);
    await resumesApi.setDefault(id).catch(() => {});
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '4px',
    padding: '10px 12px',
    fontSize: '14px',
    color: '#f0ece4',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 300,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes heroPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.3; transform:scale(1.8); }
        }

        @keyframes fadeSlideIn {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }

        .rs-card {
          background: #111114;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 4px;
          padding: 28px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 6px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04);
          animation: fadeSlideIn .4s ease both;
        }

        .upload-zone {
          border: 1.5px dashed rgba(255,255,255,0.1);
          border-radius: 4px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          cursor: pointer;
          transition: border-color .2s, background .2s;
        }

        .upload-zone:hover,
        .upload-zone.drag-over {
          border-color: rgba(245,158,11,0.4);
          background: rgba(245,158,11,0.025);
        }

        .upload-zone.drag-over {
          border-color: rgba(245,158,11,0.7);
          background: rgba(245,158,11,0.05);
        }

        .resume-row {
          display: flex;
          gap: 16px;
          padding: 18px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02);
          transition: all .18s ease;
        }

        .resume-row.current {
          border-color: rgba(245,158,11,0.24);
          background: rgba(245,158,11,0.04);
        }

        .resume-row:hover {
          border-color: rgba(255,255,255,0.14);
          transform: translateY(-1px);
        }

        .status-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 4px;
          border: 1px solid rgba(52,211,153,0.2);
          background: rgba(52,211,153,0.04);
        }

        .rs-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          font-family: 'DM Mono', monospace;
          text-transform: uppercase;
          letter-spacing: .06em;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent;
          color: #52525b;
          transition: all .15s ease;
        }

        .rs-btn:hover {
          color: #a1a1aa;
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.03);
        }

        .rs-btn.primary {
          background: #f59e0b;
          color: #0b0b0c;
          border: 2px solid #f59e0b;
          font-weight: 700;
        }

        .rs-btn.primary:hover {
          transform: translateY(-1px);
          box-shadow: 2px 2px 0 rgba(245,158,11,0.35);
        }

        .rs-btn.danger:hover {
          color: #f87171;
          border-color: rgba(248,113,113,0.25);
          background: rgba(248,113,113,0.04);
        }

        .extract-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.04);
          background: rgba(255,255,255,0.01);
        }

        .extract-icon {
          width: 28px;
          height: 28px;
          border-radius: 4px;
          flex-shrink: 0;
          background: rgba(139,92,246,0.08);
          border: 1px solid rgba(139,92,246,0.14);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8b5cf6;
        }

        .meta-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          color: #52525b;
          font-family: 'DM Mono', monospace;
        }

        .current-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 9px;
          border-radius: 999px;
          border: 1px solid rgba(245,158,11,0.2);
          background: rgba(245,158,11,0.08);
          color: #d97706;
          font-size: 10px;
          font-family: 'DM Mono', monospace;
          text-transform: uppercase;
          letter-spacing: .06em;
        }
      `,
        }}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        style={{ display: 'none' }}
        onChange={event => {
          upsertResumeFromFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      <div style={{ marginBottom: '28px' }}>
        <div
          style={{
            fontSize: '14px',
            color: '#a1a1aa',
            marginBottom: '6px',
            fontFamily: "'DM Mono', monospace",
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
          }}
        >
          Dashboard / Resume
        </div>
        <h2
          style={{
            fontSize: '32px',
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '-1px',
            color: '#f0ece4',
            margin: 0,
            fontFamily: "'Playfair Display', Georgia, serif",
          }}
        >
          Resume{' '}
          <em
            style={{
              fontStyle: 'italic',
              background: 'linear-gradient(135deg,#f59e0b 0%,#fde68a 55%,#f59e0b 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Library
          </em>
        </h2>
        <p style={{ fontSize: '15px', color: '#52525b', marginTop: '6px', fontWeight: 300 }}>
          Keep multiple resume versions, store what job each one is for, and choose a current default version.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {resumes.length > 0 && (
          <div className="rs-card">
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '3px',
                height: '60px',
                background: 'rgba(245,158,11,0.35)',
                borderRadius: '0 0 2px 0',
              }}
            />

            <div className="status-banner" style={{ marginBottom: '18px' }}>
              <CheckCircle size={15} style={{ color: '#34d399', flexShrink: 0, marginTop: '1px' }} />
              <div>
                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#6ee7b7',
                    margin: 0,
                    fontFamily: "'DM Mono', monospace",
                    textTransform: 'uppercase',
                    letterSpacing: '.05em',
                  }}
                >
                  Current Default Resume
                </p>
                <p style={{ fontSize: '14px', color: '#52525b', margin: '4px 0 0', fontWeight: 300, lineHeight: 1.55 }}>
                  This version is used first for AI context and default application autofill.
                </p>
              </div>
            </div>

            {currentResume ? (
              <div className="resume-row current">
                <div
                  style={{
                    width: '44px',
                    height: '52px',
                    flexShrink: 0,
                    borderRadius: '4px',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '3px',
                  }}
                >
                  <FileText size={18} style={{ color: '#f87171' }} />
                  <span style={{ fontSize: '8px', color: '#f87171', fontFamily: "'DM Mono', monospace", letterSpacing: '.04em' }}>
                    PDF
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#f0ece4', margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>
                        {currentResume.title}
                      </h4>
                      <p style={{ fontSize: '13px', color: '#71717a', margin: '5px 0 0', fontWeight: 300 }}>
                        {currentResume.targetJob}
                      </p>
                    </div>
                    <span className="current-pill">
                      <Star size={10} /> Current
                    </span>
                  </div>

                  <p style={{ fontSize: '14px', color: '#a1a1aa', margin: '12px 0 0', lineHeight: 1.55, fontWeight: 300 }}>
                    {currentResume.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginTop: '12px', flexWrap: 'wrap' }}>
                    <span className="meta-pill">
                      <Calendar size={10} />
                      {currentResume.uploadedAt.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="meta-pill">
                      <HardDrive size={10} />
                      {currentResume.size}
                    </span>
                    <span className="meta-pill">
                      <FileText size={10} />
                      {currentResume.filename}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="upload-zone" onClick={() => openPicker()}>
                <p style={{ fontSize: '14px', color: '#71717a', margin: 0, fontWeight: 300 }}>
                  No current resume selected yet. Upload your first resume to get started.
                </p>
              </div>
            )}
          </div>
          )}

          <div
            className={`rs-card upload-zone${dragging ? ' drag-over' : ''}`}
            onClick={() => openPicker()}
            onDragOver={event => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', color: '#f0ece4', margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Add a New Resume Version
                </h3>
                <p style={{ fontSize: '14px', color: '#52525b', margin: '6px 0 0', fontWeight: 300 }}>
                  Upload a PDF and add a short note about which role or company this version is for.
                </p>
              </div>
              <button className="rs-btn primary" onClick={event => { event.stopPropagation(); openPicker(); }} disabled={uploading}>
                <Upload size={11} /> {uploading ? 'Uploading…' : 'Upload PDF'}
              </button>
            </div>

            {uploadError && (
              <p style={{ fontSize: '12px', color: '#f87171', margin: 0, fontFamily: "'DM Mono', monospace" }}>
                ✗ {uploadError}
              </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input
                placeholder="Resume label"
                value={pendingTitle}
                onChange={event => setPendingTitle(event.target.value)}
                style={inputStyle}
                onClick={event => event.stopPropagation()}
              />
              <input
                placeholder="Target job or company"
                value={pendingTargetJob}
                onChange={event => setPendingTargetJob(event.target.value)}
                style={inputStyle}
                onClick={event => event.stopPropagation()}
              />
            </div>

            <textarea
              placeholder="Short description for this version"
              value={pendingDescription}
              onChange={event => setPendingDescription(event.target.value)}
              style={{ ...inputStyle, minHeight: '84px', resize: 'vertical' }}
              onClick={event => event.stopPropagation()}
            />

            <p style={{ fontSize: '13px', color: '#52525b', margin: 0, fontWeight: 300 }}>
              PDF only. Drag and drop works here too.
            </p>
          </div>

          <div className="rs-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', color: '#f0ece4', margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Resume Versions
                </h3>
                <p style={{ fontSize: '14px', color: '#52525b', margin: '6px 0 0', fontWeight: 300 }}>
                  Keep different versions for different jobs and switch the default anytime.
                </p>
              </div>
              <span className="current-pill">
                {resumes.length} Stored
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {resumes.map(resume => {
                const isCurrent = resume.id === currentResumeId;

                return (
                  <div key={resume.id} className={`resume-row${isCurrent ? ' current' : ''}`}>
                    <div
                      style={{
                        width: '44px',
                        height: '52px',
                        flexShrink: 0,
                        borderRadius: '4px',
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                      }}
                    >
                      <FileText size={18} style={{ color: '#f87171' }} />
                      <span style={{ fontSize: '8px', color: '#f87171', fontFamily: "'DM Mono', monospace", letterSpacing: '.04em' }}>
                        PDF
                      </span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div>
                          <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f0ece4', margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>
                            {resume.title}
                          </h4>
                          <p style={{ fontSize: '13px', color: '#71717a', margin: '5px 0 0', fontWeight: 300 }}>
                            {resume.targetJob}
                          </p>
                        </div>
                        {isCurrent && (
                          <span className="current-pill">
                            <Star size={10} /> Default
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: '14px', color: '#a1a1aa', margin: '10px 0 0', lineHeight: 1.55, fontWeight: 300 }}>
                        {resume.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginTop: '12px', flexWrap: 'wrap' }}>
                        <span className="meta-pill">
                          <Calendar size={10} />
                          {resume.uploadedAt.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="meta-pill">
                          <HardDrive size={10} />
                          {resume.size}
                        </span>
                        <span className="meta-pill">
                          <FileText size={10} />
                          {resume.filename}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '14px' }}>
                        {!isCurrent && (
                          <button className="rs-btn primary" onClick={() => setCurrentResume(resume.id)}>
                            <Star size={11} /> Set Current
                          </button>
                        )}
                        <button className="rs-btn">
                          <Download size={11} /> Download
                        </button>
                        <button className="rs-btn" onClick={() => openPicker(resume.id)}>
                          <Upload size={11} /> Replace
                        </button>
                        <button className="rs-btn danger" onClick={() => deleteResume(resume.id)}>
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="rs-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <Cpu size={12} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '14px', color: '#d97706', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.07em' }}>
                Resume strategy
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="extract-item">
                <div className="extract-icon">
                  <Star size={13} />
                </div>
                <span style={{ fontSize: '14px', color: '#71717a', fontWeight: 300 }}>
                  One current default version is used first for autofill and AI context.
                </span>
              </div>
              <div className="extract-item">
                <div className="extract-icon">
                  <Briefcase size={13} />
                </div>
                <span style={{ fontSize: '14px', color: '#71717a', fontWeight: 300 }}>
                  Add a small note so you remember which role, team, or company a version targets.
                </span>
              </div>
              <div className="extract-item">
                <div className="extract-icon">
                  <Plus size={13} />
                </div>
                <span style={{ fontSize: '14px', color: '#71717a', fontWeight: 300 }}>
                  Upload new versions anytime without losing older tailored resumes.
                </span>
              </div>
            </div>
          </div>

          <div className="rs-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <Cpu size={12} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '14px', color: '#d97706', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.07em' }}>
                What we extract
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {EXTRACT_ITEMS.map(({ icon: Icon, label }) => (
                <div key={label} className="extract-item">
                  <div className="extract-icon">
                    <Icon size={13} />
                  </div>
                  <span style={{ fontSize: '14px', color: '#71717a', fontWeight: 300 }}>{label}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: '15px', color: '#3f3f46', margin: 0, fontFamily: "'DM Mono', monospace", lineHeight: 1.6 }}>
                Extracted data is used to auto-fill form fields and provide AI context.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
