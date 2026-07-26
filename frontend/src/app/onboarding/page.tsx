"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, GraduationCap, Link2, Plus, Sparkles, Trash2, User } from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  getCurrentUser,
  updateCurrentUser,
  type CurrentUser,
  type UserEducation,
  type UserProject,
  type UserWork,
} from "@/lib/currentUser";
import { removeToken } from "@/lib/auth";

type LinkDraft = {
  portfolio: string;
  linkedin: string;
  github: string;
};

type EducationDraft = {
  instituteName: string;
  degree: string;
  startDate: string;
  endDate: string;
  gpa: string;
};

type WorkDraft = {
  companyName: string;
  position: string;
  type: "INTERNSHIP" | "FULL_TIME" | "PART_TIME" | "FREELANCE";
  startDate: string;
  endDate: string;
};

type ProjectDraft = {
  name: string;
  description: string;
  projectLinks: string;
  techStacks: string;
};

const emptyEducation = (): EducationDraft => ({
  instituteName: "",
  degree: "",
  startDate: "",
  endDate: "",
  gpa: "",
});

const emptyWork = (): WorkDraft => ({
  companyName: "",
  position: "",
  type: "FULL_TIME",
  startDate: "",
  endDate: "",
});

const emptyProject = (): ProjectDraft => ({
  name: "",
  description: "",
  projectLinks: "",
  techStacks: "",
});

const toMonthValue = (value?: string | null) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 7);
};

const monthToIso = (value: string) => {
  if (!value) return "";
  return `${value}-01T00:00:00.000Z`;
};

