import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  normalizeCartQuantity,
  normalizeDisplayName,
  normalizeOptionalText,
  normalizePrice,
  normalizeSafeImageUrl,
  normalizeSlug,
  normalizeSortOrder,
  normalizeStock,
  normalizeTheme,
} from "./security";

const categoryInput = {
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  sortOrder: v.number(),
};

const productInput = {
  name: v.string(),
  description: v.optional(v.string()),
  price: v.string(),
  imageUrl: v.optional(v.string()),
  categoryId: v.optional(v.id("categories")),
  stock: v.number(),
  isActive: v.boolean(),
  isFeatured: v.boolean(),
};

function parseAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function getViewer(ctx: Parameters<typeof query>[0] extends never ? never : any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return null;
  }

  const authUser = await ctx.db.get(userId);
  if (!authUser) {
    return null;
  }

  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();

  const adminEmails = parseAdminEmails();
  const fallbackRole = adminEmails.has((authUser.email ?? "").toLowerCase())
    ? "admin"
    : "user";

  return {
    authUser,
    profile,
    user: {
      _id: authUser._id,
      email: authUser.email ?? "",
      name: authUser.name ?? authUser.email ?? "User",
      role: profile?.role ?? fallbackRole,
      theme: profile?.theme ?? "default",
      createdAt: authUser._creationTime,
    },
  };
}

async function requireViewer(ctx: any) {
  const viewer = await getViewer(ctx);
  if (!viewer) {
    throw new Error("Authentication required");
  }
  return viewer;
}

async function requireAdmin(ctx: any) {
  const viewer = await requireViewer(ctx);
  if (viewer.user.role !== "admin") {
    throw new Error("Admin access required");
  }
  return viewer;
}

async function ensureUserProfile(ctx: any, userId: any, email?: string | null) {
  const existing = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();

  const adminEmails = parseAdminEmails();
  const role = adminEmails.has((email ?? "").toLowerCase()) ? "admin" : "user";
  const now = Date.now();

  if (existing) {
    if (existing.role !== role) {
      await ctx.db.patch(existing._id, { role, updatedAt: now });
      return { ...existing, role, updatedAt: now };
    }
    return existing;
  }

  const profileId = await ctx.db.insert("userProfiles", {
    userId,
    role,
    theme: "default",
    createdAt: now,
    updatedAt: now,
  });

  return ctx.db.get(profileId);
}

async function getProductOrThrow(ctx: any, productId: any) {
  const product = await ctx.db.get(productId);
  if (!product) {
    throw new Error("Product not found");
  }
  return product;
}

function sanitizeCategoryInput(args: {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
}) {
  return {
    name: normalizeDisplayName(args.name),
    slug: normalizeSlug(args.slug),
    description: normalizeOptionalText(args.description, "Description", 500),
    imageUrl: normalizeSafeImageUrl(args.imageUrl),
    sortOrder: normalizeSortOrder(args.sortOrder),
  };
}

function sanitizeCategoryPatch(args: {
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
}) {
  return {
    name:
      args.name === undefined ? undefined : normalizeDisplayName(args.name),
    slug: args.slug === undefined ? undefined : normalizeSlug(args.slug),
    description: normalizeOptionalText(args.description, "Description", 500),
    imageUrl: normalizeSafeImageUrl(args.imageUrl),
    sortOrder:
      args.sortOrder === undefined
        ? undefined
        : normalizeSortOrder(args.sortOrder),
  };
}

function sanitizeProductInput(args: {
  name: string;
  description?: string;
  price: string;
  imageUrl?: string;
  categoryId?: any;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
}) {
  return {
    name: normalizeDisplayName(args.name),
    description: normalizeOptionalText(args.description, "Description", 2_000),
    price: normalizePrice(args.price),
    imageUrl: normalizeSafeImageUrl(args.imageUrl),
    categoryId: args.categoryId,
    stock: normalizeStock(args.stock),
    isActive: args.isActive,
    isFeatured: args.isFeatured,
  };
}

