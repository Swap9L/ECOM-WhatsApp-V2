import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCartItemSchema, 
  insertOrderSchema,
  insertProductSchema,
  CartItemWithProduct,
  Order,
  Product
} from "@shared/schema";
import { z } from "zod";
import { nanoid } from "nanoid";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";

// WhatsApp API Helper Function (Simplified for demo, would need the actual WhatsApp API)
async function sendWhatsAppMessage(phoneNumber: string, orderDetails: Order) {
  // This would integrate with actual WhatsApp API in production
  console.log(`Sending WhatsApp message to ${phoneNumber} with order #${orderDetails.orderNumber}`);
  return true;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  // GET all products
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // GET products by category
  app.get("/api/products/category/:category", async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const products = await storage.getProductsByCategory(category);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products by category" });
    }
  });

  // GET a specific product
  app.get("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });
  
  // CREATE product (for admin CMS)
  app.post("/api/products", isAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });
  
  // UPDATE product (for admin CMS)
  app.patch("/api/products/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.updateProduct(id, validatedData);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });
  
  // DELETE product (for admin CMS)
  app.delete("/api/products/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const success = await storage.deleteProduct(id);
      
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // CART ENDPOINTS
  
  // GET all cart items
  app.get("/api/cart", async (req: Request, res: Response) => {
    try {
      const cartItems = await storage.getCartItems();
      
      // Calculate cart totals
      const subtotal = cartItems.reduce((sum, item) => {
        return sum + (parseFloat(item.product.price.toString()) * item.quantity);
      }, 0);
      
      const shipping = subtotal > 0 ? 9.99 : 0;
      const tax = subtotal * 0.08; // 8% tax rate
      const total = subtotal + shipping + tax;
      
      res.json({
        items: cartItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
        shipping: parseFloat(shipping.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        count: cartItems.reduce((sum, item) => sum + item.quantity, 0)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  // ADD item to cart
  app.post("/api/cart", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCartItemSchema.parse(req.body);
      const cartItem = await storage.createCartItem(validatedData);
      res.status(201).json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cart item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  // UPDATE cart item quantity
  app.patch("/api/cart/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid cart item ID" });
      }
      
      const { quantity } = req.body;
      if (typeof quantity !== 'number') {
        return res.status(400).json({ message: "Quantity must be a number" });
      }
      
      const updatedItem = await storage.updateCartItem(id, quantity);
      if (!updatedItem && quantity > 0) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      res.json({ success: true, item: updatedItem });
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  // DELETE cart item
  app.delete("/api/cart/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid cart item ID" });
      }
      
      const result = await storage.deleteCartItem(id);
      if (!result) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete cart item" });
    }
  });

  // CLEAR cart
  app.delete("/api/cart", async (req: Request, res: Response) => {
    try {
      await storage.clearCart();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // ORDER ENDPOINTS
  
  // CREATE order
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      // Generate unique order number
      const orderNumber = `DRS-${nanoid(6).toUpperCase()}`;
      
      // Get complete cart with products to store in order
      const cartItems = await storage.getCartItems();
      
      // Calculate order totals
      const subtotal = parseFloat(
        cartItems.reduce((sum, item) => {
          return sum + (parseFloat(item.product.price.toString()) * item.quantity);
        }, 0).toFixed(2)
      );
      
      const shipping = subtotal > 0 ? 9.99 : 0;
      const tax = parseFloat((subtotal * 0.08).toFixed(2)); // 8% tax rate
      const total = parseFloat((subtotal + shipping + tax).toFixed(2));
      
      // Prepare order data with calculated values
      const orderData = {
        ...req.body,
        items: cartItems.map(item => ({
          productId: item.productId,
          title: item.product.title,
          price: item.product.price,
          quantity: item.quantity,
          color: item.color,
          size: item.size,
          image: item.product.images[0]
        })),
        subtotal: subtotal.toString(),
        shipping: shipping.toString(),
        tax: tax.toString(),
        total: total.toString(),
        orderNumber
      };
      
      // Validate the order data
      const validatedData = insertOrderSchema.parse(orderData);
      
      // Create the order
      const order = await storage.createOrder(validatedData);
      
      // Clear the cart after successful order
      await storage.clearCart();
      
      // Send WhatsApp message with order details (if WhatsApp method selected)
      if (order.paymentMethod === 'whatsapp') {
        await sendWhatsAppMessage(order.phoneNumber, order);
      }
      
      // Return the order details
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      console.error("Order error:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // GET order by order number
  app.get("/api/orders/:orderNumber", async (req: Request, res: Response) => {
    try {
      const { orderNumber } = req.params;
      const order = await storage.getOrderByNumber(orderNumber);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