const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const getErrorMessage = (error: unknown) => {
  const apiError = error as ApiError;

  return (
    apiError.data?.error ||
    apiError.data?.message ||
    apiError.message ||
    "Something went wrong while saving your onboarding details."
  );
};

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [links, setLinks] = useState<LinkDraft>({
    portfolio: "",
    linkedin: "",
    github: "",
  });
  const [educations, setEducations] = useState<EducationDraft[]>([]);
  const [works, setWorks] = useState<WorkDraft[]>([]);
  const [projects, setProjects] = useState<ProjectDraft[]>([]);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const currentUser = await getCurrentUser();

        if (currentUser.onboardingDone) {
          router.replace("/dashboard");
          return;
        }

        if (!mounted) {
          return;
        }

        setUser(currentUser);
        setFirstName(currentUser.firstName ?? "");
        setLastName(currentUser.lastName ?? "");
        setEmail(currentUser.email ?? "");
        setPhone(currentUser.phone ?? "");
        setBio(currentUser.bio ?? "");
        setSkillsInput((currentUser.skills ?? []).join(", "));
        setLinks({
          portfolio:
            currentUser.links.find((item) => item.platform === "portfolio")?.url ?? "",
          linkedin:
            currentUser.links.find((item) => item.platform === "linkedin")?.url ?? "",
          github: currentUser.links.find((item) => item.platform === "github")?.url ?? "",
        });
        setEducations(
          currentUser.educations.map((education: UserEducation) => ({
            instituteName: education.instituteName,
            degree: education.degree,
            startDate: toMonthValue(education.startDate),
            endDate: toMonthValue(education.endDate),
            gpa: education.gpa?.toString() ?? "",
          }))
        );
        setWorks(
          currentUser.works.map((work: UserWork) => ({
            companyName: work.companyName,
            position: work.position,
            type: work.type,
            startDate: toMonthValue(work.startDate),
            endDate: toMonthValue(work.endDate),
          }))
        );
        setProjects(
          currentUser.projects.map((project: UserProject) => ({
            name: project.name,
            description: project.description,
            projectLinks: project.projectLinks.join(", "),
            techStacks: project.techStacks.join(", "),
          }))
        );
      } catch {
        removeToken();
        router.replace("/");
        return;
      }

      if (mounted) {
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  const parsedSkills = useMemo(() => splitList(skillsInput), [skillsInput]);

  const updateEducation = (index: number, key: keyof EducationDraft, value: string) => {
    setEducations((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [key]: value } : entry
      )
    );
  };

  const updateWork = (index: number, key: keyof WorkDraft, value: string) => {
    setWorks((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [key]: value } : entry
      )
    );
  };

  const updateProject = (index: number, key: keyof ProjectDraft, value: string) => {
    setProjects((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [key]: value } : entry
      )
    );
  };

  const handleSave = async () => {
    if (parsedSkills.length === 0) {
      setErrorMessage("Add at least one skill so autofill has some context to work with.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await updateCurrentUser({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        skills: parsedSkills,
        onboardingDone: true,
        links: [
          links.portfolio.trim() ? { platform: "portfolio", url: links.portfolio.trim() } : null,
          links.linkedin.trim() ? { platform: "linkedin", url: links.linkedin.trim() } : null,
          links.github.trim() ? { platform: "github", url: links.github.trim() } : null,
        ].filter(Boolean) as Array<{ platform: string; url: string }>,
        educations: educations
          .filter((entry) => entry.instituteName.trim() && entry.degree.trim() && entry.startDate)
          .map((entry) => ({
            instituteName: entry.instituteName.trim(),
            degree: entry.degree.trim(),
            startDate: monthToIso(entry.startDate),
            endDate: entry.endDate ? monthToIso(entry.endDate) : undefined,
            gpa: entry.gpa ? Number(entry.gpa) : undefined,
          })),
        works: works
          .filter((entry) => entry.companyName.trim() && entry.position.trim() && entry.startDate)
          .map((entry) => ({
            companyName: entry.companyName.trim(),
            position: entry.position.trim(),
            type: entry.type,
            startDate: monthToIso(entry.startDate),
            endDate: entry.endDate ? monthToIso(entry.endDate) : undefined,
          })),
        projects: projects
          .filter((entry) => entry.name.trim() && entry.description.trim())
          .map((entry) => ({
            name: entry.name.trim(),
            description: entry.description.trim(),
            projectLinks: splitList(entry.projectLinks),
            techStacks: splitList(entry.techStacks),
          })),
      });

      setSuccessMessage("Profile saved. Taking you to the dashboard.");
      router.push("/dashboard");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0b0b0c", display: "grid", placeItems: "center", color: "#f0ece4" }}>
        <div style={{ textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ fontSize: "12px", color: "#d97706", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
            Preparing
          </div>
          <p style={{ margin: 0, color: "#71717a" }}>Loading your onboarding workspace.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0b0b0c", fontFamily: "'DM Sans', sans-serif", color: "#f0ece4" }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Mono:wght@400;500&display=swap');
            .onboard-card {
              background: #111114;
              border: 1px solid rgba(255,255,255,0.07);
              border-radius: 6px;
              box-shadow: 0 14px 44px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04);
            }
            .onboard-input, .onboard-textarea, .onboard-select {
              width: 100%;
              border-radius: 4px;
              border: 1px solid rgba(255,255,255,0.08);
              background: rgba(255,255,255,0.03);
              color: #f0ece4;
              font-size: 14px;
              font-family: 'DM Sans', sans-serif;
              padding: 12px 14px;
              outline: none;
              transition: border-color 0.2s ease, background 0.2s ease;
              box-sizing: border-box;
            }
            .onboard-input:focus, .onboard-textarea:focus, .onboard-select:focus {
              border-color: rgba(245,158,11,0.4);
              background: rgba(245,158,11,0.04);
            }
            .onboard-textarea {
              min-height: 108px;
              resize: vertical;
            }
            .onboard-label {
              display: block;
              margin-bottom: 8px;
              color: #a1a1aa;
              font-size: 11px;
              font-family: 'DM Mono', monospace;
              text-transform: uppercase;
              letter-spacing: 0.07em;
            }
            .mini-card {
              border: 1px solid rgba(255,255,255,0.06);
              background: rgba(255,255,255,0.02);
              border-radius: 4px;
              padding: 16px;
            }
            .outline-btn {
              border: 1px solid rgba(245,158,11,0.25);
              background: transparent;
              color: #f59e0b;
              border-radius: 4px;
              padding: 10px 14px;
              cursor: pointer;
              font-family: 'DM Mono', monospace;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.06em;
            }
            .primary-btn {
              border: 2px solid #f59e0b;
              background: #f59e0b;
              color: #0b0b0c;
              border-radius: 4px;
              padding: 12px 18px;
              cursor: pointer;
              font-family: 'DM Mono', monospace;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.06em;
            }
          `,
        }}
      />

      <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "48px 24px 72px" }}>
        <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "minmax(0, 1.6fr) minmax(280px, 0.8fr)" }}>
          <div className="onboard-card" style={{ padding: "28px" }}>
            <div style={{ marginBottom: "28px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <Sparkles size={14} style={{ color: "#f59e0b" }} />
                <span style={{ fontSize: "12px", color: "#d97706", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  First-time setup
                </span>
              </div>
              <h1 style={{ margin: 0, fontSize: "42px", lineHeight: 1, letterSpacing: "-1.6px", fontFamily: "'Playfair Display', Georgia, serif" }}>
                Finish your <em style={{ fontStyle: "italic", color: "#f59e0b" }}>profile</em>
              </h1>
              <p style={{ margin: "14px 0 0", fontSize: "15px", color: "#71717a", lineHeight: 1.7 }}>
                Add the basics that make autofill smarter. Only skills are required right now. Everything else can be expanded later from the dashboard.
              </p>
            </div>

            {(errorMessage || successMessage) && (
              <div
                style={{
                  marginBottom: "22px",
                  padding: "12px 14px",
                  borderRadius: "4px",
                  border: errorMessage
                    ? "1px solid rgba(248,113,113,0.22)"
                    : "1px solid rgba(52,211,153,0.2)",
                  background: errorMessage
                    ? "rgba(248,113,113,0.05)"
                    : "rgba(52,211,153,0.05)",
                  color: errorMessage ? "#fca5a5" : "#6ee7b7",
                }}
              >
                {errorMessage || successMessage}
              </div>
            )}

            <section style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <User size={16} style={{ color: "#f59e0b" }} />
                <h2 style={{ margin: 0, fontSize: "18px", fontFamily: "'Playfair Display', Georgia, serif" }}>Personal Details</h2>
              </div>
              <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <div>
                  <label className="onboard-label">First Name</label>
                  <input className="onboard-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" />
                </div>
                <div>
                  <label className="onboard-label">Last Name</label>
                  <input className="onboard-input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
                </div>
                <div>
                  <label className="onboard-label">Email</label>
                  <input className="onboard-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
                </div>
              </div>
            </section>

            <section style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <Link2 size={16} style={{ color: "#f59e0b" }} />
                <h2 style={{ margin: 0, fontSize: "18px", fontFamily: "'Playfair Display', Georgia, serif" }}>Links</h2>
              </div>
              <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <div>
                  <label className="onboard-label">Portfolio</label>
                  <input className="onboard-input" value={links.portfolio} onChange={(e) => setLinks((current) => ({ ...current, portfolio: e.target.value }))} placeholder="https://yourportfolio.com" />
                </div>
                <div>
                  <label className="onboard-label">LinkedIn</label>
                  <input className="onboard-input" value={links.linkedin} onChange={(e) => setLinks((current) => ({ ...current, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/..." />
                </div>
                <div>
                  <label className="onboard-label">GitHub</label>
                  <input className="onboard-input" value={links.github} onChange={(e) => setLinks((current) => ({ ...current, github: e.target.value }))} placeholder="https://github.com/..." />
                </div>
              </div>
            </section>

            <section style={{ marginBottom: "24px" }}>
              <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                <div>
                  <label className="onboard-label">Phone</label>
                  <input className="onboard-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="onboard-label">Short Bio</label>
                  <textarea className="onboard-textarea" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A short summary you want the assistant to use while filling forms." />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="onboard-label">Skills Required</label>
                  <textarea className="onboard-textarea" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="React, TypeScript, Node.js, Product Design" />
                  <p style={{ margin: "10px 0 0", color: "#71717a", fontSize: "13px" }}>
                    Separate skills with commas. We use these first when generating autofill context.
                  </p>
                </div>
              </div>
            </section>

            <section style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <GraduationCap size={16} style={{ color: "#f59e0b" }} />
                  <h2 style={{ margin: 0, fontSize: "18px", fontFamily: "'Playfair Display', Georgia, serif" }}>Education</h2>
                </div>
                <button className="outline-btn" type="button" onClick={() => setEducations((current) => [...current, emptyEducation()])}>
                  <Plus size={12} style={{ marginRight: "6px", verticalAlign: "middle" }} /> Add education
                </button>
              </div>

              <div style={{ display: "grid", gap: "14px" }}>
                {educations.map((education, index) => (
                  <div key={`education-${index}`} className="mini-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <span style={{ fontSize: "12px", color: "#d4d4d8", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                        Education {index + 1}
                      </span>
                      <button type="button" onClick={() => setEducations((current) => current.filter((_, currentIndex) => currentIndex !== index))} style={{ border: "none", background: "transparent", color: "#f87171", cursor: "pointer" }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                      <div>
                        <label className="onboard-label">Institute</label>
                        <input className="onboard-input" value={education.instituteName} onChange={(e) => updateEducation(index, "instituteName", e.target.value)} />
                      </div>
                      <div>
                        <label className="onboard-label">Degree</label>
                        <input className="onboard-input" value={education.degree} onChange={(e) => updateEducation(index, "degree", e.target.value)} />
                      </div>
                      <div>
                        <label className="onboard-label">Start month</label>
                        <input className="onboard-input" type="month" value={education.startDate} onChange={(e) => updateEducation(index, "startDate", e.target.value)} />
                      </div>
                      <div>
                        <label className="onboard-label">End month</label>
                        <input className="onboard-input" type="month" value={education.endDate} onChange={(e) => updateEducation(index, "endDate", e.target.value)} />
                      </div>
                      <div>
                        <label className="onboard-label">GPA</label>
                        <input className="onboard-input" value={education.gpa} onChange={(e) => updateEducation(index, "gpa", e.target.value)} placeholder="8.4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Briefcase size={16} style={{ color: "#f59e0b" }} />
                  <h2 style={{ margin: 0, fontSize: "18px", fontFamily: "'Playfair Display', Georgia, serif" }}>Work Experience</h2>
                </div>
                <button className="outline-btn" type="button" onClick={() => setWorks((current) => [...current, emptyWork()])}>
                  <Plus size={12} style={{ marginRight: "6px", verticalAlign: "middle" }} /> Add work
                </button>
              </div>

              <div style={{ display: "grid", gap: "14px" }}>
                {works.map((work, index) => (
                  <div key={`work-${index}`} className="mini-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <span style={{ fontSize: "12px", color: "#d4d4d8", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                        Work {index + 1}
                      </span>
                      <button type="button" onClick={() => setWorks((current) => current.filter((_, currentIndex) => currentIndex !== index))} style={{ border: "none", background: "transparent", color: "#f87171", cursor: "pointer" }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                      <div>
                        <label className="onboard-label">Company</label>
                        <input className="onboard-input" value={work.companyName} onChange={(e) => updateWork(index, "companyName", e.target.value)} />
                      </div>
                      <div>
                        <label className="onboard-label">Role</label>
                        <input className="onboard-input" value={work.position} onChange={(e) => updateWork(index, "position", e.target.value)} />
                      </div>
                      <div>
                        <label className="onboard-label">Type</label>
                        <select className="onboard-select" value={work.type} onChange={(e) => updateWork(index, "type", e.target.value)}>
                          <option value="FULL_TIME">Full Time</option>
                          <option value="INTERNSHIP">Internship</option>
                          <option value="PART_TIME">Part Time</option>
                          <option value="FREELANCE">Freelance</option>
                        </select>
                      </div>
                      <div>
                        <label className="onboard-label">Start month</label>
                        <input className="onboard-input" type="month" value={work.startDate} onChange={(e) => updateWork(index, "startDate", e.target.value)} />
                      </div>
                      <div>
                        <label className="onboard-label">End month</label>
                        <input className="onboard-input" type="month" value={work.endDate} onChange={(e) => updateWork(index, "endDate", e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Sparkles size={16} style={{ color: "#f59e0b" }} />
                  <h2 style={{ margin: 0, fontSize: "18px", fontFamily: "'Playfair Display', Georgia, serif" }}>Projects</h2>
                </div>
                <button className="outline-btn" type="button" onClick={() => setProjects((current) => [...current, emptyProject()])}>
                  <Plus size={12} style={{ marginRight: "6px", verticalAlign: "middle" }} /> Add project
                </button>
              </div>

              <div style={{ display: "grid", gap: "14px" }}>
                {projects.map((project, index) => (
                  <div key={`project-${index}`} className="mini-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <span style={{ fontSize: "12px", color: "#d4d4d8", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                        Project {index + 1}
                      </span>
                      <button type="button" onClick={() => setProjects((current) => current.filter((_, currentIndex) => currentIndex !== index))} style={{ border: "none", background: "transparent", color: "#f87171", cursor: "pointer" }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div style={{ display: "grid", gap: "14px" }}>
                      <div>
                        <label className="onboard-label">Project name</label>
                        <input className="onboard-input" value={project.name} onChange={(e) => updateProject(index, "name", e.target.value)} />
                      </div>
                      <div>
                        <label className="onboard-label">Description</label>
                        <textarea className="onboard-textarea" value={project.description} onChange={(e) => updateProject(index, "description", e.target.value)} />
                      </div>
                      <div>
                        <label className="onboard-label">Project links</label>
                        <input className="onboard-input" value={project.projectLinks} onChange={(e) => updateProject(index, "projectLinks", e.target.value)} placeholder="https://demo.com, https://github.com/..." />
                      </div>
                      <div>
                        <label className="onboard-label">Tech stack</label>
                        <input className="onboard-input" value={project.techStacks} onChange={(e) => updateProject(index, "techStacks", e.target.value)} placeholder="Next.js, TypeScript, PostgreSQL" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "28px" }}>
              <button className="primary-btn" type="button" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Complete Setup"}
              </button>
            </div>
          </div>

          <aside style={{ display: "grid", gap: "18px", alignSelf: "start" }}>
            <div className="onboard-card" style={{ padding: "22px" }}>
              <div style={{ fontSize: "12px", color: "#d97706", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                Welcome
              </div>
              <h3 style={{ margin: 0, fontSize: "24px", fontFamily: "'Playfair Display', Georgia, serif" }}>
                {user?.firstName}, let&apos;s make your first fills smarter.
              </h3>
              <p style={{ margin: "12px 0 0", color: "#71717a", lineHeight: 1.7, fontSize: "14px" }}>
                Good defaults help with job forms, cover letter prompts, project summaries, and profile autofill.
              </p>
            </div>

            <div className="onboard-card" style={{ padding: "22px" }}>
              <div style={{ fontSize: "12px", color: "#d97706", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                What matters now
              </div>
              <ul style={{ margin: 0, paddingLeft: "18px", color: "#d4d4d8", lineHeight: 1.9 }}>
                <li>Skills are required so the assistant has a starting point.</li>
                <li>Links, education, work, and projects are optional.</li>
                <li>You can refine everything later inside the dashboard.</li>
              </ul>
            </div>

            <div className="onboard-card" style={{ padding: "22px" }}>
              <div style={{ fontSize: "12px", color: "#d97706", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                Quick tip
              </div>
              <p style={{ margin: 0, color: "#71717a", lineHeight: 1.7, fontSize: "14px" }}>
                If you only have two minutes, fill in skills plus one link. That already improves autofill quality a lot.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
