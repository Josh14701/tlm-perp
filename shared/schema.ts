import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Users ──────────────────────────────────────────
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  avatar: text("avatar"),
  role: text("role").notNull().default("strategist"), // owner, admin, strategist, contractor, editor
  agencyId: varchar("agency_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ── Agency Settings ────────────────────────────────
export const agencySettings = pgTable("agency_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyName: text("agency_name").notNull().default("ThirdLink Marketing"),
  logo: text("logo"),
  brandColors: jsonb("brand_colors").$type<{ primary: string; secondary: string; accent: string }>(),
  timezone: text("timezone").default("Australia/Sydney"),
  workingHours: text("working_hours").default("9:00-17:00"),
  aiVoice: text("ai_voice").default("professional"),
  aiTone: text("ai_tone").default("friendly and strategic"),
  customPromptTemplates: jsonb("custom_prompt_templates").$type<Record<string, string>>(),
  emailTemplates: jsonb("email_templates").$type<Record<string, { subject: string; body: string }>>(),
  notificationPrefs: jsonb("notification_prefs").$type<Record<string, boolean>>(),
  appearance: text("appearance").default("system"), // light, dark, system
});

export const insertAgencySettingsSchema = createInsertSchema(agencySettings).omit({ id: true });
export type InsertAgencySettings = z.infer<typeof insertAgencySettingsSchema>;
export type AgencySettings = typeof agencySettings.$inferSelect;

// ── Clients ────────────────────────────────────────
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessName: text("business_name").notNull(),
  industry: text("industry"),
  website: text("website"),
  mrr: real("mrr").default(0),
  status: text("status").notNull().default("onboarding"), // active, onboarding, paused, churned
  contractStart: text("contract_start"),
  contractEnd: text("contract_end"),
  notes: text("notes"),
  assignedTeam: text("assigned_team").array(),
  brandLogo: text("brand_logo"), // base64 data URI
  brandColors: jsonb("brand_colors").$type<string[]>(), // extracted hex colors
  brandTypography: jsonb("brand_typography").$type<string[]>(), // detected font families
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// ── Client Knowledge Base ──────────────────────────
export const knowledgeBase = pgTable("knowledge_base", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  category: text("category").notNull(), // brand, audience, competitors, offers, past_results, notes, compliance
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase).omit({ id: true, createdAt: true });
export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;
export type KnowledgeBase = typeof knowledgeBase.$inferSelect;

