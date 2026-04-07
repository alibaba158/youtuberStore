import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllProducts,
  getProductById,
  getProductsByCategory,
  getFeaturedProducts,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
  getCartItems,
  upsertCartItem,
  removeCartItem,
  clearCart,
} from "./db";

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "ניגש לאזור אסור" });
  }
  return next({ ctx });
});

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  imageUrl: z.string().optional(),
  categoryId: z.number().int().optional(),
  stock: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Categories ─────────────────────────────────────────────────────────────
  categories: router({
    list: publicProcedure.query(async () => {
      return getAllCategories();
    }),

    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const cat = await getCategoryBySlug(input.slug);
        if (!cat) throw new TRPCError({ code: "NOT_FOUND" });
        return cat;
      }),

    create: adminProcedure
      .input(categorySchema)
      .mutation(async ({ input }) => {
        await createCategory(input);
        return { success: true };
      }),

    update: adminProcedure
      .input(z.object({ id: z.number().int(), data: categorySchema.partial() }))
      .mutation(async ({ input }) => {
        await updateCategory(input.id, input.data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await deleteCategory(input.id);
        return { success: true };
      }),
  }),

  // ─── Products ───────────────────────────────────────────────────────────────
  products: router({
    list: publicProcedure
      .input(z.object({ adminView: z.boolean().optional() }).optional())
      .query(async ({ input, ctx }) => {
        const isAdmin = ctx.user?.role === "admin";
        const activeOnly = !(input?.adminView && isAdmin);
        return getAllProducts(activeOnly);
      }),

    byId: publicProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ input }) => {
        const product = await getProductById(input.id);
        if (!product) throw new TRPCError({ code: "NOT_FOUND" });
        return product;
      }),

    byCategory: publicProcedure
      .input(z.object({ categoryId: z.number().int(), adminView: z.boolean().optional() }))
      .query(async ({ input, ctx }) => {
        const isAdmin = ctx.user?.role === "admin";
        const activeOnly = !(input.adminView && isAdmin);
        return getProductsByCategory(input.categoryId, activeOnly);
      }),

    featured: publicProcedure.query(async () => {
      return getFeaturedProducts();
    }),

    create: adminProcedure
      .input(productSchema)
      .mutation(async ({ input }) => {
        await createProduct({
          ...input,
          stock: input.stock ?? 0,
          isActive: input.isActive ?? true,
          isFeatured: input.isFeatured ?? false,
        });
        return { success: true };
      }),

    update: adminProcedure
      .input(z.object({ id: z.number().int(), data: productSchema.partial() }))
      .mutation(async ({ input }) => {
        await updateProduct(input.id, input.data);
        return { success: true };
      }),

    updateStock: adminProcedure
      .input(z.object({ id: z.number().int(), stock: z.number().int().min(0) }))
      .mutation(async ({ input }) => {
        await updateProductStock(input.id, input.stock);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await deleteProduct(input.id);
        return { success: true };
      }),
  }),

  // ─── Cart ───────────────────────────────────────────────────────────────────
  cart: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getCartItems(ctx.user.id);
    }),

    add: protectedProcedure
      .input(z.object({ productId: z.number().int(), quantity: z.number().int().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const product = await getProductById(input.productId);
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "המוצר לא נמצא" });
        if (product.stock < input.quantity) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "אין מספיק מלאי" });
        }
        await upsertCartItem(ctx.user.id, input.productId, input.quantity);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({ productId: z.number().int(), quantity: z.number().int().min(0) }))
      .mutation(async ({ ctx, input }) => {
        if (input.quantity === 0) {
          await removeCartItem(ctx.user.id, input.productId);
        } else {
          await upsertCartItem(ctx.user.id, input.productId, input.quantity);
        }
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ productId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        await removeCartItem(ctx.user.id, input.productId);
        return { success: true };
      }),

    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await clearCart(ctx.user.id);
      return { success: true };
    }),
  }),

  user: router({
    updateTheme: protectedProcedure
      .input(z.object({ theme: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(users).set({ theme: input.theme }).where(eq(users.id, ctx.user.id));
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