function sanitizeProductPatch(args: {
  name?: string;
  description?: string;
  price?: string;
  imageUrl?: string;
  categoryId?: any;
  stock?: number;
  isActive?: boolean;
  isFeatured?: boolean;
}) {
  return {
    name:
      args.name === undefined ? undefined : normalizeDisplayName(args.name),
    description: normalizeOptionalText(args.description, "Description", 2_000),
    price: args.price === undefined ? undefined : normalizePrice(args.price),
    imageUrl: normalizeSafeImageUrl(args.imageUrl),
    categoryId: args.categoryId,
    stock: args.stock === undefined ? undefined : normalizeStock(args.stock),
    isActive: args.isActive,
    isFeatured: args.isFeatured,
  };
}

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    return viewer?.user ?? null;
  },
});

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    return categories.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const categoryBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const listProducts = query({
  args: { adminView: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let adminView = false;
    if (args.adminView) {
      const viewer = await getViewer(ctx);
      adminView = viewer?.user.role === "admin";
    }
    const products = await ctx.db.query("products").collect();

    return products
      .filter((product) => adminView || product.isActive)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const featuredProducts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    return products
      .filter((product) => product.isActive && product.isFeatured)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const productById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) {
      return null;
    }
    if (!product.isActive) {
      const viewer = await getViewer(ctx);
      if (viewer?.user.role !== "admin") {
        return null;
      }
    }
    return product;
  },
});

export const homePageData = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    const products = await ctx.db.query("products").collect();
    const activeProducts = products
      .filter((product) => product.isActive)
      .sort((a, b) => b.createdAt - a.createdAt);

    return {
      categories: categories.sort((a, b) => a.sortOrder - b.sortOrder),
      featured: activeProducts
        .filter((product) => product.isFeatured)
        .sort((a, b) => b.updatedAt - a.updatedAt),
      allProducts: activeProducts,
    };
  },
});

export const navData = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    const viewer = await getViewer(ctx);

    let cartCount = 0;
    if (viewer) {
      const items = await ctx.db
        .query("cartItems")
        .withIndex("by_userId", (q) => q.eq("userId", viewer.authUser._id))
        .collect();
      cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
    }

    return {
      categories: categories.sort((a, b) => a.sortOrder - b.sortOrder),
      cartCount,
    };
  },
});

export const categoryPageData = query({
  args: {
    slug: v.string(),
    adminView: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!category) {
      return null;
    }

    let adminView = false;
    if (args.adminView) {
      const viewer = await getViewer(ctx);
      adminView = viewer?.user.role === "admin";
    }

    const products = await ctx.db
      .query("products")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", category._id))
      .collect();

    return {
      category,
      products: products
        .filter((product) => adminView || product.isActive)
        .sort((a, b) => b.createdAt - a.createdAt),
    };
  },
});

export const adminPageData = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (viewer?.user.role !== "admin") {
      return null;
    }
    const categories = await ctx.db.query("categories").collect();
    const products = await ctx.db.query("products").collect();

    return {
      categories: categories.sort((a, b) => a.sortOrder - b.sortOrder),
      products: products.sort((a, b) => b.createdAt - a.createdAt),
      stats: {
        totalProducts: products.length,
        activeProducts: products.filter((product) => product.isActive).length,
        outOfStock: products.filter((product) => product.stock === 0).length,
        lowStock: products.filter(
          (product) => product.stock > 0 && product.stock <= 5,
        ).length,
        totalCategories: categories.length,
        lowStockProducts: products.filter((product) => product.stock <= 5),
      },
    };
  },
});

export const cartItems = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (!viewer) {
      return [];
    }

    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_userId", (q) => q.eq("userId", viewer.authUser._id))
      .collect();

    return Promise.all(
      items.map(async (item) => ({
        ...item,
        product: await ctx.db.get(item.productId),
      })),
    );
  },
});

