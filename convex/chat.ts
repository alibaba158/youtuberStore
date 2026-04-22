import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const MAX_MESSAGE_LENGTH = 500;
const MAX_MESSAGES_PER_TICKET = 200;

function parseAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function normalizeMessage(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) throw new Error("Message is required");
  if (normalized.length > MAX_MESSAGE_LENGTH) throw new Error("Message is too long");
  return normalized;
}

async function getViewer(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;

  const authUser = await ctx.db.get(userId);
  if (!authUser) return null;

  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();

  const role =
    profile?.role ??
    (parseAdminEmails().has((authUser.email ?? "").toLowerCase()) ? "admin" : "user");

  return {
    userId,
    role,
    name: authUser.name ?? authUser.email ?? "לקוח",
    email: authUser.email,
  };
}

async function requireViewer(ctx: any) {
  const viewer = await getViewer(ctx);
  if (!viewer) throw new Error("Authentication required");
  return viewer;
}

async function requireAdmin(ctx: any) {
  const viewer = await requireViewer(ctx);
  if (viewer.role !== "admin") throw new Error("Admin access required");
  return viewer;
}

async function getOrCreateOpenTicket(ctx: any, viewer: Awaited<ReturnType<typeof requireViewer>>) {
  const existing = await ctx.db
    .query("supportTickets")
    .withIndex("by_userId_status", (q: any) => q.eq("userId", viewer.userId).eq("status", "open"))
    .first();

  if (existing) return existing;

  const now = Date.now();
  const ticketId = await ctx.db.insert("supportTickets", {
    userId: viewer.userId,
    customerName: viewer.name,
    customerEmail: viewer.email,
    status: "open",
    lastMessageAt: now,
    createdAt: now,
    updatedAt: now,
  });

  return ctx.db.get(ticketId);
}

async function pruneTicketMessages(ctx: any, ticketId: any) {
  const oldestMessages = await ctx.db
    .query("supportMessages")
    .withIndex("by_ticketId_createdAt", (q: any) => q.eq("ticketId", ticketId))
    .order("asc")
    .take(MAX_MESSAGES_PER_TICKET + 100);

  if (oldestMessages.length <= MAX_MESSAGES_PER_TICKET) return;

  const deleteCount = oldestMessages.length - MAX_MESSAGES_PER_TICKET;
  for (const message of oldestMessages.slice(0, deleteCount)) {
    await ctx.db.delete(message._id);
  }
}

export const myTicket = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return null;

    return ctx.db
      .query("supportTickets")
      .withIndex("by_userId_status", (q) => q.eq("userId", viewer.userId).eq("status", "open"))
      .first();
  },
});

export const messages = query({
  args: { ticketId: v.optional(v.id("supportTickets")) },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const ticket = args.ticketId
      ? await ctx.db.get(args.ticketId)
      : await ctx.db
          .query("supportTickets")
          .withIndex("by_userId_status", (q) =>
            q.eq("userId", viewer.userId).eq("status", "open"),
          )
          .first();

    if (!ticket) return [];
    if (viewer.role !== "admin" && ticket.userId !== viewer.userId) {
      throw new Error("Ticket access denied");
    }

    return ctx.db
      .query("supportMessages")
      .withIndex("by_ticketId_createdAt", (q) => q.eq("ticketId", ticket._id))
      .order("asc")
      .take(MAX_MESSAGES_PER_TICKET);
  },
});

export const send = mutation({
  args: {
    body: v.string(),
    ticketId: v.optional(v.id("supportTickets")),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const ticket = args.ticketId
      ? await ctx.db.get(args.ticketId)
      : await getOrCreateOpenTicket(ctx, viewer);

    if (!ticket) throw new Error("Ticket not found");
    if (viewer.role !== "admin" && ticket.userId !== viewer.userId) {
      throw new Error("Ticket access denied");
    }
    if (ticket.status === "closed") {
      throw new Error("Ticket is closed");
    }

    const body = normalizeMessage(args.body);
    const now = Date.now();

    await ctx.db.insert("supportMessages", {
      ticketId: ticket._id,
      senderId: viewer.userId,
      senderName: viewer.name,
      senderRole: viewer.role === "admin" ? "admin" : "customer",
      body,
      createdAt: now,
    });

    await ctx.db.patch(ticket._id, {
      assignedAdminId:
        viewer.role === "admin" ? viewer.userId : ticket.assignedAdminId,
      status: ticket.status === "pending" && viewer.role !== "admin" ? "open" : ticket.status,
      lastMessagePreview: body.slice(0, 120),
      lastMessageAt: now,
      updatedAt: now,
    });

    await pruneTicketMessages(ctx, ticket._id);
  },
});

export const adminTickets = query({
  args: { status: v.optional(v.union(v.literal("open"), v.literal("pending"), v.literal("closed"))) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const status = args.status ?? "open";
    const tickets = await ctx.db
      .query("supportTickets")
      .withIndex("by_status_lastMessageAt", (q) => q.eq("status", status))
      .order("desc")
      .take(100);

    return Promise.all(
      tickets.map(async (ticket) => {
        const assignedAdmin = ticket.assignedAdminId
          ? await ctx.db.get(ticket.assignedAdminId)
          : null;
        return {
          ...ticket,
          assignedAdminName: assignedAdmin?.name ?? assignedAdmin?.email,
        };
      }),
    );
  },
});

export const assignTicket = mutation({
  args: { ticketId: v.id("supportTickets") },
  handler: async (ctx, args) => {
    const viewer = await requireAdmin(ctx);
    await ctx.db.patch(args.ticketId, {
      assignedAdminId: viewer.userId,
      updatedAt: Date.now(),
    });
  },
});

export const updateTicketStatus = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    status: v.union(v.literal("open"), v.literal("pending"), v.literal("closed")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.ticketId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});
