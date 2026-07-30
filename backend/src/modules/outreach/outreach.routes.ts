import { Router } from "express";
import { uploadCampaignCsv, getCampaigns, getCampaignContacts, generateDrafts, dispatchEmails } from "./outreach.controller";
import multer from "multer";
import { authenticate } from "../../middleware/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload CSV and create Campaign
router.post("/campaign", authenticate, upload.single("file"), uploadCampaignCsv);

// List campaigns
router.get("/campaigns", authenticate, getCampaigns);

// Get contacts for a campaign (sorted by inverted LRU)
router.get("/campaign/:id/contacts", authenticate, getCampaignContacts);

// Generate drafts for selected contacts
router.post("/campaign/:id/draft", authenticate, generateDrafts);

// Dispatch confirmed drafted emails
router.post("/dispatch", authenticate, dispatchEmails);

export default router;
