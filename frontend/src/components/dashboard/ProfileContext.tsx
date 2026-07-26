'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  Briefcase,
  Edit2,
  FileText,
  Github,
  GraduationCap,
  Linkedin,
  Mail,
  Phone,
  Plus,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { getCurrentUser, updateCurrentUser } from '@/lib/currentUser';
import { SKELETON_CSS, SkeletonBlock, SkeletonCard } from './Skeleton';
import { GitHubConnect } from './GitHubConnect';

type EducationItem = {
  school: string;
  degree: string;
  period?: string;
  // raw dates for API
  startDate?: string;
  endDate?: string;
};

type ExperienceItem = {
  company: string;
  role: string;
  period: string;
  // raw dates for API
  startDate?: string;
  endDate?: string;
  type?: 'INTERNSHIP' | 'FULL_TIME' | 'PART_TIME' | 'FREELANCE';
};

export function ProfileContext() {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    portfolio: '',
    bio: '',
    skills: [] as string[],
    education: [] as EducationItem[],
    experience: [] as ExperienceItem[],
    extraLinks: [] as { platform: string; url: string }[],
  });
  // snapshot taken when edit mode opens — used to detect actual changes
  const [savedSnapshot, setSavedSnapshot] = useState('');

  const [newSkill, setNewSkill] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCurrentUser().then(user => {
      const linkedinLink = user.links.find(l => l.platform.toLowerCase() === 'linkedin')?.url ?? '';
      const githubLink = user.links.find(l => l.platform.toLowerCase() === 'github')?.url ?? '';
      const portfolioLink = user.links.find(l => l.platform.toLowerCase() === 'portfolio')?.url ?? '';
      setProfile({
        fullName: `${user.firstName}${user.middleName ? ' ' + user.middleName : ''} ${user.lastName}`.trim(),
        email: user.email,
        phone: user.phone ?? '',
        linkedin: linkedinLink,
        github: githubLink,
        portfolio: portfolioLink,
        bio: user.bio ?? '',
        skills: (user.skills as string[] | null) ?? [],
        education: user.educations.map(e => ({
          school: e.instituteName,
          degree: e.degree,
          startDate: e.startDate,
          endDate: e.endDate ?? undefined,
          period: `${e.startDate.slice(0, 4)}${e.endDate ? ' - ' + e.endDate.slice(0, 4) : ' - Present'}`,
        })),
        experience: user.works.map(w => ({
          company: w.companyName,
          role: w.position,
          type: w.type,
          startDate: w.startDate,
          endDate: w.endDate ?? undefined,
          period: `${w.startDate.slice(0, 4)}${w.endDate ? ' - ' + w.endDate.slice(0, 4) : ' - Present'}`,
        })),
        extraLinks: user.links.filter(l => !['linkedin', 'github', 'portfolio'].includes(l.platform.toLowerCase())).map(l => ({ platform: l.platform, url: l.url })),
      });
      setProfileLoading(false);
    }).catch(() => setProfileLoading(false));
  }, []);

  useEffect(() => {
    if (profileLoading) return;
    const cards = wrapRef.current?.querySelectorAll('.profile-card');
    if (cards) {
      gsap.fromTo(
        cards,
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, stagger: 0.09, ease: 'power3.out', delay: 0.05 }
      );
    }
  }, [profileLoading]);

  const handleEditStart = () => {
    setSavedSnapshot(JSON.stringify(profile));
    setIsEditing(true);
  };

  const handleSave = async () => {
    const currentSnapshot = JSON.stringify(profile);
    if (currentSnapshot === savedSnapshot) {
      // nothing changed — skip the API call
      setIsEditing(false);
      return;
    }

    setSaving(true);
    const nameParts = profile.fullName.trim().split(' ');

    const ensureUrl = (val: string) => {
      if (!val) return '';
      return val.startsWith('http') ? val : `https://${val}`;
    };

    const links = [
      profile.linkedin && { platform: 'linkedin', url: ensureUrl(profile.linkedin) },
      profile.github && { platform: 'github', url: ensureUrl(profile.github) },
      profile.portfolio && { platform: 'portfolio', url: ensureUrl(profile.portfolio) },
      ...profile.extraLinks.filter(l => l.platform.trim() && l.url.trim()).map(l => ({ platform: l.platform.trim(), url: ensureUrl(l.url) })),
    ].filter(Boolean) as { platform: string; url: string }[];

    try {
      await updateCurrentUser({
        email: profile.email || undefined,
        firstName: nameParts[0] ?? '',
        lastName: nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0] ?? '',
        phone: profile.phone || undefined,
        bio: profile.bio || undefined,
        skills: profile.skills,
        links,
        educations: profile.education.map(e => ({
          instituteName: e.school,
          degree: e.degree,
          startDate: e.startDate ?? `${(e.period?.split(' - ')[0] ?? '2020')}-01-01`,
          endDate: e.endDate ?? (e.period?.includes('Present') ? undefined : (`${e.period?.split(' - ')[1] ?? ''}-12-31`) || undefined),
        })),
        works: profile.experience.map(w => ({
          companyName: w.company,
          position: w.role,
          type: w.type ?? 'FULL_TIME',
          startDate: w.startDate ?? `${(w.period?.split(' - ')[0] ?? '2020')}-01-01`,
          endDate: w.endDate ?? (w.period?.includes('Present') ? undefined : (`${w.period?.split(' - ')[1] ?? ''}-12-31`) || undefined),
        })),
      });
      setSavedSnapshot(currentSnapshot);
    } catch { /* silent */ }
    setSaving(false);
    setIsEditing(false);
  };

  const removeSkill = (skill: string) => {
    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) });
  };

  const addSkill = () => {
    const trimmedSkill = newSkill.trim();
    if (trimmedSkill && !profile.skills.includes(trimmedSkill)) {
      setProfile({ ...profile, skills: [...profile.skills, trimmedSkill] });
      setNewSkill('');
    }
  };

  const addEducation = (education: EducationItem) => {
    setProfile({ ...profile, education: [...profile.education, education] });
  };

  const removeEducation = (index: number) => {
    setProfile({
      ...profile,
      education: profile.education.filter((_, itemIndex) => itemIndex !== index),
    });
  };

  const addExperience = (experience: ExperienceItem) => {
    setProfile({ ...profile, experience: [...profile.experience, experience] });
  };

  const removeExperience = (index: number) => {
    setProfile({
      ...profile,
      experience: profile.experience.filter((_, itemIndex) => itemIndex !== index),
    });
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    background: focusedField === field ? 'rgba(245,158,11,0.04)' : 'rgba(255,255,255,0.02)',
    border:
      focusedField === field
        ? '1px solid rgba(245,158,11,0.35)'
        : '1px solid rgba(255,255,255,0.07)',
    borderRadius: '4px',
    padding: '9px 12px',
    fontSize: '15px',
    color: '#f0ece4',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 300,
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box' as const,
    caretColor: '#f59e0b',
  });

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#a1a1aa',
    marginBottom: '7px',
    fontFamily: "'DM Mono', monospace",
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '15px',
    color: '#a1a1aa',
    fontWeight: 300,
    fontFamily: "'DM Sans', sans-serif",
    padding: '9px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  };

  return (
    <div ref={wrapRef} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&family=DM+Mono:wght@400;500&display=swap');

        @keyframes heroPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.3; transform:scale(1.8); }
        }

        .profile-card {
          background: #111114;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 4px;
          padding: 28px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04);
        }

        .link-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.02);
          transition: all 0.15s ease;
          cursor: pointer;
        }

        .link-row:hover {
          background: rgba(245,158,11,0.04);
          border-color: rgba(245,158,11,0.18);
        }

        .skill-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          font-size: 13px;
          color: #a1a1aa;
          font-family: 'DM Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: all 0.15s ease;
        }

        .skill-chip:hover {
          border-color: rgba(245,158,11,0.25);
          color: #d97706;
          background: rgba(245,158,11,0.04);
        }

        .skill-chip.editing {
          border-color: rgba(245,158,11,0.2);
          color: #d97706;
          background: rgba(245,158,11,0.05);
        }

        .edit-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 18px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 700;
          font-family: 'DM Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          cursor: pointer;
          transition: all 0.18s ease;
          border: none;
        }

        .edit-btn.active {
          background: #f59e0b;
          color: #0b0b0c;
          border: 2px solid #f59e0b;
        }

        .edit-btn.active:hover {
          transform: translateY(-1px) rotate(-0.4deg);
          box-shadow: 3px 3px 0 rgba(245,158,11,0.35);
        }

        .edit-btn.idle {
          background: transparent;
          color: #71717a;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .edit-btn.idle:hover {
          color: #a1a1aa;
          border-color: rgba(255,255,255,0.15);
        }

        .add-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 7px 14px;
          border-radius: 4px;
          background: transparent;
          border: 1px solid rgba(245,158,11,0.2);
          color: #d97706;
          font-size: 12px;
          font-weight: 600;
          font-family: 'DM Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .add-btn:hover {
          background: rgba(245,158,11,0.06);
          border-color: rgba(245,158,11,0.4);
        }

        .entry-card {
          padding: 14px;
          border-radius: 4px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          position: relative;
        }

        .entry-card.education {
          border-left: 2px solid rgba(245,158,11,0.3);
        }

        .entry-card.experience {
          border-left: 2px solid rgba(99,102,241,0.4);
        }

        .remove-entry-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          color: #52525b;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .remove-entry-btn:hover {
          color: #fca5a5;
          border-color: rgba(248,113,113,0.25);
          background: rgba(248,113,113,0.08);
        }

        .entry-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 14px;
          border-radius: 4px;
        }

        .entry-form.education {
          border: 1px solid rgba(245,158,11,0.2);
          background: rgba(245,158,11,0.03);
        }

        .entry-form.experience {
          border: 1px solid rgba(99,102,241,0.2);
          background: rgba(99,102,241,0.03);
        }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        textarea:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #0e0e11 inset !important;
          -webkit-text-fill-color: #f0ece4 !important;
        }

        input[type="date"] {
          color-scheme: dark;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0.5);
          cursor: pointer;
          opacity: 0.6;
          scale: 0.85;
        }
        select option {
          background: #111114;
          color: #f0ece4;
        }
      `,
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '12px',
              color: '#a1a1aa',
              marginBottom: '6px',
              fontFamily: "'DM Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
            }}
          >
            Dashboard / Profile
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
            Profile{' '}
            <em
              style={{
                fontStyle: 'italic',
                background:
                  'linear-gradient(135deg, #f59e0b 0%, #fde68a 55%, #f59e0b 100%)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Context
            </em>
          </h2>
          <p style={{ fontSize: '15px', color: '#52525b', marginTop: '6px', fontWeight: 300 }}>
            Your personal AI context - used to fill every form.
          </p>
        </div>
        <button className={`edit-btn ${isEditing ? 'active' : 'idle'}`} onClick={() => isEditing ? handleSave() : handleEditStart()}>
          <Edit2 size={12} />
          {isEditing ? (saving ? 'Saving…' : 'Save Profile') : 'Edit Profile'}
        </button>
      </div>

      {profileLoading ? (
        <>
          <style dangerouslySetInnerHTML={{ __html: SKELETON_CSS }} />
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'16px', marginBottom:'16px' }}>
            <SkeletonCard>
              <SkeletonBlock w="120px" h="12px" mb="22px" />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'18px', marginBottom:'18px' }}>
                {[1,2,3,4].map(i => <div key={i}><SkeletonBlock w="80px" h="10px" mb="7px" /><SkeletonBlock w="100%" h="38px" /></div>)}
              </div>
              <SkeletonBlock w="80px" h="10px" mb="7px" />
              <SkeletonBlock w="100%" h="72px" />
            </SkeletonCard>
            <SkeletonCard>
              <SkeletonBlock w="80px" h="12px" mb="20px" />
              {[1,2,3].map(i => <SkeletonBlock key={i} w="100%" h="44px" mb="8px" />)}
            </SkeletonCard>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'16px' }}>
            {[1,2,3].map(i => (
              <SkeletonCard key={i}>
                <SkeletonBlock w="100px" h="12px" mb="20px" />
                {[1,2,3].map(j => <SkeletonBlock key={j} w="100%" h="52px" mb="10px" />)}
              </SkeletonCard>
            ))}
          </div>
        </>
      ) : (
      <>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div className="profile-card">
          <div
            style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)',
              filter: 'blur(30px)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '22px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '4px',
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
              }}
            >
              <User size={13} />
            </div>
            <h3
              style={{
                fontSize: '17px',
                fontWeight: 800,
                color: '#f0ece4',
                letterSpacing: '-0.3px',
                fontFamily: "'Playfair Display', Georgia, serif",
                margin: 0,
              }}
            >
              Personal Details
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
            {[
              { key: 'fullName', label: 'Full Name', icon: <User size={10} />, type: 'text' },
              { key: 'email', label: 'Email', icon: <Mail size={10} />, type: 'email' },
              { key: 'phone', label: 'Phone', icon: <Phone size={10} />, type: 'text' },
              { key: 'portfolio', label: 'Portfolio', icon: <FileText size={10} />, type: 'text' },
            ].map(({ key, label, icon, type }) => (
              <div key={key}>
                <label style={labelStyle}>
                  {icon} {label}
                </label>
                {isEditing ? (
                  <input
                    type={type}
                    value={profile[key as keyof typeof profile] as string}
                    onChange={e => setProfile({ ...profile, [key]: e.target.value })}
                    onFocus={() => setFocusedField(key)}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle(key)}
                  />
                ) : (
                  <p style={valueStyle}>{profile[key as keyof typeof profile] as string}</p>
                )}
              </div>
            ))}
          </div>

          <div>
            <label style={labelStyle}>Bio</label>
            {isEditing ? (
              <textarea
                value={profile.bio}
                onChange={e => setProfile({ ...profile, bio: e.target.value })}
                onFocus={() => setFocusedField('bio')}
                onBlur={() => setFocusedField(null)}
                rows={3}
                style={{ ...inputStyle('bio'), resize: 'vertical', lineHeight: 1.6, minHeight: '72px' }}
              />
            ) : (
              <p style={{ ...valueStyle, borderBottom: 'none', lineHeight: 1.7 }}>{profile.bio}</p>
            )}
          </div>
        </div>

        <div className="profile-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '4px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
              <Linkedin size={13} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#f0ece4', letterSpacing: '-0.3px', fontFamily: "'Playfair Display', Georgia, serif", margin: 0 }}>
              Links
            </h3>
          </div>

          {/* Fixed links — editable in edit mode */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            {[
              { icon: <Linkedin size={14} />, label: 'LinkedIn', key: 'linkedin' as const },
              { icon: <Github size={14} />, label: 'GitHub', key: 'github' as const },
              { icon: <FileText size={14} />, label: 'Portfolio', key: 'portfolio' as const },
            ].map(({ icon, label, key }) => (
              <div key={label} className="link-row">
                <span style={{ color: '#52525b', flexShrink: 0 }}>{icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', color: '#3f3f46', margin: '0 0 2px', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {label}
                  </p>
                  {isEditing ? (
                    <input
                      value={profile[key]}
                      onChange={e => setProfile({ ...profile, [key]: e.target.value })}
                      onFocus={() => setFocusedField(key)}
                      onBlur={() => setFocusedField(null)}
                      placeholder={`https://${label.toLowerCase()}.com/...`}
                      style={{ ...inputStyle(key), padding: '5px 8px', fontSize: '13px' }}
                    />
                  ) : (
                    <p style={{ fontSize: '14px', color: '#71717a', margin: 0, fontWeight: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {profile[key] || <span style={{ color: '#3f3f46', fontStyle: 'italic' }}>Not set</span>}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Extra custom links */}
            {profile.extraLinks.map((link, i) => (
              <div key={i} className="link-row">
                <span style={{ color: '#52525b', flexShrink: 0 }}><FileText size={14} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', color: '#3f3f46', margin: '0 0 2px', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {link.platform}
                  </p>
                  <p style={{ fontSize: '14px', color: '#71717a', margin: 0, fontWeight: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {link.url}
                  </p>
                </div>
                {isEditing && (
                  <button onClick={() => setProfile({ ...profile, extraLinks: profile.extraLinks.filter((_, idx) => idx !== i) })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', padding: '4px', display: 'flex', flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#52525b')}>
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add link form — only in edit mode */}
          {isEditing && <AddLinkRow onAdd={link => setProfile({ ...profile, extraLinks: [...profile.extraLinks, link] })} inputStyle={inputStyle} setFocusedField={setFocusedField} />}

          {/* GitHub OAuth connect */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '10px', color: '#52525b', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
              GitHub Account
            </div>
            <GitHubConnect />
          </div>

          <div style={{ marginTop: '16px' }}>
            <svg width="80" height="8" viewBox="0 0 80 8" fill="none">
              <path d="M2 6 C15 2, 35 7, 50 4 C62 2, 72 6, 78 4" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3" />
            </svg>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        <div className="profile-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3
              style={{
                fontSize: '17px',
                fontWeight: 800,
                color: '#f0ece4',
                letterSpacing: '-0.3px',
                fontFamily: "'Playfair Display', Georgia, serif",
                margin: 0,
              }}
            >
              Skills{' '}
              <em
                style={{
                  fontStyle: 'italic',
                  background:
                    'linear-gradient(135deg, #f59e0b 0%, #fde68a 55%, #f59e0b 100%)',
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Expertise
              </em>
            </h3>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px 3px 7px',
                borderRadius: '4px',
                border: '1px solid rgba(245,158,11,0.2)',
                background: 'rgba(245,158,11,0.05)',
              }}
            >
              <span
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: '#f59e0b',
                  animation: 'heroPulse 2.5s infinite',
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  color: '#d97706',
                  fontFamily: "'DM Mono', monospace",
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {profile.skills.length} skills
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: isEditing ? '16px' : '0' }}>
            {profile.skills.map(skill => (
              <span key={skill} className={`skill-chip ${isEditing ? 'editing' : ''}`}>
                {skill}
                {isEditing && (
                  <button
                    onClick={() => removeSkill(skill)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: 'inherit',
                      lineHeight: 1,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <X size={10} />
                  </button>
                )}
              </span>
            ))}
          </div>

          {isEditing && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <input
                placeholder="Add skill..."
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSkill()}
                onFocus={() => setFocusedField('newSkill')}
                onBlur={() => setFocusedField(null)}
                style={{ ...inputStyle('newSkill'), flex: 1 }}
              />
              <button className="add-btn" onClick={addSkill} style={{ flexShrink: 0 }}>
                <Plus size={11} /> Add
              </button>
            </div>
          )}
        </div>

        <div className="profile-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '4px',
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
              }}
            >
              <GraduationCap size={13} />
            </div>
            <h3
              style={{
                fontSize: '17px',
                fontWeight: 800,
                color: '#f0ece4',
                letterSpacing: '-0.3px',
                fontFamily: "'Playfair Display', Georgia, serif",
                margin: 0,
              }}
            >
              Education{' '}
              <em
                style={{
                  fontStyle: 'italic',
                  background:
                    'linear-gradient(135deg, #f59e0b 0%, #fde68a 55%, #f59e0b 100%)',
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Background
              </em>
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {profile.education.map((edu, index) => (
              <div key={`${edu.school}-${edu.degree}-${index}`} className="entry-card education">
                {isEditing && (
                  <button
                    className="remove-entry-btn"
                    onClick={() => removeEducation(index)}
                    aria-label={`Remove education ${edu.school}`}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
                <p style={{ fontSize: '15px', color: '#d4d4d8', margin: '0 34px 3px 0', fontWeight: 500 }}>
                  {edu.school}
                </p>
                <p style={{ fontSize: '13px', color: '#71717a', margin: '0 34px 4px 0', fontWeight: 300 }}>
                  {edu.degree}
                </p>
                {edu.period && (
                  <p
                    style={{
                      fontSize: '11px',
                      color: '#52525b',
                      margin: 0,
                      fontFamily: "'DM Mono', monospace",
                      letterSpacing: '0.05em',
                    }}
                  >
                    {edu.period}
                  </p>
                )}
              </div>
            ))}
          </div>

          {isEditing && (
            <AddEducationRow
              onAdd={addEducation}
              inputStyle={inputStyle}
              setFocusedField={setFocusedField}
            />
          )}

          <div
            style={{
              marginTop: '20px',
              fontFamily: "'DM Mono', monospace",
              fontSize: '12px',
              color: 'rgba(255,255,255,0.07)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Used by AI to fill forms
          </div>
        </div>

        <div className="profile-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '4px',
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
              }}
            >
              <Briefcase size={13} />
            </div>
            <h3
              style={{
                fontSize: '17px',
                fontWeight: 800,
                color: '#f0ece4',
                letterSpacing: '-0.3px',
                fontFamily: "'Playfair Display', Georgia, serif",
                margin: 0,
              }}
            >
              Work{' '}
              <em
                style={{
                  fontStyle: 'italic',
                  background:
                    'linear-gradient(135deg,#818cf8 0%,#c4b5fd 55%,#818cf8 100%)',
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Experience
              </em>
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {profile.experience.map((exp, index) => (
              <div key={`${exp.company}-${exp.role}-${index}`} className="entry-card experience">
                {isEditing && (
                  <button
                    className="remove-entry-btn"
                    onClick={() => removeExperience(index)}
                    aria-label={`Remove work experience ${exp.role}`}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
                <p style={{ fontSize: '15px', color: '#d4d4d8', margin: '0 34px 2px 0', fontWeight: 500 }}>
                  {exp.role}
                </p>
                <p style={{ fontSize: '13px', color: '#71717a', margin: '0 34px 4px 0', fontWeight: 300 }}>
                  {exp.company}
                </p>
                <p
                  style={{
                    fontSize: '11px',
                    color: '#52525b',
                    margin: 0,
                    fontFamily: "'DM Mono', monospace",
                    letterSpacing: '0.05em',
                  }}
                >
                  {exp.period}
                </p>
              </div>
            ))}
          </div>

          {isEditing && (
            <AddExperienceRow
              onAdd={addExperience}
              inputStyle={inputStyle}
              setFocusedField={setFocusedField}
            />
          )}

          <div
            style={{
              marginTop: '20px',
              fontFamily: "'DM Mono', monospace",
              fontSize: '12px',
              color: 'rgba(255,255,255,0.07)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Used by AI to fill forms
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}

function AddLinkRow({
  onAdd,
  inputStyle,
  setFocusedField,
}: {
  onAdd: (link: { platform: string; url: string }) => void;
  inputStyle: (field: string) => React.CSSProperties;
  setFocusedField: (field: string | null) => void;
}) {
  const [form, setForm] = useState({ platform: '', url: '' });
  const [open, setOpen] = useState(false);

  const submit = () => {
    if (!form.platform.trim() || !form.url.trim()) return;
    onAdd({ platform: form.platform.trim(), url: form.url.trim() });
    setForm({ platform: '', url: '' });
    setOpen(false);
  };

  if (!open) {
    return (
      <button className="add-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setOpen(true)}>
        <Plus size={11} /> Add Link
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '4px', border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.03)', marginBottom: '8px' }}>
      <input placeholder="Platform (e.g. Twitter)" value={form.platform}
        onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
        onFocus={() => setFocusedField('link-platform')} onBlur={() => setFocusedField(null)}
        style={{ ...inputStyle('link-platform'), padding: '7px 10px', fontSize: '13px' }} />
      <input placeholder="URL (e.g. https://twitter.com/...)" value={form.url}
        onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
        onFocus={() => setFocusedField('link-url')} onBlur={() => setFocusedField(null)}
        style={{ ...inputStyle('link-url'), padding: '7px 10px', fontSize: '13px' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="add-btn" onClick={submit}
          disabled={!form.platform.trim() || !form.url.trim()}
          style={{ flex: 1, justifyContent: 'center' }}>
          <Plus size={11} /> Add
        </button>
        <button className="add-btn" onClick={() => setOpen(false)}
          style={{ justifyContent: 'center', borderColor: 'rgba(255,255,255,0.08)', color: '#52525b' }}>
          <X size={11} />
        </button>
      </div>
    </div>
  );
}

function AddEducationRow({
  onAdd,
  inputStyle,
  setFocusedField,
}: {
  onAdd: (education: EducationItem) => void;
  inputStyle: (field: string) => React.CSSProperties;
  setFocusedField: (field: string | null) => void;
}) {
  const [form, setForm] = useState({ school: '', degree: '', startDate: '', endDate: '' });
  const [open, setOpen] = useState(false);

  const submit = () => {
    if (!form.school.trim() || !form.degree.trim() || !form.startDate) return;
    const startYear = form.startDate.slice(0, 4);
    const endYear = form.endDate ? form.endDate.slice(0, 4) : 'Present';
    onAdd({
      school: form.school.trim(),
      degree: form.degree.trim(),
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      period: `${startYear} - ${endYear}`,
    });
    setForm({ school: '', degree: '', startDate: '', endDate: '' });
    setOpen(false);
  };

  if (!open) {
    return (
      <button className="add-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setOpen(true)}>
        <Plus size={11} /> Add Education
      </button>
    );
  }

  const fieldLabel = (text: string) => (
    <span style={{ display: 'block', fontSize: '10px', color: '#52525b', marginBottom: '5px', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
      {text}
    </span>
  );

  return (
    <div className="entry-form education">
      <input placeholder="School or University" value={form.school}
        onChange={e => setForm(c => ({ ...c, school: e.target.value }))}
        onFocus={() => setFocusedField('edu-school')} onBlur={() => setFocusedField(null)}
        style={inputStyle('edu-school')} />
      <input placeholder="Degree or Program" value={form.degree}
        onChange={e => setForm(c => ({ ...c, degree: e.target.value }))}
        onFocus={() => setFocusedField('edu-degree')} onBlur={() => setFocusedField(null)}
        style={inputStyle('edu-degree')} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          {fieldLabel('Start')}
          <input type="date" value={form.startDate}
            onChange={e => setForm(c => ({ ...c, startDate: e.target.value }))}
            style={{ ...inputStyle('edu-start'), fontSize: '13px' }} />
        </div>
        <div style={{ flex: 1 }}>
          {fieldLabel('End (blank = present)')}
          <input type="date" value={form.endDate}
            onChange={e => setForm(c => ({ ...c, endDate: e.target.value }))}
            style={{ ...inputStyle('edu-end'), fontSize: '13px' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="add-btn" onClick={submit}
          disabled={!form.school.trim() || !form.degree.trim() || !form.startDate}
          style={{ flex: 1, justifyContent: 'center' }}>
          <Plus size={11} /> Add
        </button>
        <button className="add-btn" onClick={() => setOpen(false)}
          style={{ justifyContent: 'center', borderColor: 'rgba(255,255,255,0.08)', color: '#52525b' }}>
          <X size={11} />
        </button>
      </div>
    </div>
  );
}

function AddExperienceRow({
  onAdd,
  inputStyle,
  setFocusedField,
}: {
  onAdd: (experience: ExperienceItem) => void;
  inputStyle: (field: string) => React.CSSProperties;
  setFocusedField: (field: string | null) => void;
}) {
  const [form, setForm] = useState({ company: '', role: '', startDate: '', endDate: '', type: 'FULL_TIME' as ExperienceItem['type'] });
  const [open, setOpen] = useState(false);

  const submit = () => {
    if (!form.role.trim() || !form.company.trim() || !form.startDate) return;
    const startYear = form.startDate.slice(0, 4);
    const endYear = form.endDate ? form.endDate.slice(0, 4) : 'Present';
    onAdd({
      company: form.company.trim(),
      role: form.role.trim(),
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      period: `${startYear} - ${endYear}`,
    });
    setForm({ company: '', role: '', startDate: '', endDate: '', type: 'FULL_TIME' });
    setOpen(false);
  };

  if (!open) {
    return (
      <button className="add-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setOpen(true)}>
        <Plus size={11} /> Add Work Experience
      </button>
    );
  }

  const fieldLabel = (text: string) => (
    <span style={{ display: 'block', fontSize: '10px', color: '#52525b', marginBottom: '5px', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
      {text}
    </span>
  );

  const selectStyle: React.CSSProperties = {
    ...inputStyle('exp-type'),
    fontSize: '13px',
    appearance: 'none' as const,
    cursor: 'pointer',
  };

  return (
    <div className="entry-form experience">
      <input placeholder="Role / Title" value={form.role}
        onChange={e => setForm(c => ({ ...c, role: e.target.value }))}
        onFocus={() => setFocusedField('exp-role')} onBlur={() => setFocusedField(null)}
        style={inputStyle('exp-role')} />
      <input placeholder="Company" value={form.company}
        onChange={e => setForm(c => ({ ...c, company: e.target.value }))}
        onFocus={() => setFocusedField('exp-company')} onBlur={() => setFocusedField(null)}
        style={inputStyle('exp-company')} />
      <select value={form.type} onChange={e => setForm(c => ({ ...c, type: e.target.value as ExperienceItem['type'] }))}
        style={selectStyle}>
        <option value="FULL_TIME">Full Time</option>
        <option value="PART_TIME">Part Time</option>
        <option value="INTERNSHIP">Internship</option>
        <option value="FREELANCE">Freelance</option>
      </select>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          {fieldLabel('Start')}
          <input type="date" value={form.startDate}
            onChange={e => setForm(c => ({ ...c, startDate: e.target.value }))}
            style={{ ...inputStyle('exp-start'), fontSize: '13px' }} />
        </div>
        <div style={{ flex: 1 }}>
          {fieldLabel('End (blank = present)')}
          <input type="date" value={form.endDate}
            onChange={e => setForm(c => ({ ...c, endDate: e.target.value }))}
            style={{ ...inputStyle('exp-end'), fontSize: '13px' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="add-btn" onClick={submit}
          disabled={!form.role.trim() || !form.company.trim() || !form.startDate}
          style={{ flex: 1, justifyContent: 'center' }}>
          <Plus size={11} /> Add
        </button>
        <button className="add-btn" onClick={() => setOpen(false)}
          style={{ justifyContent: 'center', borderColor: 'rgba(255,255,255,0.08)', color: '#52525b' }}>
          <X size={11} />
        </button>
      </div>
    </div>
  );
}
