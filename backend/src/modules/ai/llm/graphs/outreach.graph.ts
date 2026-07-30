import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { getReasoningModel, getBaseFastModel } from "../models/chatModels";
import { getUserById } from "../../../user/user.repository";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { parse } from "csv-parse/sync";
import FirecrawlApp from "@mendable/firecrawl-js";
import { queryContext, inferRelevantChunkTypes } from "../../rag.service";
import prisma from "../../../../config/database";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Contact {
  id?: string;
  name: string;
  company: string;
  position: string;
  email: string;
  website: string;
  companyContext?: string;
  draftSubject?: string;
  draftBody?: string;
  error?: string;
}

export const OutreachGraphState = Annotation.Root({
  userId: Annotation<string>,
  contactIds: Annotation<string[]>,
  contacts: Annotation<Contact[]>,
  userProfile: Annotation<any>
});

type State = typeof OutreachGraphState.State;

// ─── Node 1: Load Contacts ─────────────────────────────────────────────────
async function loadContacts(state: State): Promise<Partial<State>> {
  console.log("[outreach.graph] Loading contacts from DB");
  const user = await getUserById(state.userId);

  try {
    const dbContacts = await prisma.campaignContact.findMany({
      where: { id: { in: state.contactIds } }
    });

    const contacts: Contact[] = dbContacts.map((c) => ({
      id: c.id,
      name: c.name,
      company: c.company,
      position: c.position,
      email: c.email,
      website: c.website,
      companyContext: c.companyContext || undefined,
      draftSubject: c.draftSubject || undefined,
      draftBody: c.draftBody || undefined,
      error: c.error || undefined,
    }));

    return { contacts, userProfile: user ?? {} };
  } catch (error) {
    console.error("[outreach.graph] DB Load Error:", error);
    return { contacts: [], userProfile: user ?? {} };
  }
}

// ─── Node 2: Scrape Company Context (Firecrawl) ────────────────────────────────
async function scrapeCompanyContext(state: State): Promise<Partial<State>> {
  console.log("[outreach.graph] Scraping company contexts via Firecrawl");
  
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.warn("FIRECRAWL_API_KEY is not set. Skipping scraping.");
    return { contacts: state.contacts };
  }

  const firecrawl = new FirecrawlApp({ apiKey });
  const updatedContacts = [...state.contacts];

  // We can process in parallel, but to avoid rate limits, we'll do sequentially or small batches.
  for (const contact of updatedContacts) {
    if (!contact.website) continue;
    
    let url = contact.website;
    if (!url.startsWith("http")) url = `https://${url}`;

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace(/^www\./, '');

      // 1. Check DB Cache
      const cached = await prisma.companyContextCache.findUnique({
        where: { url: domain }
      });

      if (cached) {
        console.log(`[outreach.graph] Using cached context for ${domain}`);
        contact.companyContext = cached.context;
        continue;
      }

      console.log(`[outreach.graph] Scraping ${url} for ${contact.company}...`);
      const response = await firecrawl.scrapeUrl(url, {
        formats: ['markdown']
      }) as any;

      if (response.success && (response.markdown || response.data?.markdown)) {
        const md = response.markdown || response.data?.markdown;
        contact.companyContext = md.substring(0, 3000);
        
        // 2. Save to DB Cache
        await prisma.companyContextCache.create({
          data: { url: domain, context: contact.companyContext || "" }
        });
      } else if (response.markdown) {
        contact.companyContext = response.markdown.substring(0, 3000);
        
        // 2. Save to DB Cache
        await prisma.companyContextCache.create({
          data: { url: domain, context: contact.companyContext || "" }
        });
      } else {
        contact.companyContext = "Failed to scrape company website.";
      }

      if (contact.id) {
        await prisma.campaignContact.update({
          where: { id: contact.id },
          data: { companyContext: contact.companyContext }
        });
      }
    } catch (error: any) {
      console.error(`Error scraping ${contact.website}:`, error.message);
      contact.companyContext = "Error connecting to company website.";
    }
  }

  return { contacts: updatedContacts };
}

