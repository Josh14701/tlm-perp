import { eq, desc, and, sql as drizzleSql } from "drizzle-orm";
import { db } from "./db";
import {
  users, clients, agencySettings, knowledgeBase, leads, contentPieces,
  contentPlans, aiSessions, tasks, contracts, shareLinks, generatedImages,
  socialAnalytics, activityLog, teamInvites, revenueGoals,
} from "@shared/schema";
import type {
  User, InsertUser, AgencySettings, InsertAgencySettings,
  Client, InsertClient, KnowledgeBase, InsertKnowledgeBase,
  Lead, InsertLead, ContentPiece, InsertContentPiece,
  ContentPlan, InsertContentPlan, AiSession, InsertAiSession,
  Task, InsertTask, Contract, InsertContract,
  ShareLink, InsertShareLink, GeneratedImage, InsertGeneratedImage,
  SocialAnalytics, InsertSocialAnalytics, ActivityLog, InsertActivityLog,
  TeamInvite, InsertTeamInvite, RevenueGoal, InsertRevenueGoal,
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {

  // ── Users ─────────────────────────────────────────
  async getUser(id: string): Promise<User | undefined> {
    const [row] = await db.select().from(users).where(eq(users.id, id));
    return row;
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [row] = await db.select().from(users).where(eq(users.username, username));
    return row;
  }
  async listUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  async createUser(data: InsertUser): Promise<User> {
    const [row] = await db.insert(users).values(data).returning();
    return row;
  }
  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [row] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return row;
  }
  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // ── Agency Settings ───────────────────────────────
  async getAgencySettings(): Promise<AgencySettings | undefined> {
    const [row] = await db.select().from(agencySettings).limit(1);
    return row;
  }
  async updateAgencySettings(data: Partial<InsertAgencySettings>): Promise<AgencySettings | undefined> {
    const existing = await this.getAgencySettings();
    if (existing) {
      const [row] = await db.update(agencySettings).set(data).where(eq(agencySettings.id, existing.id)).returning();
      return row;
    }
    const [row] = await db.insert(agencySettings).values(data as InsertAgencySettings).returning();
    return row;
  }

  // ── Clients ───────────────────────────────────────
  async listClients(): Promise<Client[]> {
    return db.select().from(clients);
  }
  async getClient(id: string): Promise<Client | undefined> {
    const [row] = await db.select().from(clients).where(eq(clients.id, id));
    return row;
  }
  async createClient(data: InsertClient): Promise<Client> {
    const [row] = await db.insert(clients).values(data).returning();
    return row;
  }
  async updateClient(id: string, data: Partial<InsertClient>): Promise<Client | undefined> {
    const [row] = await db.update(clients).set(data).where(eq(clients.id, id)).returning();
    return row;
  }
  async deleteClient(id: string): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id)).returning();
    return result.length > 0;
  }

  // ── Knowledge Base ────────────────────────────────
  async listKnowledgeBase(clientId?: string): Promise<KnowledgeBase[]> {
    if (clientId) {
      return db.select().from(knowledgeBase).where(eq(knowledgeBase.clientId, clientId));
    }
    return db.select().from(knowledgeBase);
  }
  async getKnowledgeBaseEntry(id: string): Promise<KnowledgeBase | undefined> {
    const [row] = await db.select().from(knowledgeBase).where(eq(knowledgeBase.id, id));
    return row;
  }
  async createKnowledgeBaseEntry(data: InsertKnowledgeBase): Promise<KnowledgeBase> {
    const [row] = await db.insert(knowledgeBase).values(data).returning();
    return row;
  }
  async updateKnowledgeBaseEntry(id: string, data: Partial<InsertKnowledgeBase>): Promise<KnowledgeBase | undefined> {
    const [row] = await db.update(knowledgeBase).set(data).where(eq(knowledgeBase.id, id)).returning();
    return row;
  }
  async deleteKnowledgeBaseEntry(id: string): Promise<boolean> {
    const result = await db.delete(knowledgeBase).where(eq(knowledgeBase.id, id)).returning();
    return result.length > 0;
  }

  // ── Leads ─────────────────────────────────────────
  async listLeads(): Promise<Lead[]> {
    return db.select().from(leads);
  }
  async getLead(id: string): Promise<Lead | undefined> {
    const [row] = await db.select().from(leads).where(eq(leads.id, id));
    return row;
  }
  async createLead(data: InsertLead): Promise<Lead> {
    const [row] = await db.insert(leads).values(data).returning();
    return row;
  }
  async updateLead(id: string, data: Partial<InsertLead>): Promise<Lead | undefined> {
    const [row] = await db.update(leads).set(data).where(eq(leads.id, id)).returning();
    return row;
  }
  async deleteLead(id: string): Promise<boolean> {
    const result = await db.delete(leads).where(eq(leads.id, id)).returning();
    return result.length > 0;
  }

  // ── Content Pieces ────────────────────────────────
  async listContentPieces(clientId?: string): Promise<ContentPiece[]> {
    if (clientId) {
      return db.select().from(contentPieces).where(eq(contentPieces.clientId, clientId));
    }
    return db.select().from(contentPieces);
  }
  async getContentPiece(id: string): Promise<ContentPiece | undefined> {
    const [row] = await db.select().from(contentPieces).where(eq(contentPieces.id, id));
    return row;
  }
  async createContentPiece(data: InsertContentPiece): Promise<ContentPiece> {
    const [row] = await db.insert(contentPieces).values(data).returning();
    return row;
  }
  async updateContentPiece(id: string, data: Partial<InsertContentPiece>): Promise<ContentPiece | undefined> {
    const [row] = await db.update(contentPieces).set(data).where(eq(contentPieces.id, id)).returning();
    return row;
  }
  async deleteContentPiece(id: string): Promise<boolean> {
    const result = await db.delete(contentPieces).where(eq(contentPieces.id, id)).returning();
    return result.length > 0;
  }

  // ── Content Plans ─────────────────────────────────
  async listContentPlans(clientId?: string): Promise<ContentPlan[]> {
    if (clientId) {
      return db.select().from(contentPlans).where(eq(contentPlans.clientId, clientId));
    }
    return db.select().from(contentPlans);
  }
  async getContentPlan(id: string): Promise<ContentPlan | undefined> {
    const [row] = await db.select().from(contentPlans).where(eq(contentPlans.id, id));
    return row;
  }
  async createContentPlan(data: InsertContentPlan): Promise<ContentPlan> {
    const [row] = await db.insert(contentPlans).values(data).returning();
    return row;
  }
  async updateContentPlan(id: string, data: Partial<InsertContentPlan>): Promise<ContentPlan | undefined> {
    const [row] = await db.update(contentPlans).set(data).where(eq(contentPlans.id, id)).returning();
    return row;
  }
  async deleteContentPlan(id: string): Promise<boolean> {
    const result = await db.delete(contentPlans).where(eq(contentPlans.id, id)).returning();
    return result.length > 0;
  }

  // ── AI Sessions ───────────────────────────────────
  async listAiSessions(clientId?: string): Promise<AiSession[]> {
    if (clientId) {
      return db.select().from(aiSessions).where(eq(aiSessions.clientId, clientId));
    }
    return db.select().from(aiSessions);
  }
  async getAiSession(id: string): Promise<AiSession | undefined> {
    const [row] = await db.select().from(aiSessions).where(eq(aiSessions.id, id));
    return row;
  }
  async createAiSession(data: InsertAiSession): Promise<AiSession> {
    const [row] = await db.insert(aiSessions).values(data).returning();
    return row;
  }
  async updateAiSession(id: string, data: Partial<InsertAiSession>): Promise<AiSession | undefined> {
    const [row] = await db.update(aiSessions).set(data).where(eq(aiSessions.id, id)).returning();
    return row;
  }

  // ── Tasks ─────────────────────────────────────────
  async listTasks(clientId?: string): Promise<Task[]> {
    if (clientId) {
      return db.select().from(tasks).where(eq(tasks.clientId, clientId));
    }
    return db.select().from(tasks);
  }
  async getTask(id: string): Promise<Task | undefined> {
    const [row] = await db.select().from(tasks).where(eq(tasks.id, id));
    return row;
  }
  async createTask(data: InsertTask): Promise<Task> {
    const [row] = await db.insert(tasks).values(data).returning();
    return row;
  }
  async updateTask(id: string, data: Partial<InsertTask>): Promise<Task | undefined> {
    const [row] = await db.update(tasks).set(data).where(eq(tasks.id, id)).returning();
    return row;
  }
  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }

  // ── Contracts ─────────────────────────────────────
  async listContracts(clientId?: string): Promise<Contract[]> {
    if (clientId) {
      return db.select().from(contracts).where(eq(contracts.clientId, clientId));
    }
    return db.select().from(contracts);
  }
  async getContract(id: string): Promise<Contract | undefined> {
    const [row] = await db.select().from(contracts).where(eq(contracts.id, id));
    return row;
  }
  async createContract(data: InsertContract): Promise<Contract> {
    const [row] = await db.insert(contracts).values(data).returning();
    return row;
  }
  async updateContract(id: string, data: Partial<InsertContract>): Promise<Contract | undefined> {
    const [row] = await db.update(contracts).set(data).where(eq(contracts.id, id)).returning();
    return row;
  }
  async deleteContract(id: string): Promise<boolean> {
    const result = await db.delete(contracts).where(eq(contracts.id, id)).returning();
    return result.length > 0;
  }

  // ── Share Links ───────────────────────────────────
  async listShareLinks(): Promise<ShareLink[]> {
    return db.select().from(shareLinks);
  }
  async getShareLinkByToken(token: string): Promise<ShareLink | undefined> {
    const [row] = await db.select().from(shareLinks).where(eq(shareLinks.token, token));
    return row;
  }
  async createShareLink(data: InsertShareLink): Promise<ShareLink> {
    const [row] = await db.insert(shareLinks).values(data).returning();
    return row;
  }
  async deleteShareLink(id: string): Promise<boolean> {
    const result = await db.delete(shareLinks).where(eq(shareLinks.id, id)).returning();
    return result.length > 0;
  }

  // ── Generated Images ──────────────────────────────
  async listGeneratedImages(clientId?: string): Promise<GeneratedImage[]> {
    if (clientId) {
      return db.select().from(generatedImages).where(eq(generatedImages.clientId, clientId));
    }
    return db.select().from(generatedImages);
  }
  async getGeneratedImage(id: string): Promise<GeneratedImage | undefined> {
    const [row] = await db.select().from(generatedImages).where(eq(generatedImages.id, id));
    return row;
  }
  async createGeneratedImage(data: InsertGeneratedImage): Promise<GeneratedImage> {
    const [row] = await db.insert(generatedImages).values(data).returning();
    return row;
  }
  async updateGeneratedImage(id: string, data: Partial<InsertGeneratedImage>): Promise<GeneratedImage | undefined> {
    const [row] = await db.update(generatedImages).set(data).where(eq(generatedImages.id, id)).returning();
    return row;
  }
  async deleteGeneratedImage(id: string): Promise<boolean> {
    const result = await db.delete(generatedImages).where(eq(generatedImages.id, id)).returning();
    return result.length > 0;
  }

  // ── Social Analytics ──────────────────────────────
  async listSocialAnalytics(clientId: string, platform?: string): Promise<SocialAnalytics[]> {
    if (platform) {
      return db.select().from(socialAnalytics).where(
        and(eq(socialAnalytics.clientId, clientId), eq(socialAnalytics.platform, platform))
      );
    }
    return db.select().from(socialAnalytics).where(eq(socialAnalytics.clientId, clientId));
  }
  async createSocialAnalytics(data: InsertSocialAnalytics): Promise<SocialAnalytics> {
    const [row] = await db.insert(socialAnalytics).values(data).returning();
    return row;
  }

  // ── Activity Log ──────────────────────────────────
  async listActivityLog(limit?: number): Promise<ActivityLog[]> {
    const q = db.select().from(activityLog).orderBy(desc(activityLog.createdAt));
    if (limit) {
      return q.limit(limit);
    }
    return q;
  }
  async createActivityLog(data: InsertActivityLog): Promise<ActivityLog> {
    const [row] = await db.insert(activityLog).values(data).returning();
    return row;
  }

  // ── Team Invites ──────────────────────────────────
  async listTeamInvites(): Promise<TeamInvite[]> {
    return db.select().from(teamInvites);
  }
  async getTeamInvite(id: string): Promise<TeamInvite | undefined> {
    const [row] = await db.select().from(teamInvites).where(eq(teamInvites.id, id));
    return row;
  }
  async createTeamInvite(data: InsertTeamInvite): Promise<TeamInvite> {
    const [row] = await db.insert(teamInvites).values(data).returning();
    return row;
  }
  async updateTeamInvite(id: string, data: Partial<InsertTeamInvite>): Promise<TeamInvite | undefined> {
    const [row] = await db.update(teamInvites).set(data).where(eq(teamInvites.id, id)).returning();
    return row;
  }
  async deleteTeamInvite(id: string): Promise<boolean> {
    const result = await db.delete(teamInvites).where(eq(teamInvites.id, id)).returning();
    return result.length > 0;
  }

  // ── Revenue Goals ─────────────────────────────────
  async listRevenueGoals(): Promise<RevenueGoal[]> {
    return db.select().from(revenueGoals);
  }
  async getRevenueGoal(id: string): Promise<RevenueGoal | undefined> {
    const [row] = await db.select().from(revenueGoals).where(eq(revenueGoals.id, id));
    return row;
  }
  async createRevenueGoal(data: InsertRevenueGoal): Promise<RevenueGoal> {
    const [row] = await db.insert(revenueGoals).values(data).returning();
    return row;
  }
  async updateRevenueGoal(id: string, data: Partial<InsertRevenueGoal>): Promise<RevenueGoal | undefined> {
    const [row] = await db.update(revenueGoals).set(data).where(eq(revenueGoals.id, id)).returning();
    return row;
  }
  async deleteRevenueGoal(id: string): Promise<boolean> {
    const result = await db.delete(revenueGoals).where(eq(revenueGoals.id, id)).returning();
    return result.length > 0;
  }
}
