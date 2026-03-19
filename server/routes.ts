import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import {
  insertClientSchema,
  insertLeadSchema,
  insertTaskSchema,
  insertContractSchema,
  insertContentPieceSchema,
  insertContentPlanSchema,
  insertKnowledgeBaseSchema,
  insertGeneratedImageSchema,
  insertTeamInviteSchema,
  insertRevenueGoalSchema,
  insertShareLinkSchema,
  insertUserSchema,
  insertAiSessionSchema,
  insertActivityLogSchema,
} from "@shared/schema";

// ── Environment ───────────────────────────────────────
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY ?? "";
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY ?? "";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ══════════════════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════════════════
  app.get("/api/dashboard", async (_req, res) => {
    try {
      const [clients, leads, tasks, revenueGoals, activity] = await Promise.all([
        storage.listClients(),
        storage.listLeads(),
        storage.listTasks(),
        storage.listRevenueGoals(),
        storage.listActivityLog(10),
      ]);

      const totalMRR = clients
        .filter(c => c.status === "active")
        .reduce((sum, c) => sum + (c.mrr ?? 0), 0);

      const clientCounts = {
        active: clients.filter(c => c.status === "active").length,
        onboarding: clients.filter(c => c.status === "onboarding").length,
        paused: clients.filter(c => c.status === "paused").length,
        churned: clients.filter(c => c.status === "churned").length,
        total: clients.length,
      };

      const pipelineValue = leads
        .filter(l => !["won", "lost"].includes(l.stage))
        .reduce((sum, l) => sum + (l.proposalValue ?? 0), 0);

      const topClientsByMRR = clients
        .filter(c => c.status === "active")
        .sort((a, b) => (b.mrr ?? 0) - (a.mrr ?? 0))
        .slice(0, 5);

      const taskCompletionStats = {
        todo: tasks.filter(t => t.status === "todo").length,
        in_progress: tasks.filter(t => t.status === "in_progress").length,
        complete: tasks.filter(t => t.status === "complete").length,
        total: tasks.length,
      };

      res.json({
        totalMRR,
        clientCounts,
        pipelineValue,
        recentActivity: activity,
        topClientsByMRR,
        taskCompletionStats,
        revenueGoals,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ══════════════════════════════════════════════════
  // CLIENTS
  // ══════════════════════════════════════════════════
  app.get("/api/clients", async (_req, res) => {
    const clients = await storage.listClients();
    res.json(clients);
  });

  app.get("/api/clients/:id", async (req, res) => {
    const client = await storage.getClient(req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  });

  app.post("/api/clients", async (req, res) => {
    const parsed = insertClientSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const client = await storage.createClient(parsed.data);
    res.status(201).json(client);
  });

  app.patch("/api/clients/:id", async (req, res) => {
    const client = await storage.updateClient(req.params.id, req.body);
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  });

  app.delete("/api/clients/:id", async (req, res) => {
    const deleted = await storage.deleteClient(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Client not found" });
    res.json({ success: true });
  });

  // ══════════════════════════════════════════════════
  // LEADS
  // ══════════════════════════════════════════════════
  app.get("/api/leads", async (_req, res) => {
    const leads = await storage.listLeads();
    res.json(leads);
  });

  app.get("/api/leads/:id", async (req, res) => {
    const lead = await storage.getLead(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
  });

  app.post("/api/leads", async (req, res) => {
    const parsed = insertLeadSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const lead = await storage.createLead(parsed.data);
    res.status(201).json(lead);
  });

  app.patch("/api/leads/:id", async (req, res) => {
    const lead = await storage.updateLead(req.params.id, req.body);
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
  });

  app.delete("/api/leads/:id", async (req, res) => {
    const deleted = await storage.deleteLead(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Lead not found" });
    res.json({ success: true });
  });

  // ══════════════════════════════════════════════════
  // TASKS
  // ══════════════════════════════════════════════════
  app.get("/api/tasks", async (req, res) => {
    const clientId = req.query.clientId as string | undefined;
    const tasks = await storage.listTasks(clientId);
    res.json(tasks);
  });

  app.get("/api/tasks/:id", async (req, res) => {
    const task = await storage.getTask(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  });

  app.post("/api/tasks", async (req, res) => {
    const parsed = insertTaskSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const task = await storage.createTask(parsed.data);
    res.status(201).json(task);
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    const task = await storage.updateTask(req.params.id, req.body);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    const deleted = await storage.deleteTask(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Task not found" });
    res.json({ success: true });
  });

  // ══════════════════════════════════════════════════
  // CONTRACTS
  // ══════════════════════════════════════════════════
  app.get("/api/contracts", async (req, res) => {
    const clientId = req.query.clientId as string | undefined;
    const contracts = await storage.listContracts(clientId);
    res.json(contracts);
  });

  app.get("/api/contracts/:id", async (req, res) => {
    const contract = await storage.getContract(req.params.id);
    if (!contract) return res.status(404).json({ message: "Contract not found" });
    res.json(contract);
  });

  app.post("/api/contracts", async (req, res) => {
    const parsed = insertContractSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const contract = await storage.createContract(parsed.data);
    res.status(201).json(contract);
  });

  app.patch("/api/contracts/:id", async (req, res) => {
    const contract = await storage.updateContract(req.params.id, req.body);
    if (!contract) return res.status(404).json({ message: "Contract not found" });
    res.json(contract);
  });

  app.delete("/api/contracts/:id", async (req, res) => {
    const deleted = await storage.deleteContract(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Contract not found" });
    res.json({ success: true });
  });

  // ══════════════════════════════════════════════════
  // CONTENT PIECES
  // ══════════════════════════════════════════════════
  app.get("/api/content-pieces", async (req, res) => {
    const clientId = req.query.clientId as string | undefined;
    const pieces = await storage.listContentPieces(clientId);
    res.json(pieces);
  });

  app.get("/api/content-pieces/:id", async (req, res) => {
    const piece = await storage.getContentPiece(req.params.id);
    if (!piece) return res.status(404).json({ message: "Content piece not found" });
    res.json(piece);
  });

  app.post("/api/content-pieces", async (req, res) => {
    const parsed = insertContentPieceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const piece = await storage.createContentPiece(parsed.data);
    res.status(201).json(piece);
  });

  app.patch("/api/content-pieces/:id", async (req, res) => {
    const piece = await storage.updateContentPiece(req.params.id, req.body);
    if (!piece) return res.status(404).json({ message: "Content piece not found" });
    res.json(piece);
  });

  app.delete("/api/content-pieces/:id", async (req, res) => {
    const deleted = await storage.deleteContentPiece(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Content piece not found" });
    res.json({ success: true });
  });

  // ══════════════════════════════════════════════════
  // CONTENT PLANS
  // ══════════════════════════════════════════════════
  app.get("/api/content-plans", async (req, res) => {
    const clientId = req.query.clientId as string | undefined;
    const plans = await storage.listContentPlans(clientId);
    res.json(plans);
  });

  app.get("/api/content-plans/:id", async (req, res) => {
    const plan = await storage.getContentPlan(req.params.id);
    if (!plan) return res.status(404).json({ message: "Content plan not found" });
    res.json(plan);
  });

  app.post("/api/content-plans", async (req, res) => {
    const parsed = insertContentPlanSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const plan = await storage.createContentPlan(parsed.data);
    res.status(201).json(plan);
  });

  app.patch("/api/content-plans/:id", async (req, res) => {
    const plan = await storage.updateContentPlan(req.params.id, req.body);
    if (!plan) return res.status(404).json({ message: "Content plan not found" });
    res.json(plan);
  });

  app.delete("/api/content-plans/:id", async (req, res) => {
    const deleted = await storage.deleteContentPlan(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Content plan not found" });
    res.json({ success: true });
  });

  // ══════════════════════════════════════════════════
  // KNOWLEDGE BASE
  // ══════════════════════════════════════════════════
  app.get("/api/knowledge-base", async (req, res) => {
    const clientId = req.query.clientId as string | undefined;
    const entries = await storage.listKnowledgeBase(clientId);
    res.json(entries);
  });

  app.get("/api/knowledge-base/:id", async (req, res) => {
    const entry = await storage.getKnowledgeBaseEntry(req.params.id);
    if (!entry) return res.status(404).json({ message: "Knowledge base entry not found" });
    res.json(entry);
  });

  app.post("/api/knowledge-base", async (req, res) => {
    const parsed = insertKnowledgeBaseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const entry = await storage.createKnowledgeBaseEntry(parsed.data);
    res.status(201).json(entry);
  });

  app.patch("/api/knowledge-base/:id", async (req, res) => {
    const entry = await storage.updateKnowledgeBaseEntry(req.params.id, req.body);
    if (!entry) return res.status(404).json({ message: "Knowledge base entry not found" });
    res.json(entry);
  });

  app.delete("/api/knowledge-base/:id", async (req, res) => {
    const deleted = await storage.deleteKnowledgeBaseEntry(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Knowledge base entry not found" });
    res.json({ success: true });
  });

  // ══════════════════════════════════════════════════
  // GENERATED IMAGES
  // ══════════════════════════════════════════════════
  app.get("/api/generated-images", async (req, res) => {
    const clientId = req.query.clientId as string | undefined;
    const images = await storage.listGeneratedImages(clientId);
    res.json(images);
  });

  app.get("/api/generated-images/:id", async (req, res) => {
    const img = await storage.getGeneratedImage(req.params.id);
    if (!img) return res.status(404).json({ message: "Image not found" });
    res.json(img);
  });

  app.patch("/api/generated-images/:id", async (req, res) => {
    const img = await storage.updateGeneratedImage(req.params.id, req.body);
    if (!img) return res.status(404).json({ message: "Image not found" });
    res.json(img);
  });

  app.delete("/api/generated-images/:id", async (req, res) => {
    const deleted = await storage.deleteGeneratedImage(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Image not found" });
    res.json({ success: true });
  });

  // ══════════════════════════════════════════════════
  // TEAM (Users)
  // ══════════════════════════════════════════════════
  app.get("/api/team", async (_req, res) => {
    const users = await storage.listUsers();
    const safe = users.map(({ password, ...rest }) => rest);
    res.json(safe);
  });

  app.get("/api/team/:id", async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ message: "Team member not found" });
    const { password, ...safe } = user;
    res.json(safe);
  });

  app.post("/api/team", async (req, res) => {
    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const user = await storage.createUser(parsed.data);
    const { password, ...safe } = user;
    res.status(201).json(safe);
  });

  app.patch("/api/team/:id", async (req, res) => {
    const user = await storage.updateUser(req.params.id, req.body);
    if (!user) return res.status(404).json({ message: "Team member not found" });
    const { password, ...safe } = user;
    res.json(safe);
  });

  app.delete("/api/team/:id", async (req, res) => {
    const deleted = await storage.deleteUser(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Team member not found" });
    res.json({ success: true });
  });

  // ══════════════════════════════════════════════════
  // TEAM INVITES
  // ══════════════════════════════════════════════════
  app.get("/api/team-invites", async (_req, res) => {
    const invites = await storage.listTeamInvites();
    res.json(invites);
  });

  app.post("/api/team-invites", async (req, res) => {
    const parsed = insertTeamInviteSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const invite = await storage.createTeamInvite(parsed.data);
    res.status(201).json(invite);
  });

  app.patch("/api/team-invites/:id", async (req, res) => {
    const invite = await storage.updateTeamInvite(req.params.id, req.body);
    if (!invite) return res.status(404).json({ message: "Invite not found" });
    res.json(invite);
  });

  app.delete("/api/team-invites/:id", async (req, res) => {
    const deleted = await storage.deleteTeamInvite(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Invite not found" });
    res.json({ success: true });
  });

  // ══════════════════════════════════════════════════
  // REVENUE GOALS
  // ══════════════════════════════════════════════════
  app.get("/api/revenue-goals", async (_req, res) => {
    const goals = await storage.listRevenueGoals();
    res.json(goals);
  });

  app.post("/api/revenue-goals", async (req, res) => {
    const parsed = insertRevenueGoalSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const goal = await storage.createRevenueGoal(parsed.data);
    res.status(201).json(goal);
  });

  app.patch("/api/revenue-goals/:id", async (req, res) => {
    const goal = await storage.updateRevenueGoal(req.params.id, req.body);
    if (!goal) return res.status(404).json({ message: "Revenue goal not found" });
    res.json(goal);
  });

  app.delete("/api/revenue-goals/:id", async (req, res) => {
    const deleted = await storage.deleteRevenueGoal(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Revenue goal not found" });
    res.json({ success: true });
  });

  // ══════════════════════════════════════════════════
  // ANALYTICS
  // ══════════════════════════════════════════════════
  app.get("/api/analytics/:clientId", async (req, res) => {
    try {
      const clientId = req.params.clientId;
      const platform = req.query.platform as string | undefined;
      const client = await storage.getClient(clientId);
      if (!client) return res.status(404).json({ message: "Client not found" });

      const analytics = await storage.listSocialAnalytics(clientId, platform);
      res.json({ client: { id: client.id, businessName: client.businessName }, analytics });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ══════════════════════════════════════════════════
  // ACTIVITY LOG
  // ══════════════════════════════════════════════════
  app.get("/api/activity-log", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const entries = await storage.listActivityLog(limit);
    res.json(entries);
  });

  app.post("/api/activity-log", async (req, res) => {
    const parsed = insertActivityLogSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const entry = await storage.createActivityLog(parsed.data);
    res.status(201).json(entry);
  });

  // ══════════════════════════════════════════════════
  // AGENCY SETTINGS
  // ══════════════════════════════════════════════════
  app.get("/api/settings", async (_req, res) => {
    let settings = await storage.getAgencySettings();
    if (!settings) {
      // Auto-create default settings on first access
      settings = await storage.updateAgencySettings({
        agencyName: "My Agency",
        timezone: "Australia/Sydney",
        workingHours: "9:00-17:00",
        aiVoice: "professional",
        aiTone: "friendly and strategic",
        appearance: "system",
      });
    }
    res.json(settings);
  });

  app.patch("/api/settings", async (req, res) => {
    const settings = await storage.updateAgencySettings(req.body);
    if (!settings) return res.status(404).json({ message: "Settings not found" });
    res.json(settings);
  });

  // ══════════════════════════════════════════════════
  // AI SESSIONS
  // ══════════════════════════════════════════════════
  app.get("/api/ai-sessions", async (req, res) => {
    const clientId = req.query.clientId as string | undefined;
    const sessions = await storage.listAiSessions(clientId);
    res.json(sessions);
  });

  app.get("/api/ai-sessions/:id", async (req, res) => {
    const session = await storage.getAiSession(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json(session);
  });

  // ══════════════════════════════════════════════════
  // SHARE LINKS
  // ══════════════════════════════════════════════════
  app.get("/api/share/:token", async (req, res) => {
    try {
      const link = await storage.getShareLinkByToken(req.params.token);
      if (!link) return res.status(404).json({ message: "Share link not found" });

      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return res.status(410).json({ message: "Share link has expired" });
      }

      let data: any = { type: link.type };

      switch (link.type) {
        case "analytics": {
          if (link.clientId) {
            const analytics = await storage.listSocialAnalytics(link.clientId);
            const client = await storage.getClient(link.clientId);
            data.client = client ? { id: client.id, businessName: client.businessName } : null;
            data.analytics = analytics;
          }
          break;
        }
        case "calendar": {
          if (link.clientId) {
            const pieces = await storage.listContentPieces(link.clientId);
            const client = await storage.getClient(link.clientId);
            data.client = client ? { id: client.id, businessName: client.businessName } : null;
            data.contentPieces = pieces.filter(p => p.scheduledDate);
          }
          break;
        }
        case "contract": {
          const contract = await storage.getContract(link.resourceId);
          if (contract) {
            const client = await storage.getClient(contract.clientId);
            data.contract = contract;
            data.client = client ? { id: client.id, businessName: client.businessName } : null;
          }
          break;
        }
        case "plan": {
          const plan = await storage.getContentPlan(link.resourceId);
          if (plan) {
            const client = await storage.getClient(plan.clientId);
            data.plan = plan;
            data.client = client ? { id: client.id, businessName: client.businessName } : null;
          }
          break;
        }
      }

      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/share", async (req, res) => {
    try {
      const token = randomUUID().replace(/-/g, "").slice(0, 16);
      const { type, resourceId, clientId, expiresInDays } = req.body;

      if (!type || !resourceId) {
        return res.status(400).json({ message: "type and resourceId are required" });
      }

      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
        : null;

      const link = await storage.createShareLink({
        type,
        resourceId,
        token,
        expiresAt,
        clientId: clientId || null,
      });

      res.status(201).json(link);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ══════════════════════════════════════════════════
  // AI CHAT — Multi-provider (OpenAI primary, Gemini fallback, Anthropic last-resort)
  // ══════════════════════════════════════════════════
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { clientId, message, sessionId, provider } = req.body;

      if (!clientId || !message) {
        return res.status(400).json({ message: "clientId and message are required" });
      }

      const client = await storage.getClient(clientId);
      if (!client) return res.status(404).json({ message: "Client not found" });

      // Gather knowledge base context
      const kb = await storage.listKnowledgeBase(clientId);
      const kbContext = kb.length > 0
        ? kb.map(e => `[${e.category.toUpperCase()}] ${e.title}:\n${e.content}`).join("\n\n")
        : "No knowledge base entries found for this client.";

      // Get agency settings for AI personality
      const settings = await storage.getAgencySettings();
      const aiVoice = settings?.aiVoice ?? "professional";
      const aiTone = settings?.aiTone ?? "friendly and strategic";

      const systemPrompt = `You are the AI assistant for ThirdLink Marketing (TLM), a digital marketing agency. Your voice is ${aiVoice} and your tone is ${aiTone}.

You are currently working on strategy and content for the client: ${client.businessName} (${client.industry ?? "Unknown industry"}).

Here is the client's knowledge base for context:
${kbContext}

Help the agency team with content strategy, copywriting, campaign ideas, audience insights, and marketing recommendations. Always consider the client's brand voice, target audience, and business goals. Be concise, actionable, and creative.`;

      // Load or create session
      let session;
      let messages: Array<{ role: string; content: string }> = [];

      if (sessionId) {
        session = await storage.getAiSession(sessionId);
        if (session?.messages) {
          messages = session.messages;
        }
      }

      messages.push({ role: "user", content: message });

      // Select AI provider: explicit choice > OpenAI > Gemini > Anthropic
      const selectedProvider = provider || "openai";
      let aiResponse = "";

      if ((selectedProvider === "openai" || selectedProvider === "auto") && OPENAI_API_KEY) {
        try {
          const OpenAI = (await import("openai")).default;
          const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            max_tokens: 1500,
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.map(m => ({
                role: m.role as "user" | "assistant" | "system",
                content: m.content,
              })),
            ],
          });
          aiResponse = completion.choices[0]?.message?.content ?? "";
        } catch (err: any) {
          console.error("OpenAI error:", err.message);
          // Fall through to Gemini
        }
      }

      if (!aiResponse && (selectedProvider === "gemini" || selectedProvider === "auto" || !aiResponse) && GOOGLE_AI_API_KEY) {
        try {
          const { GoogleGenerativeAI } = await import("@google/generative-ai");
          const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

          const chatHistory = messages.slice(0, -1).map(m => ({
            role: m.role === "assistant" ? "model" as const : "user" as const,
            parts: [{ text: m.content }],
          }));

          const chat = model.startChat({
            history: [
              { role: "user" as const, parts: [{ text: `System instructions: ${systemPrompt}\n\nAcknowledge and follow these instructions.` }] },
              { role: "model" as const, parts: [{ text: "Understood. I'll follow these instructions for ThirdLink Marketing." }] },
              ...chatHistory,
            ],
          });

          const result = await chat.sendMessage(message);
          aiResponse = result.response.text();
        } catch (err: any) {
          console.error("Gemini error:", err.message);
        }
      }

      // Final fallback: Anthropic (via platform credentials)
      if (!aiResponse) {
        try {
          const Anthropic = (await import("@anthropic-ai/sdk")).default;
          const anthropic = new Anthropic();
          const response = await anthropic.messages.create({
            model: "claude_sonnet_4_5",
            max_tokens: 1024,
            system: systemPrompt,
            messages: messages.map(m => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
          });
          const textBlock = response.content.find((b: any) => b.type === "text");
          aiResponse = textBlock ? (textBlock as any).text : "";
        } catch (err: any) {
          console.error("Anthropic error:", err.message);
          aiResponse = "I'm having trouble connecting to all AI services right now. Please try again in a moment.";
        }
      }

      messages.push({ role: "assistant", content: aiResponse });

      // Save session
      if (session) {
        await storage.updateAiSession(session.id, { messages });
      } else {
        session = await storage.createAiSession({
          clientId,
          title: message.slice(0, 60) + (message.length > 60 ? "..." : ""),
          messages,
        });
      }

      res.json({
        sessionId: session.id,
        response: aiResponse,
        messages,
        provider: selectedProvider,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ══════════════════════════════════════════════════
  // AI IMAGE GENERATION — DALL-E + NanoBanana Models
  // ══════════════════════════════════════════════════
  app.post("/api/ai/generate-image", async (req, res) => {
    try {
      const { prompt, model, styleNotes, clientId, size } = req.body;

      if (!prompt) {
        return res.status(400).json({ message: "prompt is required" });
      }

      const usedModel = model || "dall-e-3";
      const fullPrompt = styleNotes ? `${prompt}. Style notes: ${styleNotes}` : prompt;
      let imageUrl = "";

      const isNanoBanana = ["nano_banana_2", "nano_banana_pro"].includes(usedModel);

      if (isNanoBanana) {
        // Route NanoBanana models through the Python pplx SDK helper
        // Uses file-based I/O to avoid execSync buffer limits on large base64 images
        try {
          const { execSync } = await import("child_process");
          const fs = await import("fs");
          const path = await import("path");
          const tmpFile = path.join(process.cwd(), `nb_img_${Date.now()}.png`);
          const escapedPrompt = fullPrompt.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, " ");
          execSync(
            `python3 -c "
import asyncio, sys
sys.path.insert(0, '.')
from generate_image import generate_image
async def main():
    img = await generate_image('${escapedPrompt}', model='${usedModel}')
    with open('${tmpFile}', 'wb') as f:
        f.write(img)
asyncio.run(main())
"`,
            { timeout: 120000, cwd: process.cwd(), maxBuffer: 1024 * 1024 * 50 }
          );
          if (fs.existsSync(tmpFile)) {
            const imgBuffer = fs.readFileSync(tmpFile);
            const b64 = imgBuffer.toString("base64");
            imageUrl = `data:image/png;base64,${b64}`;
            fs.unlinkSync(tmpFile);
          } else {
            imageUrl = "error";
          }
        } catch (nbErr: any) {
          console.error(`NanoBanana (${usedModel}) generation error:`, nbErr.message);
          imageUrl = "error";
        }
      } else if (OPENAI_API_KEY) {
        // Route DALL-E models through the OpenAI SDK
        try {
          const OpenAI = (await import("openai")).default;
          const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
          const dalleModel = usedModel === "dall-e-2" ? "dall-e-2" : "dall-e-3";
          const dalleSize = dalleModel === "dall-e-2" ? "1024x1024" : (size || "1024x1024");
          const response = await openai.images.generate({
            model: dalleModel,
            prompt: fullPrompt,
            n: 1,
            size: dalleSize,
            quality: "standard",
          });
          imageUrl = response.data?.[0]?.url ?? "";
        } catch (imgErr: any) {
          console.error("OpenAI image generation error:", imgErr.message);
          imageUrl = "error";
        }
      } else {
        imageUrl = "error";
      }

      const image = await storage.createGeneratedImage({
        prompt,
        model: usedModel,
        imageData: imageUrl,
        styleNotes: styleNotes || null,
        clientId: clientId || null,
        status: imageUrl === "error" ? "rejected" : "pending",
      });

      res.status(201).json(image);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ══════════════════════════════════════════════════
  // FIRECRAWL — Website Intelligence for Knowledge Base
  // ══════════════════════════════════════════════════
  app.post("/api/firecrawl/scan", async (req, res) => {
    try {
      const { url, clientId } = req.body;

      if (!url || !clientId) {
        return res.status(400).json({ message: "url and clientId are required" });
      }

      if (!FIRECRAWL_API_KEY) {
        return res.status(503).json({ message: "Firecrawl API key not configured" });
      }

      const client = await storage.getClient(clientId);
      if (!client) return res.status(404).json({ message: "Client not found" });

      const FirecrawlApp = (await import("@mendable/firecrawl-js")).default;
      const firecrawl = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });

      // Scrape the main page
      const scraped = await firecrawl.scrapeUrl(url, {
        formats: ["markdown"],
      });

      if (!scraped.success) {
        return res.status(500).json({ message: "Failed to scan website" });
      }

      // Firecrawl responses can differ by version: some return fields at the top level,
      // others nest them under `data`.
      const scrapedPayload = (scraped as any).data ?? scraped;
      const markdown =
        scrapedPayload.markdown ||
        scrapedPayload.content ||
        scrapedPayload.text ||
        "";
      const metadata = scrapedPayload.metadata || {};

      if (!markdown.trim() && !metadata.title && !metadata.description) {
        return res.status(422).json({
          message: "Website scan returned no readable content",
        });
      }

      // Use OpenAI/Gemini to analyze the website content and extract structured insights
      let analysis = "";
      const analyzePrompt = `Analyze this website content for a social media marketing agency. Extract structured insights in these categories:

1. BRAND: Brand identity, mission, values, USP, brand voice/personality
2. AUDIENCE: Target demographic, customer personas, pain points
3. COMPETITORS: Any mentioned competitors or market positioning
4. OFFERS: Products, services, pricing mentioned
5. NOTES: Key messaging themes, visual style notes, content opportunities

Website: ${url}
Title: ${metadata.title || "Unknown"}
Description: ${metadata.description || "Unknown"}

Content (first 4000 chars):
${markdown.slice(0, 4000)}

Respond as JSON with keys: brand, audience, competitors, offers, notes — each being a concise summary paragraph.`;

      if (OPENAI_API_KEY) {
        try {
          const OpenAI = (await import("openai")).default;
          const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            max_tokens: 1500,
            messages: [{ role: "user", content: analyzePrompt }],
            response_format: { type: "json_object" },
          });
          analysis = completion.choices[0]?.message?.content ?? "";
        } catch (e: any) {
          console.error("OpenAI analysis error:", e.message);
        }
      }

      if (!analysis && GOOGLE_AI_API_KEY) {
        try {
          const { GoogleGenerativeAI } = await import("@google/generative-ai");
          const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
          const result = await model.generateContent(analyzePrompt + "\nReturn only valid JSON.");
          analysis = result.response.text();
        } catch (e: any) {
          console.error("Gemini analysis error:", e.message);
        }
      }

      // Parse analysis into knowledge base entries
      const createdEntries: any[] = [];
      if (analysis) {
        try {
          // Clean JSON from markdown code fences if present
          const cleanJson = analysis.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const parsed = JSON.parse(cleanJson);
          const categoryMap: Record<string, string> = {
            brand: "brand",
            audience: "audience",
            competitors: "competitors",
            offers: "offers",
            notes: "notes",
          };

          const formatSection = (value: unknown): string => {
            if (typeof value === "string") return value.trim();
            if (Array.isArray(value)) {
              return value
                .map((item) => formatSection(item))
                .filter(Boolean)
                .map((item) => `- ${item}`)
                .join("\n");
            }
            if (value && typeof value === "object") {
              return Object.entries(value as Record<string, unknown>)
                .map(([entryKey, entryValue]) => {
                  const formattedValue = formatSection(entryValue);
                  if (!formattedValue) return "";
                  const label = entryKey.replace(/_/g, " ");
                  return `${label.charAt(0).toUpperCase() + label.slice(1)}: ${formattedValue}`;
                })
                .filter(Boolean)
                .join("\n");
            }
            return "";
          };

          for (const [key, category] of Object.entries(categoryMap)) {
            const formattedContent = formatSection(parsed[key]);
            if (formattedContent.length > 10) {
              const entry = await storage.createKnowledgeBaseEntry({
                clientId,
                category,
                title: `${key.charAt(0).toUpperCase() + key.slice(1)} — ${url}`,
                content: formattedContent,
              });
              createdEntries.push(entry);
            }
          }

          if (createdEntries.length === 0) {
            const fallbackEntry = await storage.createKnowledgeBaseEntry({
              clientId,
              category: "notes",
              title: `Website Scan Summary — ${url}`,
              content:
                typeof analysis === "string" && analysis.trim().length > 0
                  ? analysis
                  : `Website metadata:\nTitle: ${metadata.title || "Unknown"}\nDescription: ${metadata.description || "Unknown"}\n\nContent preview:\n${markdown.slice(0, 5000)}`,
            });
            createdEntries.push(fallbackEntry);
          }
        } catch (parseErr: any) {
          console.error("Failed to parse AI analysis:", parseErr.message);
          // Store raw analysis as a note
          const entry = await storage.createKnowledgeBaseEntry({
            clientId,
            category: "notes",
            title: `Website Scan — ${url}`,
            content: analysis,
          });
          createdEntries.push(entry);
        }
      } else {
        // No AI available — store raw content
        const fallbackContent = markdown.trim()
          ? markdown.slice(0, 5000)
          : `Website metadata:\nTitle: ${metadata.title || "Unknown"}\nDescription: ${metadata.description || "Unknown"}`;
        const entry = await storage.createKnowledgeBaseEntry({
          clientId,
          category: "notes",
          title: `Website Content — ${url}`,
          content: fallbackContent,
        });
        createdEntries.push(entry);
      }

      // Log activity
      await storage.createActivityLog({
        action: "firecrawl_scan",
        description: `Scanned ${url} for ${client.businessName} — ${createdEntries.length} knowledge base entries created`,
        resourceType: "client",
        resourceId: clientId,
      });

      res.json({
        success: true,
        url,
        entriesCreated: createdEntries.length,
        entries: createdEntries,
        metadata: {
          title: metadata.title,
          description: metadata.description,
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ══════════════════════════════════════════════════
  // STRIPE — Invoicing & Payments for Contracts
  // ══════════════════════════════════════════════════

  // Get Stripe connection status and account info
  app.get("/api/stripe/status", async (_req, res) => {
    if (!STRIPE_SECRET_KEY) {
      return res.json({ connected: false, message: "Stripe not configured" });
    }
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(STRIPE_SECRET_KEY);
      const account = await stripe.accounts.retrieve();
      res.json({
        connected: true,
        accountId: account.id,
        businessName: (account as any).business_profile?.name ?? account.id,
      });
    } catch (err: any) {
      res.json({ connected: false, message: err.message });
    }
  });

  // Create a Stripe invoice for a contract
  app.post("/api/stripe/create-invoice", async (req, res) => {
    try {
      const { contractId, customerEmail, description } = req.body;

      if (!contractId) {
        return res.status(400).json({ message: "contractId is required" });
      }

      if (!STRIPE_SECRET_KEY) {
        return res.status(503).json({ message: "Stripe not configured" });
      }

      const contract = await storage.getContract(contractId);
      if (!contract) return res.status(404).json({ message: "Contract not found" });

      const client = await storage.getClient(contract.clientId);
      const email = customerEmail || client?.businessName;

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(STRIPE_SECRET_KEY);

      // Find or create customer
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      });

      let customer;
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: customerEmail || undefined,
          name: client?.businessName ?? "Client",
          metadata: {
            tlm_client_id: contract.clientId,
            tlm_contract_id: contractId,
          },
        });
      }

      // Calculate amount in cents (AUD)
      const amountCents = Math.round(contract.monthlyValue * 100);
      const gstHandling = contract.gstHandling ?? "inclusive";

      // Create invoice
      const invoice = await stripe.invoices.create({
        customer: customer.id,
        currency: "aud",
        collection_method: "send_invoice",
        days_until_due: 14,
        metadata: {
          tlm_contract_id: contractId,
          tlm_client_id: contract.clientId,
        },
      });

      // Add line item
      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        amount: amountCents,
        currency: "aud",
        description: description || contract.serviceDescription,
      });

      // Finalize the invoice
      const finalized = await stripe.invoices.finalizeInvoice(invoice.id!);

      // Log activity
      await storage.createActivityLog({
        action: "stripe_invoice_created",
        description: `Invoice created for ${client?.businessName ?? "client"}: $${contract.monthlyValue.toFixed(2)} AUD`,
        resourceType: "contract",
        resourceId: contractId,
      });

      res.json({
        success: true,
        invoiceId: finalized.id,
        invoiceUrl: finalized.hosted_invoice_url,
        invoicePdf: finalized.invoice_pdf,
        amount: contract.monthlyValue,
        status: finalized.status,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Send a Stripe invoice
  app.post("/api/stripe/send-invoice", async (req, res) => {
    try {
      const { invoiceId } = req.body;

      if (!invoiceId || !STRIPE_SECRET_KEY) {
        return res.status(400).json({ message: "invoiceId is required and Stripe must be configured" });
      }

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(STRIPE_SECRET_KEY);

      const sent = await stripe.invoices.sendInvoice(invoiceId);

      res.json({
        success: true,
        status: sent.status,
        invoiceUrl: sent.hosted_invoice_url,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // List recent Stripe invoices
  app.get("/api/stripe/invoices", async (req, res) => {
    try {
      if (!STRIPE_SECRET_KEY) {
        return res.json({ invoices: [], connected: false });
      }

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(STRIPE_SECRET_KEY);

      const limit = parseInt(req.query.limit as string) || 20;
      const invoices = await stripe.invoices.list({
        limit,
        expand: ["data.customer"],
      });

      res.json({
        connected: true,
        invoices: invoices.data.map(inv => ({
          id: inv.id,
          customerName: typeof inv.customer === "object" && inv.customer !== null ? (inv.customer as any).name : null,
          customerEmail: typeof inv.customer === "object" && inv.customer !== null ? (inv.customer as any).email : null,
          amount: (inv.amount_due || 0) / 100,
          currency: inv.currency,
          status: inv.status,
          dueDate: inv.due_date ? new Date(inv.due_date * 1000).toISOString() : null,
          invoiceUrl: inv.hosted_invoice_url,
          invoicePdf: inv.invoice_pdf,
          created: new Date(inv.created * 1000).toISOString(),
          contractId: inv.metadata?.tlm_contract_id ?? null,
        })),
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Create a Stripe payment link for quick payments
  app.post("/api/stripe/payment-link", async (req, res) => {
    try {
      const { contractId, amount, description } = req.body;

      if (!STRIPE_SECRET_KEY) {
        return res.status(503).json({ message: "Stripe not configured" });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(STRIPE_SECRET_KEY);

      // Create a price for one-time payment
      const price = await stripe.prices.create({
        unit_amount: Math.round(amount * 100),
        currency: "aud",
        product_data: {
          name: description || "ThirdLink Marketing Services",
          metadata: contractId ? { tlm_contract_id: contractId } : {},
        },
      });

      // Create payment link
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [{ price: price.id, quantity: 1 }],
      });

      res.json({
        success: true,
        url: paymentLink.url,
        id: paymentLink.id,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ══════════════════════════════════════════════════
  // API STATUS — Check which integrations are connected
  // ══════════════════════════════════════════════════
  app.get("/api/integrations/status", async (_req, res) => {
    const status = {
      openai: !!OPENAI_API_KEY,
      gemini: !!GOOGLE_AI_API_KEY,
      firecrawl: !!FIRECRAWL_API_KEY,
      stripe: !!STRIPE_SECRET_KEY,
      anthropic: true,
    };
    res.json(status);
  });

  // ══════════════════════════════════════════════════
  // PUBLIC CONTRACT SIGNING — Client signs via share link
  // ══════════════════════════════════════════════════
  app.patch("/api/share/:token/sign", async (req, res) => {
    try {
      const link = await storage.getShareLinkByToken(req.params.token);
      if (!link) return res.status(404).json({ message: "Share link not found" });
      if (link.type !== "contract") return res.status(400).json({ message: "This is not a contract share link" });
      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return res.status(410).json({ message: "Share link has expired" });
      }

      const contract = await storage.getContract(link.resourceId);
      if (!contract) return res.status(404).json({ message: "Contract not found" });

      const { clientSignature, signedAt } = req.body;
      if (!clientSignature) return res.status(400).json({ message: "Signature is required" });

      // Update contract with client signature
      const updatedContract = await storage.updateContract(contract.id, {
        clientSignature,
        signedAt: signedAt || new Date().toISOString(),
        status: contract.agencySignature ? "signed" : "sent",
      });

      // Log activity
      const client = await storage.getClient(contract.clientId);
      await storage.createActivityLog({
        action: "contract_client_signed",
        description: `${client?.businessName || "Client"} signed contract: ${contract.serviceDescription.slice(0, 50)}`,
        resourceType: "contract",
        resourceId: contract.id,
      });

      // If both parties have signed and Stripe is configured, create a Stripe Checkout session
      // for the first month's payment based on contract terms
      let stripeCheckoutUrl: string | null = null;
      if (updatedContract?.agencySignature && updatedContract?.clientSignature && STRIPE_SECRET_KEY) {
        try {
          const Stripe = (await import("stripe")).default;
          const stripe = new Stripe(STRIPE_SECRET_KEY);

          // Determine billing interval from payment terms
          const terms = (contract.paymentTerms || "").toLowerCase();
          let interval: "month" | "week" | "year" = "month";
          if (terms.includes("weekly")) interval = "week";
          else if (terms.includes("annual") || terms.includes("yearly")) interval = "year";

          // Create a Stripe Checkout Session with recurring price
          const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [
              {
                price_data: {
                  currency: "aud",
                  unit_amount: Math.round(contract.monthlyValue * 100),
                  recurring: { interval },
                  product_data: {
                    name: `${client?.businessName || "Client"} — ${contract.serviceDescription.slice(0, 60)}`,
                    description: [
                      `Contract period: ${contract.startDate || "TBD"} to ${contract.endDate || "Ongoing"}`,
                      contract.gstHandling === "inclusive" ? "GST Inclusive" : contract.gstHandling === "exclusive" ? "GST Exclusive" : "",
                      contract.paymentTerms || "",
                    ].filter(Boolean).join(" | "),
                  },
                },
                quantity: 1,
              },
            ],
            metadata: {
              tlm_contract_id: contract.id,
              tlm_client_id: contract.clientId,
            },
            success_url: `${req.headers.origin || req.protocol + "://" + req.get("host")}/#/share/${req.params.token}?payment=success`,
            cancel_url: `${req.headers.origin || req.protocol + "://" + req.get("host")}/#/share/${req.params.token}?payment=cancelled`,
          });

          stripeCheckoutUrl = session.url;

          await storage.createActivityLog({
            action: "stripe_checkout_created",
            description: `Stripe subscription checkout created for ${client?.businessName}: $${contract.monthlyValue}/month`,
            resourceType: "contract",
            resourceId: contract.id,
          });
        } catch (stripeErr: any) {
          console.error("Stripe checkout error:", stripeErr.message);
          // Don't fail the signing — just log it
        }
      }

      res.json({
        success: true,
        contract: updatedContract,
        fullyExecuted: !!(updatedContract?.agencySignature && updatedContract?.clientSignature),
        stripeCheckoutUrl,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ══════════════════════════════════════════════════
  // AGENCY SIGN — Agency signs their side of a contract
  // ══════════════════════════════════════════════════
  app.patch("/api/contracts/:id/sign", async (req, res) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) return res.status(404).json({ message: "Contract not found" });

      const { agencySignature, agencySignerName, agencySignerTitle } = req.body;
      if (!agencySignature) return res.status(400).json({ message: "Signature is required" });

      const updated = await storage.updateContract(contract.id, {
        agencySignature,
        signedAt: new Date().toISOString(),
        status: contract.clientSignature ? "signed" : contract.status === "draft" ? "sent" : contract.status,
      });

      // If both have signed, auto-activate
      if (updated?.agencySignature && updated?.clientSignature && updated.status !== "active") {
        await storage.updateContract(contract.id, { status: "signed" });
      }

      const client = await storage.getClient(contract.clientId);
      await storage.createActivityLog({
        action: "contract_agency_signed",
        description: `Agency signed contract for ${client?.businessName}: ${agencySignerName || ""} ${agencySignerTitle ? `(${agencySignerTitle})` : ""}`,
        resourceType: "contract",
        resourceId: contract.id,
      });

      res.json({
        success: true,
        contract: updated,
        fullyExecuted: !!(updated?.agencySignature && updated?.clientSignature),
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ══════════════════════════════════════════════════
  // AI CONTRACT GENERATION — Generate contract text from client/service details
  // ══════════════════════════════════════════════════
  app.post("/api/ai/generate-contract", async (req, res) => {
    try {
      const { clientId, serviceDescription, monthlyValue, startDate, endDate, paymentTerms, gstHandling } = req.body;

      if (!clientId || !serviceDescription) {
        return res.status(400).json({ message: "clientId and serviceDescription are required" });
      }

      const client = await storage.getClient(clientId);
      if (!client) return res.status(404).json({ message: "Client not found" });

      const settings = await storage.getAgencySettings();

      const prompt = `Generate a professional marketing services contract for ThirdLink Marketing (TLM) agency based in Australia.

Agency: ${settings?.agencyName || "ThirdLink Marketing"}
Client: ${client.businessName} (${client.industry || "General"})

Service: ${serviceDescription}
Monthly Value: $${monthlyValue || 0} AUD (${gstHandling === "inclusive" ? "GST Inclusive" : gstHandling === "exclusive" ? "GST Exclusive" : "N/A"})
Start Date: ${startDate || "TBD"}
End Date: ${endDate || "Ongoing"}
Payment Terms: ${paymentTerms || "Net 14 days"}

Generate a complete, professional contract with these sections:
1. PARTIES — Agency and Client details
2. SCOPE OF SERVICES — Detailed description based on the service
3. TERM — Contract period
4. FEES AND PAYMENT — Monthly value, GST handling, payment terms, late fees
5. DELIVERABLES — What the client can expect
6. CLIENT RESPONSIBILITIES — What the client must provide
7. INTELLECTUAL PROPERTY — Ownership of content
8. CONFIDENTIALITY — Standard NDA clause
9. TERMINATION — Notice period and conditions
10. LIMITATION OF LIABILITY — Standard clause
11. GENERAL PROVISIONS — Governing law (NSW, Australia), dispute resolution

Format it as clean contract text. Use Australian English. Be specific and professional. Include placeholder lines for signatures at the end: one for the Agency representative and one for the Client representative, each with Name, Title, Date, and Signature fields.`;

      let contractText = "";

      // Try OpenAI first
      if (OPENAI_API_KEY) {
        try {
          const OpenAI = (await import("openai")).default;
          const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            max_tokens: 3000,
            messages: [{ role: "user", content: prompt }],
          });
          contractText = completion.choices[0]?.message?.content ?? "";
        } catch (e: any) {
          console.error("OpenAI contract gen error:", e.message);
        }
      }

      // Fallback: Gemini
      if (!contractText && GOOGLE_AI_API_KEY) {
        try {
          const { GoogleGenerativeAI } = await import("@google/generative-ai");
          const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
          const result = await model.generateContent(prompt);
          contractText = result.response.text();
        } catch (e: any) {
          console.error("Gemini contract gen error:", e.message);
        }
      }

      // Fallback: Anthropic
      if (!contractText) {
        try {
          const Anthropic = (await import("@anthropic-ai/sdk")).default;
          const anthropic = new Anthropic();
          const response = await anthropic.messages.create({
            model: "claude_sonnet_4_5",
            max_tokens: 3000,
            messages: [{ role: "user", content: prompt }],
          });
          const textBlock = response.content.find((b: any) => b.type === "text");
          contractText = textBlock ? (textBlock as any).text : "";
        } catch (e: any) {
          console.error("Anthropic contract gen error:", e.message);
          contractText = "Failed to generate contract. Please try again.";
        }
      }

      res.json({ contractText });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ══════════════════════════════════════════════════
  // STRIPE CHECKOUT — Create checkout from contract (agency-initiated)
  // ══════════════════════════════════════════════════
  app.post("/api/stripe/checkout", async (req, res) => {
    try {
      const { contractId, customerEmail } = req.body;

      if (!contractId || !STRIPE_SECRET_KEY) {
        return res.status(400).json({ message: "contractId required and Stripe must be configured" });
      }

      const contract = await storage.getContract(contractId);
      if (!contract) return res.status(404).json({ message: "Contract not found" });

      const client = await storage.getClient(contract.clientId);

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(STRIPE_SECRET_KEY);

      const terms = (contract.paymentTerms || "").toLowerCase();
      let interval: "month" | "week" | "year" = "month";
      if (terms.includes("weekly")) interval = "week";
      else if (terms.includes("annual") || terms.includes("yearly")) interval = "year";

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: customerEmail || undefined,
        line_items: [
          {
            price_data: {
              currency: "aud",
              unit_amount: Math.round(contract.monthlyValue * 100),
              recurring: { interval },
              product_data: {
                name: `${client?.businessName || "Client"} — ${contract.serviceDescription.slice(0, 60)}`,
                description: [
                  `Contract: ${contract.startDate || "TBD"} to ${contract.endDate || "Ongoing"}`,
                  contract.gstHandling === "inclusive" ? "GST Inclusive" : contract.gstHandling === "exclusive" ? "GST Exclusive" : "",
                ].filter(Boolean).join(" | "),
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          tlm_contract_id: contractId,
          tlm_client_id: contract.clientId,
        },
        success_url: `${req.headers.origin || req.protocol + "://" + req.get("host")}/#/contracts?payment=success`,
        cancel_url: `${req.headers.origin || req.protocol + "://" + req.get("host")}/#/contracts?payment=cancelled`,
      });

      res.json({ url: session.url });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  return httpServer;
}
