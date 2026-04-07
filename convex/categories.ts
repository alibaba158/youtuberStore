import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query(async (ctx) => {
  return await ctx.db.query("categories").order("sortOrder").collect();
});

export const bySlug = query({
  args: { slug: v.string() },
  async handler(ctx, args) {
    const result = await ctx.db
      .query("categories")
      .filter((q) => q.eq(q.field("slug"), args.slug))
      .first();
    return result;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    sortOrder: v.number(),
  },
  async handler(ctx, args) {
    return await ctx.db.insert("categories", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    sortOrder: v.number(),
  },
  async handler(ctx, args) {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
    return { success: true };
  },
});

export const remove = mutation({
  args: { id: v.id("categories") },
  async handler(ctx, args) {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