// ─── Node 3: Draft Emails (LangChain) ─────────────────────────────────────────
async function draftEmails(state: State): Promise<Partial<State>> {
  console.log("[outreach.graph] Drafting personalized cold emails");
  
  const model = getReasoningModel(0.7);
  const user = state.userProfile || {};
  const userName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "FormPilot User";

  const getLink = (platform: string) => user.links?.find((l: any) => l.platform.toLowerCase() === platform)?.url || "N/A";

  const updatedContacts = [...state.contacts];

  for (const contact of updatedContacts) {
    const query = `experience, projects, and skills relevant for a ${contact.position} at ${contact.company}`;
    const types = inferRelevantChunkTypes(query);
    const retrievedChunks = await queryContext(query, state.userId, { topK: 5, types });
    const retrievedContext = retrievedChunks.join("\n\n") || "No specific relevant projects or experience found in memory base.";

    const systemPrompt = `You are an expert executive recruiter and cold outreach specialist.
Your task is to write a highly personalized cold email to an HR/Hiring Manager at a target company.
You must fuse the Candidate's profile with the Company's context to highlight exactly why the Candidate is a perfect fit.

═══ CANDIDATE PROFILE (The sender) ═══
Name: ${userName}
Bio: ${user.bio ?? ""}
Skills: ${(user.skills ?? []).join(", ")}
Socials:
- GitHub: ${getLink("github")}
- LinkedIn: ${getLink("linkedin")}
- Portfolio: ${getLink("portfolio")}
- Phone: ${user.phone || "N/A"}

═══ RELEVANT CANDIDATE BACKGROUND (Retrieved via RAG for this role) ═══
${retrievedContext}

═══ RULES ═══
1. Do NOT use placeholders like [Your Name] or [Company Name]. Use the provided variables.
2. The email must be professional, warm, concise, and highly personalized to the company.
3. Output ONLY the email body. Do not include 'Subject:' or any introductory remarks.
4. End the email by signing off with the Candidate's name.
5. NEVER use markdown formatting (no bold, italics, bullets). Write in very humanized, natural plain text.
6. Below the sign-off ("Best regards, [Name]"), always append the Candidate's available social links (GitHub, LinkedIn, Portfolio) and Phone number if they exist.`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(`Draft a cold email to ${contact.name}, who is the ${contact.position} at ${contact.company}.
        
Company Scraped Context:
${contact.companyContext || "No context available."}

Remember to output ONLY the body of the email. Keep it under 200 words.`)
    ];

    try {
      const res = await model.invoke(messages);
      
      contact.draftBody = (typeof res.content === "string" ? res.content : JSON.stringify(res.content)).trim();
      contact.draftSubject = `Inquiry regarding engineering opportunities at ${contact.company}`;
      
      if (contact.id) {
        await prisma.campaignContact.update({
          where: { id: contact.id },
          data: { 
            draftSubject: contact.draftSubject, 
            draftBody: contact.draftBody,
            status: "drafted"
          }
        });
      }
    } catch (error: any) {
      console.error(`Error drafting email for ${contact.name}:`, error);
      contact.error = "Failed to draft email.";
      
      if (contact.id) {
        await prisma.campaignContact.update({
          where: { id: contact.id },
          data: { error: contact.error, status: "error" }
        });
      }
    }
  }

  return { contacts: updatedContacts };
}

// ─── Build Graph ──────────────────────────────────────────────────────────────
export function buildOutreachGraph() {
  const graph = new StateGraph(OutreachGraphState)
    .addNode("load", loadContacts)
    .addNode("scrape", scrapeCompanyContext)
    .addNode("draft", draftEmails)
    .addEdge(START, "load")
    .addEdge("load", "scrape")
    .addEdge("scrape", "draft")
    .addEdge("draft", END);

  return graph.compile();
}

export async function runOutreachGraph(userId: string, contactIds: string[]) {
  const graph = buildOutreachGraph();
  return await graph.invoke({ userId, contactIds, contacts: [], userProfile: {} });
}
