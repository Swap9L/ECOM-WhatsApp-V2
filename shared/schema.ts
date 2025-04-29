import { pgTable, text, serial, integer, boolean, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Product Model
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: numeric("original_price", { precision: 10, scale: 2 }),
  description: text("description").notNull(),
  images: text("images").array().notNull(),
  category: text("category").notNull(),
  rating: numeric("rating", { precision: 3, scale: 1 }).default("4.5"),
  colors: text("colors").array(),
  sizes: text("sizes").array(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

// Cart Item Model
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  color: text("color"),
  size: text("size"),
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
});

// Order Model
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  address: text("address").notNull(),
  paymentMethod: text("payment_method").notNull(),
  items: jsonb("items").notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  shipping: numeric("shipping", { precision: 10, scale: 2 }).notNull(),
  tax: numeric("tax", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  orderNumber: text("order_number").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type CartItemWithProduct = CartItem & {
  product: Product;
};

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  twoFactorSecret: text("two_factor_secret"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
