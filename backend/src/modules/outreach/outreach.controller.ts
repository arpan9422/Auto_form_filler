import { Request, Response } from "express";
import { runOutreachGraph } from "../ai/llm/graphs/outreach.graph";
import { executeSendEmailTool } from "../ai/llm/tools/sendEmail.tool";
import { getUserById } from "../user/user.repository";
import { parse } from "csv-parse/sync";
import prisma from "../../config/database";

export const uploadCampaignCsv = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!req.file) return res.status(400).json({ error: "No CSV file uploaded." });

    const csvData = req.file.buffer.toString("utf-8");
    const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : null;
    const name = req.body.name || "Untitled Campaign";

    const records = parse(csvData, { columns: true, skip_empty_lines: true, trim: true });

    const contacts = records.map((record: any) => ({
      name: mapping?.name ? record[mapping.name] : (record.Name || record.name || ""),
      company: mapping?.company ? record[mapping.company] : (record.Company || record.company || ""),
      position: mapping?.position ? record[mapping.position] : (record.Position || record.position || record.Title || ""),
      email: mapping?.email ? record[mapping.email] : (record.Email || record.email || ""),
      website: mapping?.website ? record[mapping.website] : (record.Website || record.website || record.URL || "")
    })).filter((c: any) => c.name && c.email);

    const campaign = await prisma.campaign.create({
      data: {
        userId,
        name,
        contacts: {
          create: contacts
        }
      }
    });

    return res.json({
      message: "Campaign created successfully",
      campaignId: campaign.id
    });
  } catch (error: any) {
    console.error("[outreach.controller] Error creating campaign:", error);
    return res.status(500).json({ error: error.message || "Failed to create campaign" });
  }
};

export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const campaigns = await prisma.campaign.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { contacts: true } }
      }
    });
    return res.json({ campaigns });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to get campaigns" });
  }
};

export const getCampaignContacts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "all";

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const skip = (page - 1) * limit;

    const whereClause: any = {
      campaignId: id,
      campaign: { userId },
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "all") {
      whereClause.status = status;
    }

    const contacts = await prisma.campaignContact.findMany({
      where: whereClause,
      orderBy: { lastContactedAt: { sort: 'asc', nulls: 'first' } },
      skip,
      take: limit,
    });
    
    const total = await prisma.campaignContact.count({ where: whereClause });

    return res.json({ 
      contacts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to get contacts" });
  }
};

export const generateDrafts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { contactIds } = req.body;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: "No contactIds provided." });
    }

    const resultState = await runOutreachGraph(userId, contactIds);

    return res.json({
      message: "Drafts generated successfully",
      contacts: resultState.contacts
    });
  } catch (error: any) {
    console.error("[outreach.controller] Error generating drafts:", error);
    return res.status(500).json({ error: error.message || "Failed to generate drafts" });
  }
};

export const dispatchEmails = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { contactIds } = req.body;
    if (!Array.isArray(contactIds)) {
      return res.status(400).json({ error: "Invalid payload. Expected array of contactIds." });
    }

    const user = await getUserById(userId);
    const userEmail = user?.email || "user@formpilot.local";
    const userName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "FormPilot User";

    const contacts = await prisma.campaignContact.findMany({
      where: { id: { in: contactIds }, campaign: { userId } }
    });

    const sentResults = [];
    for (const contact of contacts) {
      if (!contact.email || !contact.draftBody) continue;

      const result = await executeSendEmailTool(
        {
          to: contact.email,
          subject: contact.draftSubject || "Inquiry",
          body: contact.draftBody,
          confirmed: true
        },
        { userEmail, userName }
      );

      await prisma.campaignContact.update({
        where: { id: contact.id },
        data: { status: "sent", lastContactedAt: new Date() }
      });

      sentResults.push({
        email: contact.email,
        status: "sent"
      });
    }

    return res.json({
      message: `Dispatched ${sentResults.length} emails.`,
      results: sentResults
    });
  } catch (error: any) {
    console.error("[outreach.controller] Error dispatching emails:", error);
    return res.status(500).json({ error: error.message || "Failed to dispatch emails" });
  }
};