export const ensureProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    await ensureUserProfile(ctx, viewer.authUser._id, viewer.authUser.email);
    return true;
  },
});

export const updateTheme = mutation({
  args: { theme: v.string() },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const profile = await ensureUserProfile(
      ctx,
      viewer.authUser._id,
      viewer.authUser.email,
    );
    await ctx.db.patch(profile._id, {
      theme: normalizeTheme(args.theme),
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const addToCart = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const quantity = normalizeCartQuantity(args.quantity);
    const product = await getProductOrThrow(ctx, args.productId);

    if (!product.isActive || product.stock < quantity) {
      throw new Error("Insufficient stock");
    }

    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_userId_productId", (q) =>
        q.eq("userId", viewer.authUser._id).eq("productId", args.productId),
      )
      .unique();

    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    if (product.stock < nextQuantity) {
      throw new Error("Insufficient stock");
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        quantity: nextQuantity,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return ctx.db.insert("cartItems", {
      userId: viewer.authUser._id,
      productId: args.productId,
      quantity,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateCartItem = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_userId_productId", (q) =>
        q.eq("userId", viewer.authUser._id).eq("productId", args.productId),
      )
      .unique();

    if (!existing) {
      return null;
    }

    if (args.quantity <= 0) {
      await ctx.db.delete(existing._id);
      return null;
    }
    const quantity = normalizeCartQuantity(args.quantity);

    const product = await getProductOrThrow(ctx, args.productId);
    if (product.stock < quantity) {
      throw new Error("Insufficient stock");
    }

    await ctx.db.patch(existing._id, {
      quantity,
      updatedAt: Date.now(),
    });

    return existing._id;
  },
});

export const removeCartItem = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_userId_productId", (q) =>
        q.eq("userId", viewer.authUser._id).eq("productId", args.productId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return true;
  },
});

export const clearCart = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_userId", (q) => q.eq("userId", viewer.authUser._id))
      .collect();

    await Promise.all(items.map((item) => ctx.db.delete(item._id)));
    return true;
  },
});

export const createCategory = mutation({
  args: categoryInput,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return ctx.db.insert("categories", sanitizeCategoryInput(args));
  },
});

export const updateCategory = mutation({
  args: {
    id: v.id("categories"),
    data: v.object({
      name: v.optional(v.string()),
      slug: v.optional(v.string()),
      description: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      sortOrder: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, sanitizeCategoryPatch(args.data));
    return true;
  },
});

export const deleteCategory = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
    return true;
  },
});

export const createProduct = mutation({
  args: productInput,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const sanitized = sanitizeProductInput(args);
    return ctx.db.insert("products", {
      ...sanitized,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateProduct = mutation({
  args: {
    id: v.id("products"),
    data: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      price: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      categoryId: v.optional(v.id("categories")),
      stock: v.optional(v.number()),
      isActive: v.optional(v.boolean()),
      isFeatured: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const sanitized = sanitizeProductPatch(args.data);
    await ctx.db.patch(args.id, {
      ...sanitized,
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const updateProductStock = mutation({
  args: {
    id: v.id("products"),
    stock: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, {
      stock: normalizeStock(args.stock),
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const deleteProduct = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
    return true;
  },
});

export const storeStats = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (viewer?.user.role !== "admin") {
      return null;
    }

    const products = await ctx.db.query("products").collect();
    const categories = await ctx.db.query("categories").collect();

    return {
      totalProducts: products.length,
      activeProducts: products.filter((product) => product.isActive).length,
      outOfStock: products.filter((product) => product.stock === 0).length,
      lowStock: products.filter(
        (product) => product.stock > 0 && product.stock <= 5,
      ).length,
      totalCategories: categories.length,
      lowStockProducts: products.filter((product) => product.stock <= 5),
    };
  },
});
