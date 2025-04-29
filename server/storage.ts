import { 
  users, type User, type InsertUser,
  products, type Product, type InsertProduct,
  cartItems, type CartItem, type InsertCartItem, type CartItemWithProduct,
  orders, type Order, type InsertOrder
} from "@shared/schema";
import { nanoid } from "nanoid";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTwoFactorSecret(userId: number, secret: string): Promise<User | undefined>;
  enableTwoFactor(userId: number): Promise<User | undefined>;
  disableTwoFactor(userId: number): Promise<User | undefined>;
  
  // Product methods
  getProducts(): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: InsertProduct): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Cart methods
  getCartItems(): Promise<CartItemWithProduct[]>;
  getCartItem(id: number): Promise<CartItem | undefined>;
  createCartItem(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  deleteCartItem(id: number): Promise<boolean>;
  clearCart(): Promise<boolean>;
  
  // Order methods
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private cartItems: Map<number, CartItem>;
  private orders: Map<number, Order>;
  userId: number;
  productId: number;
  cartItemId: number;
  orderId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.cartItems = new Map();
    this.orders = new Map();
    this.userId = 1;
    this.productId = 1;
    this.cartItemId = 1;
    this.orderId = 1;
    
    // Initialize with some products
    this.initializeProducts();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { 
      ...insertUser, 
      id, 
      twoFactorSecret: null,
      twoFactorEnabled: false
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserTwoFactorSecret(userId: number, secret: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, twoFactorSecret: secret };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async enableTwoFactor(userId: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, twoFactorEnabled: true };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async disableTwoFactor(userId: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, twoFactorEnabled: false, twoFactorSecret: null };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  // Product methods
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }
  
  async getProductsByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      product => product.category === category
    );
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productId++;
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }
  
  async updateProduct(id: number, insertProduct: InsertProduct): Promise<Product | undefined> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) return undefined;
    
    const updatedProduct: Product = { ...insertProduct, id };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }
  
  // Cart methods
  async getCartItems(): Promise<CartItemWithProduct[]> {
    const items = Array.from(this.cartItems.values());
    return Promise.all(items.map(async (item) => {
      const product = await this.getProduct(item.productId);
      return {
        ...item,
        product: product!
      };
    }));
  }
  
  async getCartItem(id: number): Promise<CartItem | undefined> {
    return this.cartItems.get(id);
  }
  
  async createCartItem(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if the same product with same size and color already exists
    const existingItems = Array.from(this.cartItems.values());
    const existingItem = existingItems.find(
      item => 
        item.productId === insertCartItem.productId && 
        item.color === insertCartItem.color && 
        item.size === insertCartItem.size
    );
    
    if (existingItem) {
      // Update quantity instead of creating new item
      existingItem.quantity += insertCartItem.quantity || 1;
      this.cartItems.set(existingItem.id, existingItem);
      return existingItem;
    }
    
    const id = this.cartItemId++;
    const cartItem: CartItem = { ...insertCartItem, id };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }
  
  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const cartItem = this.cartItems.get(id);
    if (!cartItem) return undefined;
    
    if (quantity <= 0) {
      this.cartItems.delete(id);
      return undefined;
    }
    
    const updatedItem = { ...cartItem, quantity };
    this.cartItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteCartItem(id: number): Promise<boolean> {
    return this.cartItems.delete(id);
  }
  
  async clearCart(): Promise<boolean> {
    this.cartItems.clear();
    return true;
  }
  
  // Order methods
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.orderId++;
    const order: Order = { ...insertOrder, id };
    this.orders.set(id, order);
    return order;
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(
      order => order.orderNumber === orderNumber
    );
  }
  
  // Helper to initialize sample products
  private initializeProducts() {
    const sampleProducts: InsertProduct[] = [
      {
        title: 'Floral Summer Dress',
        price: "49.99",
        originalPrice: "79.99",
        description: 'This beautiful floral summer dress features a flattering A-line silhouette with a V-neckline and short flutter sleeves. Made from lightweight, breathable fabric perfect for warm weather.',
        images: [
          'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1496747611176-843222e1e57c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        ],
        category: 'dresses',
        rating: "4.8",
        colors: ['Pink', 'Blue', 'Yellow', 'Gray'],
        sizes: ['XS', 'S', 'M', 'L', 'XL']
      },
      {
        title: 'Casual Maxi Dress',
        price: "59.99",
        originalPrice: "89.99",
        description: 'A comfortable and stylish maxi dress perfect for casual outings. Features a loose fit and soft cotton blend material.',
        images: [
          'https://images.unsplash.com/photo-1566174053879-31528523f8cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        ],
        category: 'dresses',
        rating: "4.6",
        colors: ['Blue', 'Black', 'White'],
        sizes: ['S', 'M', 'L', 'XL']
      },
      {
        title: 'Elegant Evening Dress',
        price: "89.99",
        originalPrice: "129.99",
        description: 'An elegant evening dress perfect for formal occasions. Features a fitted silhouette and premium fabric.',
        images: [
          'https://images.unsplash.com/photo-1475180098004-ca77a66827be?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        ],
        category: 'dresses',
        rating: "4.9",
        colors: ['Black', 'Red', 'Navy'],
        sizes: ['XS', 'S', 'M', 'L']
      },
      {
        title: 'Bohemian Wrap Dress',
        price: "65.99",
        originalPrice: "95.99",
        description: 'A beautiful bohemian wrap dress with a flattering V-neckline and tie waist. Perfect for summer days.',
        images: [
          'https://images.unsplash.com/photo-1495385794356-15371f348c31?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        ],
        category: 'dresses',
        rating: "4.7",
        colors: ['Green', 'Brown', 'Beige'],
        sizes: ['S', 'M', 'L']
      },
      {
        title: 'Printed Summer Dress',
        price: "55.99",
        originalPrice: null,
        description: 'A light and airy printed summer dress with a playful pattern. Perfect for beach days and casual outings.',
        images: [
          'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        ],
        category: 'dresses',
        rating: "4.5",
        colors: ['Blue', 'Pink', 'Yellow'],
        sizes: ['XS', 'S', 'M', 'L', 'XL']
      },
      {
        title: 'Linen Midi Dress',
        price: "69.99",
        originalPrice: "99.99",
        description: 'A comfortable linen midi dress, perfect for warm days. Features a relaxed fit and breathable fabric.',
        images: [
          'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        ],
        category: 'dresses',
        rating: "4.8",
        colors: ['White', 'Beige', 'Olive'],
        sizes: ['S', 'M', 'L', 'XL']
      },
      {
        title: 'Flowy Beach Dress',
        price: "52.99",
        originalPrice: "72.99",
        description: 'A lightweight, flowy dress perfect for beach vacations. Made from breathable fabric with a loose, comfortable fit.',
        images: [
          'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        ],
        category: 'dresses',
        rating: "4.6",
        colors: ['White', 'Blue', 'Coral'],
        sizes: ['XS', 'S', 'M', 'L']
      },
      {
        title: 'Classic Shirt Dress',
        price: "75.99",
        originalPrice: "95.99",
        description: 'A classic shirt dress with a button-up front and collar. Versatile for both casual and semi-formal occasions.',
        images: [
          'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        ],
        category: 'dresses',
        rating: "4.7",
        colors: ['Blue', 'White', 'Black'],
        sizes: ['S', 'M', 'L', 'XL']
      }
    ];
    
    sampleProducts.forEach(product => {
      this.createProduct(product);
    });
  }
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUserTwoFactorSecret(userId: number, secret: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ twoFactorSecret: secret })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
  
  async enableTwoFactor(userId: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ twoFactorEnabled: true })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
  
  async disableTwoFactor(userId: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        twoFactorEnabled: false,
        twoFactorSecret: null 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
  
  // Product methods
  async getProducts(): Promise<Product[]> {
    return db.select().from(products);
  }
  
  async getProductsByCategory(category: string): Promise<Product[]> {
    return db.select().from(products).where(eq(products.category, category));
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }
  
  async updateProduct(id: number, insertProduct: InsertProduct): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set(insertProduct)
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return !!result;
  }
  
  // Cart methods
  async getCartItems(): Promise<CartItemWithProduct[]> {
    const items = await db.select().from(cartItems);
    return Promise.all(items.map(async (item) => {
      const product = await this.getProduct(item.productId);
      return {
        ...item,
        product: product!
      };
    }));
  }
  
  async getCartItem(id: number): Promise<CartItem | undefined> {
    const [cartItem] = await db.select().from(cartItems).where(eq(cartItems.id, id));
    return cartItem || undefined;
  }
  
  async createCartItem(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if the same product with same size and color already exists
    const [existingItem] = await db.select()
      .from(cartItems)
      .where(and(
        eq(cartItems.productId, insertCartItem.productId),
        eq(cartItems.color || "", insertCartItem.color || ""),
        eq(cartItems.size || "", insertCartItem.size || "")
      ));
    
    if (existingItem) {
      // Update quantity instead of creating new item
      const newQuantity = existingItem.quantity + (insertCartItem.quantity || 1);
      const [updatedItem] = await db
        .update(cartItems)
        .set({ quantity: newQuantity })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    }
    
    // Create new cart item
    const [cartItem] = await db
      .insert(cartItems)
      .values(insertCartItem)
      .returning();
    return cartItem;
  }
  
  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    if (quantity <= 0) {
      await db.delete(cartItems).where(eq(cartItems.id, id));
      return undefined;
    }
    
    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updatedItem || undefined;
  }
  
  async deleteCartItem(id: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return !!result;
  }
  
  async clearCart(): Promise<boolean> {
    await db.delete(cartItems);
    return true;
  }
  
  // Order methods
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(insertOrder)
      .returning();
    return order;
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }
  
  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order || undefined;
  }
}

// Export database storage
export const storage = new DatabaseStorage();
