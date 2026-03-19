import {
  type User, type InsertUser,
  type AgencySettings, type InsertAgencySettings,
  type Client, type InsertClient,
  type KnowledgeBase, type InsertKnowledgeBase,
  type Lead, type InsertLead,
  type ContentPiece, type InsertContentPiece,
  type ContentPlan, type InsertContentPlan,
  type AiSession, type InsertAiSession,
  type Task, type InsertTask,
  type Contract, type InsertContract,
  type ShareLink, type InsertShareLink,
  type ShareFeedback, type InsertShareFeedback,
  type InvoiceDraft, type InsertInvoiceDraft,
  type GeneratedImage, type InsertGeneratedImage,
  type SocialAnalytics, type InsertSocialAnalytics,
  type ActivityLog, type InsertActivityLog,
  type TeamInvite, type InsertTeamInvite,
  type RevenueGoal, type InsertRevenueGoal,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Agency Settings
  getAgencySettings(): Promise<AgencySettings | undefined>;
  updateAgencySettings(data: Partial<InsertAgencySettings>): Promise<AgencySettings | undefined>;

  // Clients
  listClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(data: InsertClient): Promise<Client>;
  updateClient(id: string, data: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;

  // Knowledge Base
  listKnowledgeBase(clientId?: string): Promise<KnowledgeBase[]>;
  getKnowledgeBaseEntry(id: string): Promise<KnowledgeBase | undefined>;
  createKnowledgeBaseEntry(data: InsertKnowledgeBase): Promise<KnowledgeBase>;
  updateKnowledgeBaseEntry(id: string, data: Partial<InsertKnowledgeBase>): Promise<KnowledgeBase | undefined>;
  deleteKnowledgeBaseEntry(id: string): Promise<boolean>;

  // Leads
  listLeads(): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(data: InsertLead): Promise<Lead>;
  updateLead(id: string, data: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<boolean>;

  // Content Pieces
  listContentPieces(clientId?: string): Promise<ContentPiece[]>;
  getContentPiece(id: string): Promise<ContentPiece | undefined>;
  createContentPiece(data: InsertContentPiece): Promise<ContentPiece>;
  updateContentPiece(id: string, data: Partial<InsertContentPiece>): Promise<ContentPiece | undefined>;
  deleteContentPiece(id: string): Promise<boolean>;

  // Content Plans
  listContentPlans(clientId?: string): Promise<ContentPlan[]>;
  getContentPlan(id: string): Promise<ContentPlan | undefined>;
  createContentPlan(data: InsertContentPlan): Promise<ContentPlan>;
  updateContentPlan(id: string, data: Partial<InsertContentPlan>): Promise<ContentPlan | undefined>;
  deleteContentPlan(id: string): Promise<boolean>;

  // AI Sessions
  listAiSessions(clientId?: string): Promise<AiSession[]>;
  getAiSession(id: string): Promise<AiSession | undefined>;
  createAiSession(data: InsertAiSession): Promise<AiSession>;
  updateAiSession(id: string, data: Partial<InsertAiSession>): Promise<AiSession | undefined>;

  // Tasks
  listTasks(clientId?: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(data: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Contracts
  listContracts(clientId?: string): Promise<Contract[]>;
  getContract(id: string): Promise<Contract | undefined>;
  createContract(data: InsertContract): Promise<Contract>;
  updateContract(id: string, data: Partial<InsertContract>): Promise<Contract | undefined>;
  deleteContract(id: string): Promise<boolean>;

  // Share Links
  listShareLinks(): Promise<ShareLink[]>;
  getShareLinkByToken(token: string): Promise<ShareLink | undefined>;
  createShareLink(data: InsertShareLink): Promise<ShareLink>;
  deleteShareLink(id: string): Promise<boolean>;
  listShareFeedback(shareLinkId: string): Promise<ShareFeedback[]>;
  createShareFeedback(data: InsertShareFeedback): Promise<ShareFeedback>;

  // Generated Images
  listGeneratedImages(clientId?: string): Promise<GeneratedImage[]>;
  getGeneratedImage(id: string): Promise<GeneratedImage | undefined>;
  createGeneratedImage(data: InsertGeneratedImage): Promise<GeneratedImage>;
  updateGeneratedImage(id: string, data: Partial<InsertGeneratedImage>): Promise<GeneratedImage | undefined>;
  deleteGeneratedImage(id: string): Promise<boolean>;

  // Social Analytics
  listSocialAnalytics(clientId: string, platform?: string): Promise<SocialAnalytics[]>;
  createSocialAnalytics(data: InsertSocialAnalytics): Promise<SocialAnalytics>;

  // Activity Log
  listActivityLog(limit?: number): Promise<ActivityLog[]>;
  createActivityLog(data: InsertActivityLog): Promise<ActivityLog>;

  // Team Invites
  listTeamInvites(): Promise<TeamInvite[]>;
  getTeamInvite(id: string): Promise<TeamInvite | undefined>;
  createTeamInvite(data: InsertTeamInvite): Promise<TeamInvite>;
  updateTeamInvite(id: string, data: Partial<InsertTeamInvite>): Promise<TeamInvite | undefined>;
  deleteTeamInvite(id: string): Promise<boolean>;

  // Revenue Goals
  listRevenueGoals(): Promise<RevenueGoal[]>;
  getRevenueGoal(id: string): Promise<RevenueGoal | undefined>;
  createRevenueGoal(data: InsertRevenueGoal): Promise<RevenueGoal>;
  updateRevenueGoal(id: string, data: Partial<InsertRevenueGoal>): Promise<RevenueGoal | undefined>;
  deleteRevenueGoal(id: string): Promise<boolean>;

  // Invoice Drafts
  listInvoiceDrafts(clientId?: string): Promise<InvoiceDraft[]>;
  getInvoiceDraft(id: string): Promise<InvoiceDraft | undefined>;
  createInvoiceDraft(data: InsertInvoiceDraft): Promise<InvoiceDraft>;
  updateInvoiceDraft(id: string, data: Partial<InsertInvoiceDraft>): Promise<InvoiceDraft | undefined>;
  deleteInvoiceDraft(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private agencySettingsMap: Map<string, AgencySettings> = new Map();
  private clients: Map<string, Client> = new Map();
  private knowledgeBaseEntries: Map<string, KnowledgeBase> = new Map();
  private leads: Map<string, Lead> = new Map();
  private contentPieces: Map<string, ContentPiece> = new Map();
  private contentPlans: Map<string, ContentPlan> = new Map();
  private aiSessions: Map<string, AiSession> = new Map();
  private tasks: Map<string, Task> = new Map();
  private contracts: Map<string, Contract> = new Map();
  private shareLinks: Map<string, ShareLink> = new Map();
  private shareFeedbackEntries: Map<string, ShareFeedback> = new Map();
  private invoiceDrafts: Map<string, InvoiceDraft> = new Map();
  private generatedImages: Map<string, GeneratedImage> = new Map();
  private socialAnalyticsEntries: Map<string, SocialAnalytics> = new Map();
  private activityLogEntries: Map<string, ActivityLog> = new Map();
  private teamInvites: Map<string, TeamInvite> = new Map();
  private revenueGoals: Map<string, RevenueGoal> = new Map();

  constructor() {
    this.seedData();
  }

  // ── Users ─────────────────────────────────────────
  async getUser(id: string) { return this.users.get(id); }
  async getUserByUsername(username: string) {
    return Array.from(this.users.values()).find(u => u.username === username);
  }
  async listUsers() { return Array.from(this.users.values()); }
  async createUser(data: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...data, id, avatar: data.avatar ?? null, role: data.role ?? "strategist", agencyId: data.agencyId ?? null, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }
  async updateUser(id: string, data: Partial<InsertUser>) {
    const u = this.users.get(id);
    if (!u) return undefined;
    const updated = { ...u, ...data };
    this.users.set(id, updated);
    return updated;
  }
  async deleteUser(id: string) { return this.users.delete(id); }

  // ── Agency Settings ───────────────────────────────
  async getAgencySettings() {
    return Array.from(this.agencySettingsMap.values())[0];
  }
  async updateAgencySettings(data: Partial<InsertAgencySettings>) {
    const existing = await this.getAgencySettings();
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.agencySettingsMap.set(existing.id, updated);
    return updated;
  }

  // ── Clients ───────────────────────────────────────
  async listClients() { return Array.from(this.clients.values()); }
  async getClient(id: string) { return this.clients.get(id); }
  async createClient(data: InsertClient): Promise<Client> {
    const id = randomUUID();
    const client: Client = {
      ...data, id,
      isPersonal: data.isPersonal ?? false,
      industry: data.industry ?? null, website: data.website ?? null,
      mrr: data.mrr ?? 0, status: data.status ?? "onboarding",
      contractStart: data.contractStart ?? null, contractEnd: data.contractEnd ?? null,
      notes: data.notes ?? null, assignedTeam: data.assignedTeam ?? null,
      brandLogo: data.brandLogo ?? null, brandColors: data.brandColors ?? null, brandTypography: data.brandTypography ?? null,
      createdAt: new Date(),
    };
    this.clients.set(id, client);
    return client;
  }
  async updateClient(id: string, data: Partial<InsertClient>) {
    const c = this.clients.get(id);
    if (!c) return undefined;
    const updated = { ...c, ...data };
    this.clients.set(id, updated);
    return updated;
  }
  async deleteClient(id: string) { return this.clients.delete(id); }

  // ── Knowledge Base ────────────────────────────────
  async listKnowledgeBase(clientId?: string) {
    const all = Array.from(this.knowledgeBaseEntries.values());
    return clientId ? all.filter(e => e.clientId === clientId) : all;
  }
  async getKnowledgeBaseEntry(id: string) { return this.knowledgeBaseEntries.get(id); }
  async createKnowledgeBaseEntry(data: InsertKnowledgeBase): Promise<KnowledgeBase> {
    const id = randomUUID();
    const entry: KnowledgeBase = { ...data, id, createdAt: new Date() };
    this.knowledgeBaseEntries.set(id, entry);
    return entry;
  }
  async updateKnowledgeBaseEntry(id: string, data: Partial<InsertKnowledgeBase>) {
    const e = this.knowledgeBaseEntries.get(id);
    if (!e) return undefined;
    const updated = { ...e, ...data };
    this.knowledgeBaseEntries.set(id, updated);
    return updated;
  }
  async deleteKnowledgeBaseEntry(id: string) { return this.knowledgeBaseEntries.delete(id); }

  // ── Leads ─────────────────────────────────────────
  async listLeads() { return Array.from(this.leads.values()); }
  async getLead(id: string) { return this.leads.get(id); }
  async createLead(data: InsertLead): Promise<Lead> {
    const id = randomUUID();
    const lead: Lead = {
      ...data, id,
      email: data.email ?? null, phone: data.phone ?? null,
      company: data.company ?? null, proposalValue: data.proposalValue ?? 0,
      notes: data.notes ?? null, stage: data.stage ?? "new",
      createdAt: new Date(),
    };
    this.leads.set(id, lead);
    return lead;
  }
  async updateLead(id: string, data: Partial<InsertLead>) {
    const l = this.leads.get(id);
    if (!l) return undefined;
    const updated = { ...l, ...data };
    this.leads.set(id, updated);
    return updated;
  }
  async deleteLead(id: string) { return this.leads.delete(id); }

  // ── Content Pieces ────────────────────────────────
  async listContentPieces(clientId?: string) {
    const all = Array.from(this.contentPieces.values());
    return clientId ? all.filter(c => c.clientId === clientId) : all;
  }
  async getContentPiece(id: string) { return this.contentPieces.get(id); }
  async createContentPiece(data: InsertContentPiece): Promise<ContentPiece> {
    const id = randomUUID();
    const piece: ContentPiece = {
      ...data, id,
      status: data.status ?? "idea",
      script: data.script ?? null, caption: data.caption ?? null,
      hashtags: data.hashtags ?? null, platforms: data.platforms ?? null,
      scheduledDate: data.scheduledDate ?? null,
      assignedTo: data.assignedTo ?? null, planId: data.planId ?? null,
      createdAt: new Date(),
    };
    this.contentPieces.set(id, piece);
    return piece;
  }
  async updateContentPiece(id: string, data: Partial<InsertContentPiece>) {
    const c = this.contentPieces.get(id);
    if (!c) return undefined;
    const updated = { ...c, ...data };
    this.contentPieces.set(id, updated);
    return updated;
  }
  async deleteContentPiece(id: string) { return this.contentPieces.delete(id); }

  // ── Content Plans ─────────────────────────────────
  async listContentPlans(clientId?: string) {
    const all = Array.from(this.contentPlans.values());
    return clientId ? all.filter(p => p.clientId === clientId) : all;
  }
  async getContentPlan(id: string) { return this.contentPlans.get(id); }
  async createContentPlan(data: InsertContentPlan): Promise<ContentPlan> {
    const id = randomUUID();
    const plan: ContentPlan = {
      ...data, id,
      description: data.description ?? null,
      ideas: data.ideas ?? null,
      status: data.status ?? "draft",
      createdAt: new Date(),
    };
    this.contentPlans.set(id, plan);
    return plan;
  }
  async updateContentPlan(id: string, data: Partial<InsertContentPlan>) {
    const p = this.contentPlans.get(id);
    if (!p) return undefined;
    const updated = { ...p, ...data };
    this.contentPlans.set(id, updated);
    return updated;
  }
  async deleteContentPlan(id: string) { return this.contentPlans.delete(id); }

  // ── AI Sessions ───────────────────────────────────
  async listAiSessions(clientId?: string) {
    const all = Array.from(this.aiSessions.values());
    return clientId ? all.filter(s => s.clientId === clientId) : all;
  }
  async getAiSession(id: string) { return this.aiSessions.get(id); }
  async createAiSession(data: InsertAiSession): Promise<AiSession> {
    const id = randomUUID();
    const session: AiSession = {
      ...data, id,
      messages: data.messages ?? null,
      createdAt: new Date(), updatedAt: new Date(),
    };
    this.aiSessions.set(id, session);
    return session;
  }
  async updateAiSession(id: string, data: Partial<InsertAiSession>) {
    const s = this.aiSessions.get(id);
    if (!s) return undefined;
    const updated = { ...s, ...data, updatedAt: new Date() };
    this.aiSessions.set(id, updated);
    return updated;
  }

  // ── Tasks ─────────────────────────────────────────
  async listTasks(clientId?: string) {
    const all = Array.from(this.tasks.values());
    return clientId ? all.filter(t => t.clientId === clientId) : all;
  }
  async getTask(id: string) { return this.tasks.get(id); }
  async createTask(data: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = {
      ...data, id,
      description: data.description ?? null,
      status: data.status ?? "todo",
      dueDate: data.dueDate ?? null,
      assignedTo: data.assignedTo ?? null,
      clientId: data.clientId ?? null,
      createdAt: new Date(),
    };
    this.tasks.set(id, task);
    return task;
  }
  async updateTask(id: string, data: Partial<InsertTask>) {
    const t = this.tasks.get(id);
    if (!t) return undefined;
    const updated = { ...t, ...data };
    this.tasks.set(id, updated);
    return updated;
  }
  async deleteTask(id: string) { return this.tasks.delete(id); }

  // ── Contracts ─────────────────────────────────────
  async listContracts(clientId?: string) {
    const all = Array.from(this.contracts.values());
    return clientId ? all.filter(c => c.clientId === clientId) : all;
  }
  async getContract(id: string) { return this.contracts.get(id); }
  async createContract(data: InsertContract): Promise<Contract> {
    const id = randomUUID();
    const contract: Contract = {
      ...data, id,
      endDate: data.endDate ?? null,
      paymentTerms: data.paymentTerms ?? null,
      gstHandling: data.gstHandling ?? "inclusive",
      status: data.status ?? "draft",
      agencySignature: data.agencySignature ?? null,
      clientSignature: data.clientSignature ?? null,
      signedAt: data.signedAt ?? null,
      shareToken: data.shareToken ?? null,
      createdAt: new Date(),
    };
    this.contracts.set(id, contract);
    return contract;
  }
  async updateContract(id: string, data: Partial<InsertContract>) {
    const c = this.contracts.get(id);
    if (!c) return undefined;
    const updated = { ...c, ...data };
    this.contracts.set(id, updated);
    return updated;
  }
  async deleteContract(id: string) { return this.contracts.delete(id); }

  // ── Share Links ───────────────────────────────────
  async listShareLinks() { return Array.from(this.shareLinks.values()); }
  async getShareLinkByToken(token: string) {
    return Array.from(this.shareLinks.values()).find(l => l.token === token);
  }
  async createShareLink(data: InsertShareLink): Promise<ShareLink> {
    const id = randomUUID();
    const link: ShareLink = {
      ...data, id,
      expiresAt: data.expiresAt ?? null,
      clientId: data.clientId ?? null,
      createdAt: new Date(),
    };
    this.shareLinks.set(id, link);
    return link;
  }
  async deleteShareLink(id: string) { return this.shareLinks.delete(id); }
  async listShareFeedback(shareLinkId: string) {
    return Array.from(this.shareFeedbackEntries.values())
      .filter((entry) => entry.shareLinkId === shareLinkId)
      .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
  }
  async createShareFeedback(data: InsertShareFeedback): Promise<ShareFeedback> {
    const id = randomUUID();
    const entry: ShareFeedback = {
      ...data,
      id,
      kind: data.kind ?? "comment",
      authorName: data.authorName ?? null,
      authorEmail: data.authorEmail ?? null,
      message: data.message ?? null,
      createdAt: new Date(),
    };
    this.shareFeedbackEntries.set(id, entry);
    return entry;
  }

  // ── Generated Images ──────────────────────────────
  async listGeneratedImages(clientId?: string) {
    const all = Array.from(this.generatedImages.values());
    return clientId ? all.filter(i => i.clientId === clientId) : all;
  }
  async getGeneratedImage(id: string) { return this.generatedImages.get(id); }
  async createGeneratedImage(data: InsertGeneratedImage): Promise<GeneratedImage> {
    const id = randomUUID();
    const img: GeneratedImage = {
      ...data, id,
      model: data.model ?? "nano_banana_2",
      styleNotes: data.styleNotes ?? null,
      clientId: data.clientId ?? null,
      status: data.status ?? "pending",
      createdAt: new Date(),
    };
    this.generatedImages.set(id, img);
    return img;
  }
  async updateGeneratedImage(id: string, data: Partial<InsertGeneratedImage>) {
    const i = this.generatedImages.get(id);
    if (!i) return undefined;
    const updated = { ...i, ...data };
    this.generatedImages.set(id, updated);
    return updated;
  }
  async deleteGeneratedImage(id: string) { return this.generatedImages.delete(id); }

  // ── Social Analytics ──────────────────────────────
  async listSocialAnalytics(clientId: string, platform?: string) {
    const all = Array.from(this.socialAnalyticsEntries.values()).filter(a => a.clientId === clientId);
    return platform ? all.filter(a => a.platform === platform) : all;
  }
  async createSocialAnalytics(data: InsertSocialAnalytics): Promise<SocialAnalytics> {
    const id = randomUUID();
    const entry: SocialAnalytics = {
      ...data, id,
      followers: data.followers ?? 0, impressions: data.impressions ?? 0,
      engagementRate: data.engagementRate ?? 0, reach: data.reach ?? 0,
      likes: data.likes ?? 0, comments: data.comments ?? 0, shares: data.shares ?? 0,
    };
    this.socialAnalyticsEntries.set(id, entry);
    return entry;
  }

  // ── Activity Log ──────────────────────────────────
  async listActivityLog(limit?: number) {
    const all = Array.from(this.activityLogEntries.values())
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
    return limit ? all.slice(0, limit) : all;
  }
  async createActivityLog(data: InsertActivityLog): Promise<ActivityLog> {
    const id = randomUUID();
    const entry: ActivityLog = {
      ...data, id,
      userId: data.userId ?? null,
      resourceType: data.resourceType ?? null,
      resourceId: data.resourceId ?? null,
      createdAt: new Date(),
    };
    this.activityLogEntries.set(id, entry);
    return entry;
  }

  // ── Team Invites ──────────────────────────────────
  async listTeamInvites() { return Array.from(this.teamInvites.values()); }
  async getTeamInvite(id: string) { return this.teamInvites.get(id); }
  async createTeamInvite(data: InsertTeamInvite): Promise<TeamInvite> {
    const id = randomUUID();
    const invite: TeamInvite = {
      ...data, id,
      role: data.role ?? "strategist",
      status: data.status ?? "pending",
      invitedBy: data.invitedBy ?? null,
      createdAt: new Date(),
    };
    this.teamInvites.set(id, invite);
    return invite;
  }
  async updateTeamInvite(id: string, data: Partial<InsertTeamInvite>) {
    const i = this.teamInvites.get(id);
    if (!i) return undefined;
    const updated = { ...i, ...data };
    this.teamInvites.set(id, updated);
    return updated;
  }
  async deleteTeamInvite(id: string) { return this.teamInvites.delete(id); }

  // ── Revenue Goals ─────────────────────────────────
  async listRevenueGoals() { return Array.from(this.revenueGoals.values()); }
  async getRevenueGoal(id: string) { return this.revenueGoals.get(id); }
  async createRevenueGoal(data: InsertRevenueGoal): Promise<RevenueGoal> {
    const id = randomUUID();
    const goal: RevenueGoal = { ...data, id, createdAt: new Date() };
    this.revenueGoals.set(id, goal);
    return goal;
  }
  async updateRevenueGoal(id: string, data: Partial<InsertRevenueGoal>) {
    const g = this.revenueGoals.get(id);
    if (!g) return undefined;
    const updated = { ...g, ...data };
    this.revenueGoals.set(id, updated);
    return updated;
  }
  async deleteRevenueGoal(id: string) { return this.revenueGoals.delete(id); }

  // ── Invoice Drafts ───────────────────────────────
  async listInvoiceDrafts(clientId?: string) {
    const all = Array.from(this.invoiceDrafts.values()).sort(
      (a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0),
    );
    return clientId ? all.filter((draft) => draft.clientId === clientId) : all;
  }
  async getInvoiceDraft(id: string) { return this.invoiceDrafts.get(id); }
  async createInvoiceDraft(data: InsertInvoiceDraft): Promise<InvoiceDraft> {
    const id = randomUUID();
    const now = new Date();
    const draft: InvoiceDraft = {
      ...data,
      id,
      contractId: data.contractId ?? null,
      recipientEmail: data.recipientEmail ?? null,
      billingCompany: data.billingCompany ?? null,
      billingAbn: data.billingAbn ?? null,
      currency: data.currency ?? "aud",
      lineItems: data.lineItems ?? [],
      notes: data.notes ?? null,
      paymentTerms: data.paymentTerms ?? null,
      dueInDays: data.dueInDays ?? 14,
      status: data.status ?? "draft",
      stripeInvoiceId: data.stripeInvoiceId ?? null,
      stripeInvoiceUrl: data.stripeInvoiceUrl ?? null,
      stripeInvoicePdf: data.stripeInvoicePdf ?? null,
      lastSyncedAt: data.lastSyncedAt ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.invoiceDrafts.set(id, draft);
    return draft;
  }
  async updateInvoiceDraft(id: string, data: Partial<InsertInvoiceDraft>) {
    const existing = this.invoiceDrafts.get(id);
    if (!existing) return undefined;
    const updated: InvoiceDraft = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.invoiceDrafts.set(id, updated);
    return updated;
  }
  async deleteInvoiceDraft(id: string) { return this.invoiceDrafts.delete(id); }

  // ═══════════════════════════════════════════════════
  // SEED DATA
  // ═══════════════════════════════════════════════════
  private seedData() {
    const now = new Date();
    const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000);
    const dateStr = (daysAgo: number) => d(daysAgo).toISOString().split("T")[0];

    // ── Users (1 owner + 3 team members) ────────────
    const userJoshua: User = { id: "u-1", username: "joshua", password: "hashed", name: "Joshua Kerry", email: "joshuaakerry14701@gmail.com", avatar: null, role: "owner", agencyId: "ag-1", createdAt: d(120) };
    const userSophie: User = { id: "u-2", username: "sophie", password: "hashed", name: "Sophie Chen", email: "sophie@tlmagency.com", avatar: null, role: "admin", agencyId: "ag-1", createdAt: d(90) };
    const userMarcus: User = { id: "u-3", username: "marcus", password: "hashed", name: "Marcus Taylor", email: "marcus@tlmagency.com", avatar: null, role: "strategist", agencyId: "ag-1", createdAt: d(60) };
    const userLena: User = { id: "u-4", username: "lena", password: "hashed", name: "Lena Voss", email: "lena@tlmagency.com", avatar: null, role: "editor", agencyId: "ag-1", createdAt: d(45) };

    [userJoshua, userSophie, userMarcus, userLena].forEach(u => this.users.set(u.id, u));

    // ── Agency Settings ─────────────────────────────
    const settings: AgencySettings = {
      id: "ag-1",
      agencyName: "ThirdLink Marketing",
      logo: null,
      brandColors: { primary: "#6C5CE7", secondary: "#A29BFE", accent: "#00CEC9" },
      timezone: "Australia/Sydney",
      workingHours: "9:00-17:00",
      aiVoice: "professional",
      aiTone: "friendly and strategic",
      customPromptTemplates: {
        "content-idea": "Generate 5 content ideas for {client} focusing on {topic}. Consider their brand voice, target audience, and current social trends.",
        "caption-writer": "Write an engaging caption for {platform} about {topic} for {client}. Include relevant hashtags and a call to action.",
        "strategy-brief": "Create a monthly content strategy brief for {client} covering goals, themes, content mix, and posting schedule.",
      },
      emailTemplates: {
        "welcome": { subject: "Welcome to ThirdLink Marketing!", body: "Hi {name},\n\nWelcome aboard! We're excited to start working together..." },
        "monthly-report": { subject: "Your Monthly Performance Report", body: "Hi {name},\n\nHere's your monthly performance summary..." },
      },
      notificationPrefs: { emailDigest: true, taskReminders: true, clientAlerts: true },
      appearance: "system",
    };
    this.agencySettingsMap.set(settings.id, settings);

    // ── Clients ─────────────────────────────────────
    const clientBloom: Client = { id: "c-1", businessName: "Bloom Botanicals", isPersonal: false, industry: "Retail / Wellness", website: "https://bloombotanicals.com.au", mrr: 3200, status: "active", contractStart: dateStr(180), contractEnd: dateStr(-185), notes: "Organic skincare and plant-based wellness products. Strong Instagram presence.", assignedTeam: ["u-1", "u-3"], brandLogo: null, brandColors: null, brandTypography: null, createdAt: d(180) };
    const clientVelocity: Client = { id: "c-2", businessName: "Velocity Fitness", isPersonal: false, industry: "Health & Fitness", website: "https://velocityfitness.com.au", mrr: 4500, status: "active", contractStart: dateStr(150), contractEnd: dateStr(-215), notes: "Premium gym chain with 4 locations. Focus on TikTok and Instagram Reels.", assignedTeam: ["u-2", "u-4"], brandLogo: null, brandColors: null, brandTypography: null, createdAt: d(150) };
    const clientLuna: Client = { id: "c-3", businessName: "Luna Beauty Co", isPersonal: false, industry: "Beauty & Cosmetics", website: "https://lunabeautyco.com.au", mrr: 5800, status: "active", contractStart: dateStr(90), contractEnd: dateStr(-275), notes: "Indie beauty brand targeting Gen Z. Heavy influencer collab strategy.", assignedTeam: ["u-1", "u-2", "u-4"], brandLogo: null, brandColors: null, brandTypography: null, createdAt: d(90) };
    const clientTechNova: Client = { id: "c-4", businessName: "TechNova Solutions", isPersonal: false, industry: "SaaS / Technology", website: "https://technova.io", mrr: 2800, status: "onboarding", contractStart: dateStr(14), contractEnd: dateStr(-351), notes: "B2B SaaS company. Need LinkedIn and thought leadership strategy.", assignedTeam: ["u-1", "u-3"], brandLogo: null, brandColors: null, brandTypography: null, createdAt: d(14) };
    const clientCoastal: Client = { id: "c-5", businessName: "Coastal Living Realty", isPersonal: false, industry: "Real Estate", website: "https://coastallivingrealty.com.au", mrr: 1500, status: "paused", contractStart: dateStr(240), contractEnd: dateStr(10), notes: "Paused services during slow market. Retainer on hold.", assignedTeam: ["u-3"], brandLogo: null, brandColors: null, brandTypography: null, createdAt: d(240) };
    const clientEmber: Client = { id: "c-6", businessName: "Ember & Oak Restaurant", isPersonal: false, industry: "Hospitality / F&B", website: "https://emberandoak.com.au", mrr: 0, status: "churned", contractStart: dateStr(300), contractEnd: dateStr(30), notes: "Closed account after ownership change. Was a good client.", assignedTeam: [], brandLogo: null, brandColors: null, brandTypography: null, createdAt: d(300) };

    [clientBloom, clientVelocity, clientLuna, clientTechNova, clientCoastal, clientEmber].forEach(c => this.clients.set(c.id, c));

    // ── Knowledge Base ──────────────────────────────
    const kbEntries: KnowledgeBase[] = [
      { id: "kb-1", clientId: "c-1", category: "brand", title: "Brand Voice Guidelines", content: "Bloom Botanicals speaks with warmth and authenticity. Tone: nurturing, knowledgeable, eco-conscious. Avoid: clinical language, aggressive sales tactics. Key phrases: 'nature-inspired', 'plant-powered', 'mindful beauty'.", createdAt: d(170) },
      { id: "kb-2", clientId: "c-1", category: "audience", title: "Target Audience Profile", content: "Primary: Women 25-45, health-conscious, eco-minded. Secondary: Men 30-50 interested in natural grooming. Income: $65K-$120K. Values: sustainability, transparency, self-care rituals. Social: Instagram (primary), Facebook (secondary).", createdAt: d(170) },
      { id: "kb-3", clientId: "c-1", category: "competitors", title: "Competitive Landscape", content: "Main competitors: Sukin, Aesop (aspirational), The Ordinary. Bloom differentiates through Australian-native botanicals and smaller batch production. Price point sits between mass-market and premium.", createdAt: d(168) },
      { id: "kb-4", clientId: "c-3", category: "brand", title: "Luna Beauty Brand Bible", content: "Bold, unapologetic, inclusive. Tone: confident, playful, empowering. Visual style: high contrast, neon accents, diverse representation. Tagline: 'Your Rules. Your Glow.' Never: body-shame, use 'anti-aging', exclude skin tones.", createdAt: d(85) },
      { id: "kb-5", clientId: "c-3", category: "audience", title: "Luna Target Demo", content: "Gen Z and young Millennials (18-28). Gender-inclusive. Digital-first, TikTok-native. Values: self-expression, cruelty-free, affordability. Shopping: impulse + social proof. Influencer trust > brand ads.", createdAt: d(85) },
      { id: "kb-6", clientId: "c-3", category: "offers", title: "Current Promotions", content: "Luna Loyalty Club: spend $50 get 10% off next. Monthly mystery box ($39.95). Referral program: give $10, get $10. Seasonal: 'Summer Glow Kit' launching December.", createdAt: d(30) },
      { id: "kb-7", clientId: "c-2", category: "brand", title: "Velocity Fitness Brand", content: "High-energy, motivational, community-driven. Tone: encouraging but not preachy. Visual: dynamic action shots, bold typography, dark backgrounds with vibrant accents. Tagline: 'Move. Push. Become.'", createdAt: d(140) },
      { id: "kb-8", clientId: "c-2", category: "audience", title: "Velocity Target Members", content: "Primary: Active adults 22-40, urban professionals. Both genders equally. Income: $55K-$100K. Motivations: stress relief, aesthetics, community. Platforms: Instagram, TikTok, YouTube Shorts.", createdAt: d(140) },
    ];
    kbEntries.forEach(kb => this.knowledgeBaseEntries.set(kb.id, kb));

    // ── Leads ───────────────────────────────────────
    const leadsList: Lead[] = [
      { id: "l-1", contactName: "Rachel Park", email: "rachel@greenthread.com.au", phone: "0412 345 678", company: "Green Thread Fashion", proposalValue: 3500, notes: "Sustainable fashion brand, interested in full social management", stage: "new", createdAt: d(2) },
      { id: "l-2", contactName: "Tom Bridges", email: "tom@bridgeslaw.com.au", phone: "0423 456 789", company: "Bridges Legal", proposalValue: 2200, notes: "Law firm wanting LinkedIn thought leadership", stage: "contacted", createdAt: d(5) },
      { id: "l-3", contactName: "Aisha Kamal", email: "aisha@spiceroute.com.au", phone: "0434 567 890", company: "Spice Route Catering", proposalValue: 1800, notes: "Event catering, needs Instagram and Google Business", stage: "contacted", createdAt: d(8) },
      { id: "l-4", contactName: "Daniel Cho", email: "daniel@novafit.com.au", phone: "0445 678 901", company: "NovaFit Supplements", proposalValue: 5500, notes: "Sports nutrition brand. Wants influencer + content package.", stage: "proposal", createdAt: d(12) },
      { id: "l-5", contactName: "Emma Liu", email: "emma@pixelcraft.io", phone: "0456 789 012", company: "PixelCraft Studio", proposalValue: 4200, notes: "Design studio wanting brand refresh + social strategy", stage: "proposal", createdAt: d(15) },
      { id: "l-6", contactName: "James O'Brien", email: "james@baysidemarine.com.au", phone: "0467 890 123", company: "Bayside Marine Services", proposalValue: 2800, notes: "Marine services. Needs local SEO + social.", stage: "negotiating", createdAt: d(20) },
      { id: "l-7", contactName: "Priya Sharma", email: "priya@zenspace.com.au", phone: "0478 901 234", company: "ZenSpace Yoga", proposalValue: 2000, notes: "Yoga studio chain (3 locations)", stage: "negotiating", createdAt: d(18) },
      { id: "l-8", contactName: "Liam Foster", email: "liam@ridgelineconstruction.com.au", phone: "0489 012 345", company: "Ridgeline Construction", proposalValue: 6000, notes: "Won — signed last week. Full content + ads package.", stage: "won", createdAt: d(30) },
      { id: "l-9", contactName: "Sarah Kim", email: "sarah@petalandstone.com.au", phone: null, company: "Petal & Stone Jewellery", proposalValue: 1500, notes: "Budget too low for full service. Referred to freelancer.", stage: "lost", createdAt: d(25) },
      { id: "l-10", contactName: "Chris Nguyen", email: "chris@cloudninetech.io", phone: "0490 123 456", company: "CloudNine Tech", proposalValue: 4800, notes: "SaaS startup, interested in content marketing + LinkedIn ads", stage: "new", createdAt: d(1) },
    ];
    leadsList.forEach(l => this.leads.set(l.id, l));

    // ── Content Pieces ──────────────────────────────
    const contentList: ContentPiece[] = [
      { id: "cp-1", clientId: "c-1", title: "Spring Skincare Routine Reel", type: "reel", status: "live", script: "Open on morning light through a bathroom window...", caption: "Spring is here and your skin knows it 🌸 Here's our 3-step routine for the season change.", hashtags: ["#bloombotanicals", "#springskincre", "#naturalbeauty"], platforms: ["instagram", "tiktok"], scheduledDate: dateStr(3), assignedTo: "u-4", planId: null, createdAt: d(10) },
      { id: "cp-2", clientId: "c-1", title: "Behind the Scenes: Ingredient Sourcing", type: "carousel", status: "approved", script: null, caption: "From farm to face — see where our ingredients come from.", hashtags: ["#behindthescenes", "#cleanbeauty", "#australian"], platforms: ["instagram"], scheduledDate: dateStr(-2), assignedTo: "u-4", planId: null, createdAt: d(8) },
      { id: "cp-3", clientId: "c-1", title: "Customer Testimonial — Sarah M.", type: "video", status: "edited", script: "Interview format: Q&A about favorite products", caption: null, hashtags: null, platforms: ["instagram", "facebook"], scheduledDate: dateStr(-5), assignedTo: "u-3", planId: null, createdAt: d(12) },
      { id: "cp-4", clientId: "c-2", title: "30-Day Challenge Kickoff", type: "reel", status: "live", script: "High energy montage of members working out", caption: "Your 30-day transformation starts NOW 🔥 Tag someone who needs this.", hashtags: ["#velocityfitness", "#30daychallenge", "#fitnessmotivation"], platforms: ["instagram", "tiktok"], scheduledDate: dateStr(1), assignedTo: "u-2", planId: null, createdAt: d(5) },
      { id: "cp-5", clientId: "c-2", title: "Trainer Spotlight: Coach Mike", type: "video", status: "filmed", script: "Day in the life of our head PT", caption: null, hashtags: null, platforms: ["instagram", "youtube"], scheduledDate: dateStr(-7), assignedTo: "u-4", planId: null, createdAt: d(14) },
      { id: "cp-6", clientId: "c-2", title: "Nutrition Tips Carousel", type: "carousel", status: "scripted", script: "5 slides: Macro basics, protein timing, hydration, pre-workout, post-workout", caption: "Fuel your gains the right way 💪", hashtags: ["#nutritiontips", "#fitfood", "#velocityfitness"], platforms: ["instagram"], scheduledDate: dateStr(-10), assignedTo: "u-3", planId: null, createdAt: d(6) },
      { id: "cp-7", clientId: "c-3", title: "Luna Summer Drop Announcement", type: "reel", status: "live", script: "Fast-paced product reveal with trending audio", caption: "SHE'S HERE. The Summer Glow collection just dropped 🔥✨", hashtags: ["#lunabeauty", "#summerglow", "#newdrop"], platforms: ["instagram", "tiktok"], scheduledDate: dateStr(0), assignedTo: "u-1", planId: null, createdAt: d(3) },
      { id: "cp-8", clientId: "c-3", title: "Get Ready With Me ft. @makeupbykai", type: "ugc", status: "edited", script: "Influencer GRWM using Luna products", caption: "GRWM with @makeupbykai using ONLY Luna Beauty 💄", hashtags: ["#grwm", "#lunabeauty", "#makeuptutorial"], platforms: ["tiktok", "instagram"], scheduledDate: dateStr(-4), assignedTo: "u-4", planId: null, createdAt: d(7) },
      { id: "cp-9", clientId: "c-3", title: "Shade Range Comparison", type: "carousel", status: "idea", script: null, caption: null, hashtags: null, platforms: ["instagram"], scheduledDate: null, assignedTo: null, planId: null, createdAt: d(2) },
      { id: "cp-10", clientId: "c-3", title: "Luna x Pride Collection Teaser", type: "story", status: "idea", script: null, caption: null, hashtags: null, platforms: ["instagram", "tiktok"], scheduledDate: null, assignedTo: null, planId: null, createdAt: d(1) },
      { id: "cp-11", clientId: "c-2", title: "Member Transformation Reel", type: "reel", status: "idea", script: null, caption: null, hashtags: null, platforms: ["instagram", "tiktok"], scheduledDate: null, assignedTo: null, planId: null, createdAt: d(1) },
      { id: "cp-12", clientId: "c-4", title: "TechNova Welcome Post", type: "text_post", status: "scripted", script: "We're thrilled to partner with ThirdLink Marketing...", caption: "Excited to announce our new content partnership with @thirdlinkmarketing", hashtags: ["#B2B", "#SaaS", "#technovasolutions"], platforms: ["linkedin"], scheduledDate: dateStr(-3), assignedTo: "u-3", planId: null, createdAt: d(10) },
      { id: "cp-13", clientId: "c-4", title: "5 Productivity Hacks for Remote Teams", type: "carousel", status: "idea", script: null, caption: null, hashtags: null, platforms: ["linkedin", "twitter"], scheduledDate: null, assignedTo: null, planId: null, createdAt: d(3) },
      { id: "cp-14", clientId: "c-1", title: "Earth Day Special — Zero Waste Tips", type: "carousel", status: "scripted", script: "8 slides covering plastic-free swaps in beauty routines", caption: "This Earth Day, small swaps make a big difference 🌍", hashtags: ["#earthday", "#zerowaste", "#sustainablebeauty"], platforms: ["instagram", "facebook"], scheduledDate: dateStr(-14), assignedTo: "u-3", planId: null, createdAt: d(15) },
      { id: "cp-15", clientId: "c-2", title: "Gym Etiquette 101", type: "image", status: "approved", script: null, caption: "The unwritten rules of the gym floor 😂 Which ones do you break?", hashtags: ["#gymetiquette", "#gymhumor", "#velocityfitness"], platforms: ["instagram"], scheduledDate: dateStr(-1), assignedTo: "u-4", planId: null, createdAt: d(4) },
      { id: "cp-16", clientId: "c-3", title: "Luna Lip Liner Tutorial", type: "reel", status: "filmed", script: "Step by step lip liner application using Luna Perfect Line", caption: null, hashtags: null, platforms: ["tiktok", "instagram"], scheduledDate: dateStr(-8), assignedTo: "u-4", planId: null, createdAt: d(9) },
      { id: "cp-17", clientId: "c-1", title: "Meet the Founder Video", type: "video", status: "idea", script: null, caption: null, hashtags: null, platforms: ["instagram", "youtube"], scheduledDate: null, assignedTo: null, planId: null, createdAt: d(0) },
    ];
    contentList.forEach(c => this.contentPieces.set(c.id, c));

    // ── Tasks ───────────────────────────────────────
    const taskList: Task[] = [
      { id: "t-1", title: "Finalize Bloom April content calendar", description: "Review and approve all scheduled posts for April", status: "in_progress", dueDate: dateStr(-2), assignedTo: "u-1", clientId: "c-1", createdAt: d(7) },
      { id: "t-2", title: "Edit Velocity 30-day challenge video", description: "Add captions, music, and brand overlay", status: "complete", dueDate: dateStr(2), assignedTo: "u-4", clientId: "c-2", createdAt: d(10) },
      { id: "t-3", title: "Write Luna Summer Drop captions", description: "Write captions for all 6 launch posts", status: "complete", dueDate: dateStr(5), assignedTo: "u-3", clientId: "c-3", createdAt: d(8) },
      { id: "t-4", title: "Onboard TechNova — collect brand assets", description: "Get logos, brand guidelines, and existing content from TechNova", status: "in_progress", dueDate: dateStr(-5), assignedTo: "u-1", clientId: "c-4", createdAt: d(12) },
      { id: "t-5", title: "Review and send monthly report to Bloom", description: "Compile analytics and send performance report", status: "todo", dueDate: dateStr(-3), assignedTo: "u-2", clientId: "c-1", createdAt: d(3) },
      { id: "t-6", title: "Schedule Luna influencer collaboration", description: "Coordinate with @makeupbykai for March GRWM post", status: "complete", dueDate: dateStr(10), assignedTo: "u-4", clientId: "c-3", createdAt: d(15) },
      { id: "t-7", title: "Prepare NovaFit proposal deck", description: "Create proposal for new lead Daniel Cho — NovaFit Supplements", status: "todo", dueDate: dateStr(-4), assignedTo: "u-1", clientId: null, createdAt: d(5) },
      { id: "t-8", title: "Update Velocity hashtag strategy", description: "Research trending fitness hashtags for Q2", status: "todo", dueDate: dateStr(-7), assignedTo: "u-3", clientId: "c-2", createdAt: d(4) },
      { id: "t-9", title: "Create TechNova LinkedIn content calendar", description: "Plan first month of LinkedIn posts for TechNova", status: "todo", dueDate: dateStr(-10), assignedTo: "u-3", clientId: "c-4", createdAt: d(10) },
      { id: "t-10", title: "Bloom Botanicals photoshoot coordination", description: "Coordinate product photoshoot for new line", status: "in_progress", dueDate: dateStr(-6), assignedTo: "u-4", clientId: "c-1", createdAt: d(6) },
    ];
    taskList.forEach(t => this.tasks.set(t.id, t));

    // ── Contracts ────────────────────────────────────
    const contractList: Contract[] = [
      { id: "ct-1", clientId: "c-1", serviceDescription: "Full Social Media Management — Instagram, Facebook. Content creation (12 posts/mo), community management, monthly reporting.", monthlyValue: 3200, startDate: dateStr(180), endDate: dateStr(-185), paymentTerms: "Net 14", gstHandling: "inclusive", status: "active", agencySignature: "Joshua Kerry", clientSignature: "Amanda Bloom", signedAt: dateStr(182), shareToken: null, createdAt: d(182) },
      { id: "ct-2", clientId: "c-2", serviceDescription: "Content Creation + Social Strategy — Instagram, TikTok, YouTube Shorts. 16 posts/mo, Reels production, analytics dashboard.", monthlyValue: 4500, startDate: dateStr(150), endDate: dateStr(-215), paymentTerms: "Net 14", gstHandling: "inclusive", status: "active", agencySignature: "Joshua Kerry", clientSignature: "Ryan Velocity", signedAt: dateStr(152), shareToken: null, createdAt: d(152) },
      { id: "ct-3", clientId: "c-3", serviceDescription: "Premium Social Package — Instagram, TikTok. Content creation (20 posts/mo), influencer coordination, UGC management, paid ads strategy.", monthlyValue: 5800, startDate: dateStr(90), endDate: dateStr(-275), paymentTerms: "Net 7", gstHandling: "exclusive", status: "active", agencySignature: "Joshua Kerry", clientSignature: "Mia Luna", signedAt: dateStr(91), shareToken: null, createdAt: d(91) },
      { id: "ct-4", clientId: "c-4", serviceDescription: "B2B Content Strategy — LinkedIn thought leadership, 8 posts/mo, blog ghostwriting, social listening.", monthlyValue: 2800, startDate: dateStr(14), endDate: dateStr(-351), paymentTerms: "Net 30", gstHandling: "inclusive", status: "sent", agencySignature: "Joshua Kerry", clientSignature: null, signedAt: null, shareToken: "share-ct4-abc", createdAt: d(16) },
    ];
    contractList.forEach(c => this.contracts.set(c.id, c));

    // ── Content Plans ───────────────────────────────
    const planList: ContentPlan[] = [
      {
        id: "pl-1", clientId: "c-1", title: "Bloom Botanicals — April Content Plan",
        description: "Spring-focused content strategy emphasizing seasonal skincare transitions and Earth Day.",
        ideas: [
          { title: "Spring Skincare Transition Guide", type: "carousel", concept: "5-step guide for adjusting routine as weather warms", platform: "instagram" },
          { title: "Earth Day Zero Waste Series", type: "carousel", concept: "Plastic-free beauty routine swaps", platform: "instagram" },
          { title: "Meet the Founder", type: "video", concept: "Authentic founder story video for brand connection", platform: "instagram" },
          { title: "Customer Spotlight Series", type: "ugc", concept: "Feature real customers sharing their routines", platform: "instagram" },
          { title: "New Product Teaser", type: "reel", concept: "Slow-reveal teaser for upcoming June product line", platform: "instagram" },
        ],
        status: "approved", createdAt: d(20),
      },
      {
        id: "pl-2", clientId: "c-3", title: "Luna Beauty — Summer Launch Campaign",
        description: "Full campaign plan for Summer Glow collection launch including influencer activations.",
        ideas: [
          { title: "Countdown Teasers", type: "story", concept: "5-day countdown with product silhouettes", platform: "instagram" },
          { title: "GRWM with Influencer", type: "ugc", concept: "Partner with 3 micro-influencers for GRWM content", platform: "tiktok" },
          { title: "Shade Swatch Carousel", type: "carousel", concept: "All shades on diverse skin tones", platform: "instagram" },
          { title: "Behind the Formulation", type: "reel", concept: "Lab footage showing product development", platform: "tiktok" },
          { title: "User Reviews Compilation", type: "video", concept: "Compile early access reviewer clips", platform: "instagram" },
          { title: "Launch Day Live", type: "video", concept: "Instagram Live for launch with Q&A and giveaway", platform: "instagram" },
        ],
        status: "draft", createdAt: d(5),
      },
    ];
    planList.forEach(p => this.contentPlans.set(p.id, p));

    // ── Revenue Goals ───────────────────────────────
    const goalList: RevenueGoal[] = [
      { id: "rg-1", type: "monthly", target: 20000, period: "2026-03", createdAt: d(30) },
      { id: "rg-2", type: "quarterly", target: 65000, period: "2026-Q1", createdAt: d(90) },
      { id: "rg-3", type: "yearly", target: 280000, period: "2026", createdAt: d(120) },
    ];
    goalList.forEach(g => this.revenueGoals.set(g.id, g));

    // ── Activity Log ────────────────────────────────
    const logEntries: ActivityLog[] = [
      { id: "al-1", action: "client_created", description: "TechNova Solutions added as new client", userId: "u-1", resourceType: "client", resourceId: "c-4", createdAt: d(14) },
      { id: "al-2", action: "content_published", description: "Luna Summer Drop Announcement went live on Instagram & TikTok", userId: "u-1", resourceType: "content", resourceId: "cp-7", createdAt: d(0) },
      { id: "al-3", action: "content_published", description: "Velocity 30-Day Challenge Kickoff published", userId: "u-2", resourceType: "content", resourceId: "cp-4", createdAt: d(1) },
      { id: "al-4", action: "task_completed", description: "Completed: Edit Velocity 30-day challenge video", userId: "u-4", resourceType: "task", resourceId: "t-2", createdAt: d(2) },
      { id: "al-5", action: "task_completed", description: "Completed: Write Luna Summer Drop captions", userId: "u-3", resourceType: "task", resourceId: "t-3", createdAt: d(3) },
      { id: "al-6", action: "lead_created", description: "New lead: Chris Nguyen from CloudNine Tech", userId: "u-1", resourceType: "lead", resourceId: "l-10", createdAt: d(1) },
      { id: "al-7", action: "lead_created", description: "New lead: Rachel Park from Green Thread Fashion", userId: "u-1", resourceType: "lead", resourceId: "l-1", createdAt: d(2) },
      { id: "al-8", action: "contract_sent", description: "Contract sent to TechNova Solutions for review", userId: "u-1", resourceType: "contract", resourceId: "ct-4", createdAt: d(14) },
      { id: "al-9", action: "content_approved", description: "Behind the Scenes carousel approved for Bloom Botanicals", userId: "u-1", resourceType: "content", resourceId: "cp-2", createdAt: d(4) },
      { id: "al-10", action: "lead_stage_changed", description: "Liam Foster (Ridgeline Construction) moved to Won", userId: "u-1", resourceType: "lead", resourceId: "l-8", createdAt: d(7) },
      { id: "al-11", action: "plan_approved", description: "Bloom Botanicals April Content Plan approved", userId: "u-1", resourceType: "plan", resourceId: "pl-1", createdAt: d(18) },
      { id: "al-12", action: "team_member_added", description: "Lena Voss joined the team as Editor", userId: "u-1", resourceType: "user", resourceId: "u-4", createdAt: d(45) },
      { id: "al-13", action: "task_completed", description: "Completed: Schedule Luna influencer collaboration", userId: "u-4", resourceType: "task", resourceId: "t-6", createdAt: d(5) },
      { id: "al-14", action: "content_published", description: "Spring Skincare Routine Reel went live for Bloom", userId: "u-4", resourceType: "content", resourceId: "cp-1", createdAt: d(3) },
      { id: "al-15", action: "client_paused", description: "Coastal Living Realty account paused", userId: "u-1", resourceType: "client", resourceId: "c-5", createdAt: d(10) },
    ];
    logEntries.forEach(e => this.activityLogEntries.set(e.id, e));

    // ── Team Invites ────────────────────────────────
    const inviteList: TeamInvite[] = [
      { id: "ti-1", email: "alex.rivera@gmail.com", role: "contractor", status: "pending", invitedBy: "u-1", createdAt: d(3) },
      { id: "ti-2", email: "nina.patel@outlook.com", role: "strategist", status: "pending", invitedBy: "u-1", createdAt: d(5) },
    ];
    inviteList.forEach(i => this.teamInvites.set(i.id, i));

    // ── Social Analytics (30 days for 3 clients × 3 platforms) ──
    const analyticsClients = ["c-1", "c-2", "c-3"];
    const platforms = ["instagram", "tiktok", "facebook"];
    const baseFollowers: Record<string, Record<string, number>> = {
      "c-1": { instagram: 14200, tiktok: 3800, facebook: 8500 },
      "c-2": { instagram: 22400, tiktok: 15600, facebook: 11200 },
      "c-3": { instagram: 31000, tiktok: 28500, facebook: 6200 },
    };

    for (const cId of analyticsClients) {
      for (const plat of platforms) {
        const base = baseFollowers[cId][plat];
        for (let day = 29; day >= 0; day--) {
          const dateVal = dateStr(day);
          const growth = Math.floor(Math.random() * 40) + 5;
          const followers = base + (30 - day) * growth;
          const impressions = Math.floor(followers * (1.5 + Math.random() * 3));
          const reach = Math.floor(impressions * (0.4 + Math.random() * 0.3));
          const engagementRate = parseFloat((2 + Math.random() * 6).toFixed(2));
          const likes = Math.floor(reach * (engagementRate / 100) * 0.7);
          const comments = Math.floor(likes * (0.05 + Math.random() * 0.1));
          const shares = Math.floor(likes * (0.02 + Math.random() * 0.05));
          const id = `sa-${cId}-${plat}-${day}`;
          this.socialAnalyticsEntries.set(id, {
            id, clientId: cId, platform: plat, date: dateVal,
            followers, impressions, engagementRate, reach, likes, comments, shares,
          });
        }
      }
    }
  }
}

// Use database storage if DATABASE_URL is set, otherwise fall back to in-memory
function createStorage(): IStorage {
  if (process.env.DATABASE_URL) {
    console.log("[storage] Using Supabase Postgres (DATABASE_URL detected)");
    const { DatabaseStorage } = require("./db-storage");
    return new DatabaseStorage();
  }
  console.log("[storage] Using in-memory storage (no DATABASE_URL)");
  return new MemStorage();
}

export const storage = createStorage();