// ── Leads (Sales Pipeline) ─────────────────────────
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contactName: text("contact_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  proposalValue: real("proposal_value").default(0),
  notes: text("notes"),
  stage: text("stage").notNull().default("new"), // new, contacted, proposal, negotiating, won, lost
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// ── Content Pieces ─────────────────────────────────
export const contentPieces = pgTable("content_pieces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(), // video, image, carousel, story, reel, ugc, text_post
  status: text("status").notNull().default("idea"), // idea, scripted, filmed, edited, approved, live
  script: text("script"),
  caption: text("caption"),
  hashtags: text("hashtags").array(),
  platforms: text("platforms").array(), // instagram, tiktok, linkedin, facebook, youtube, twitter
  scheduledDate: text("scheduled_date"),
  assignedTo: varchar("assigned_to"),
  planId: varchar("plan_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContentPieceSchema = createInsertSchema(contentPieces).omit({ id: true, createdAt: true });
export type InsertContentPiece = z.infer<typeof insertContentPieceSchema>;
export type ContentPiece = typeof contentPieces.$inferSelect;

// ── Content Plans ──────────────────────────────────
export const contentPlans = pgTable("content_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  ideas: jsonb("ideas").$type<Array<{ title: string; type: string; concept: string; platform: string }>>(),
  status: text("status").notNull().default("draft"), // draft, approved, archived
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContentPlanSchema = createInsertSchema(contentPlans).omit({ id: true, createdAt: true });
export type InsertContentPlan = z.infer<typeof insertContentPlanSchema>;
export type ContentPlan = typeof contentPlans.$inferSelect;

// ── AI Sessions ────────────────────────────────────
export const aiSessions = pgTable("ai_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  title: text("title").notNull(),
  messages: jsonb("messages").$type<Array<{ role: string; content: string }>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAiSessionSchema = createInsertSchema(aiSessions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAiSession = z.infer<typeof insertAiSessionSchema>;
export type AiSession = typeof aiSessions.$inferSelect;

// ── Tasks ──────────────────────────────────────────
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"), // todo, in_progress, complete
  dueDate: text("due_date"),
  assignedTo: varchar("assigned_to"),
  clientId: varchar("client_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// ── Contracts ──────────────────────────────────────
export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  serviceDescription: text("service_description").notNull(),
  monthlyValue: real("monthly_value").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  paymentTerms: text("payment_terms"),
  gstHandling: text("gst_handling").default("inclusive"),
  status: text("status").notNull().default("draft"), // draft, sent, signed, active, expired, cancelled
  agencySignature: text("agency_signature"),
  clientSignature: text("client_signature"),
  signedAt: text("signed_at"),
  shareToken: text("share_token"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContractSchema = createInsertSchema(contracts).omit({ id: true, createdAt: true });
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

// ── Share Links ────────────────────────────────────
export const shareLinks = pgTable("share_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // analytics, calendar, contract, plan
  resourceId: varchar("resource_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: text("expires_at"),
  clientId: varchar("client_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertShareLinkSchema = createInsertSchema(shareLinks).omit({ id: true, createdAt: true });
export type InsertShareLink = z.infer<typeof insertShareLinkSchema>;
export type ShareLink = typeof shareLinks.$inferSelect;

// ── Generated Images ───────────────────────────────
export const generatedImages = pgTable("generated_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prompt: text("prompt").notNull(),
  model: text("model").notNull().default("nano_banana_2"),
  imageData: text("image_data").notNull(), // base64
  styleNotes: text("style_notes"),
  clientId: varchar("client_id"),
  status: text("status").default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGeneratedImageSchema = createInsertSchema(generatedImages).omit({ id: true, createdAt: true });
export type InsertGeneratedImage = z.infer<typeof insertGeneratedImageSchema>;
export type GeneratedImage = typeof generatedImages.$inferSelect;

// ── Social Analytics ───────────────────────────────
export const socialAnalytics = pgTable("social_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  platform: text("platform").notNull(),
  date: text("date").notNull(),
  followers: integer("followers").default(0),
  impressions: integer("impressions").default(0),
  engagementRate: real("engagement_rate").default(0),
  reach: integer("reach").default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
});

export const insertSocialAnalyticsSchema = createInsertSchema(socialAnalytics).omit({ id: true });
export type InsertSocialAnalytics = z.infer<typeof insertSocialAnalyticsSchema>;
export type SocialAnalytics = typeof socialAnalytics.$inferSelect;

// ── Activity Log ───────────────────────────────────
export const activityLog = pgTable("activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: text("action").notNull(),
  description: text("description").notNull(),
  userId: varchar("user_id"),
  resourceType: text("resource_type"),
  resourceId: varchar("resource_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({ id: true, createdAt: true });
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;

// ── Team Invites ───────────────────────────────────
export const teamInvites = pgTable("team_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  role: text("role").notNull().default("strategist"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  invitedBy: varchar("invited_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTeamInviteSchema = createInsertSchema(teamInvites).omit({ id: true, createdAt: true });
export type InsertTeamInvite = z.infer<typeof insertTeamInviteSchema>;
export type TeamInvite = typeof teamInvites.$inferSelect;

// ── Revenue Goals ──────────────────────────────────
export const revenueGoals = pgTable("revenue_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // monthly, quarterly, yearly
  target: real("target").notNull(),
  period: text("period").notNull(), // e.g., "2026-03", "2026-Q1", "2026"
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRevenueGoalSchema = createInsertSchema(revenueGoals).omit({ id: true, createdAt: true });
export type InsertRevenueGoal = z.infer<typeof insertRevenueGoalSchema>;
export type RevenueGoal = typeof revenueGoals.$inferSelect;
