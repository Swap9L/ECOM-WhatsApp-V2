import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertProductSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, LogOut, Shield, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import AdminLogin from "@/components/AdminLogin";
import TwoFactorSetup from "@/components/TwoFactorSetup";

// Enhanced schema with validation for the form
const productFormSchema = insertProductSchema.extend({
  price: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: "Price must be a valid number",
  }),
  originalPrice: z.string().optional().nullable().refine((val) => val === null || val === "" || !isNaN(parseFloat(val || "0")), {
    message: "Original price must be a valid number",
  }),
  rating: z.string().optional().nullable().refine((val) => val === null || val === "" || !isNaN(parseFloat(val || "0")), {
    message: "Rating must be a valid number between 0 and 5",
  }),
  colors: z.string().transform((val) => (val ? val.split(",").map((item) => item.trim()) : [])),
  sizes: z.string().transform((val) => (val ? val.split(",").map((item) => item.trim()) : [])),
  images: z.string().transform((val) => (val ? val.split(",").map((item) => item.trim()) : [])),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function Admin() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);

  // Form for adding/editing products
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: "",
      price: "",
      originalPrice: null,
      description: "",
      images: [],
      category: "dresses",
      rating: "4.5",
      colors: [],
      sizes: [],
    },
  });

  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  // Mutation for adding new product
  const createProductMutation = useMutation({
    mutationFn: (data: ProductFormValues) => apiRequest("POST", "/api/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      form.reset();
      toast({
        title: "Product added",
        description: "The product has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      });
      console.error("Error adding product:", error);
    },
  });

  // Mutation for updating product
  const updateProductMutation = useMutation({
    mutationFn: (data: ProductFormValues & { id: number }) => 
      apiRequest("PATCH", `/api/products/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      form.reset();
      setSelectedProductId(null);
      toast({
        title: "Product updated",
        description: "The product has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating product:", error);
    },
  });

  // Mutation for deleting product
  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
      console.error("Error deleting product:", error);
    },
  });

  // Load product data for editing
  useEffect(() => {
    if (selectedProductId === null) {
      form.reset({
        title: "",
        price: "",
        originalPrice: "",
        description: "",
        images: [],
        category: "dresses",
        rating: "4.5",
        colors: [],
        sizes: [],
      });
      return;
    }

    const product = products?.find((p: any) => p.id === selectedProductId);
    if (product) {
      form.reset({
        title: product.title,
        price: product.price,
        originalPrice: product.originalPrice || "",
        description: product.description,
        images: product.images,
        category: product.category,
        rating: product.rating || "4.5",
        colors: product.colors || [],
        sizes: product.sizes || [],
      });
    }
  }, [form, products, selectedProductId]);

  // Handle form submission
  const onSubmit = (data: ProductFormValues) => {
    if (selectedProductId) {
      updateProductMutation.mutate({ ...data, id: selectedProductId });
    } else {
      createProductMutation.mutate(data);
    }
  };

  // Admin login handler
  const handleLoginSuccess = () => {
    // Re-check authentication after login
    toast({
      title: "Login successful",
      description: "You are now logged in as admin.",
    });
  };

  // Handle 2FA setup completion
  const handleTwoFactorSetupComplete = () => {
    setShowTwoFactorSetup(false);
    toast({
      title: "Two-factor authentication enabled",
      description: "Your account is now more secure.",
    });
  };

  // Handle logout
  const { logout } = useAuth();
  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  // If loading auth state, show loading spinner
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not admin or not authenticated, show login form
  if (!user || !user.isAdmin) {
    return (
      <div className="container mx-auto py-12">
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // Show 2FA setup if requested
  if (showTwoFactorSetup) {
    return (
      <div className="container mx-auto py-12">
        <TwoFactorSetup onSetupComplete={handleTwoFactorSetupComplete} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Admin Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your products and store</p>
        </div>
        <div className="flex items-center gap-4">
          {!user.twoFactorEnabled && (
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setShowTwoFactorSetup(true)}
            >
              <Shield className="h-4 w-4" />
              Set Up 2FA
            </Button>
          )}
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
      
      <Separator />
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Product Form */}
        <div className="w-full md:w-1/2">
          <Card>
            <CardHeader>
              <CardTitle>{selectedProductId ? "Edit Product" : "Add New Product"}</CardTitle>
              <CardDescription>
                {selectedProductId 
                  ? "Update the selected product's details" 
                  : "Fill in the details to add a new product"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Product title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <Input placeholder="49.99" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="originalPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Original Price (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="79.99" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Product description" 
                            className="min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input placeholder="dresses" {...field} />
                        </FormControl>
                        <FormDescription>
                          Current category system only supports 'dresses'
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="images"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Images</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg" 
                            className="min-h-[100px]" 
                            {...field}
                            value={Array.isArray(field.value) ? field.value.join(", ") : field.value}
                          />
                        </FormControl>
                        <FormDescription>
                          Comma-separated list of image URLs
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="colors"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Colors</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Blue, Red, Black" 
                              {...field}
                              value={Array.isArray(field.value) ? field.value.join(", ") : field.value}
                            />
                          </FormControl>
                          <FormDescription>
                            Comma-separated list of colors
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="sizes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sizes</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="S, M, L, XL" 
                              {...field}
                              value={Array.isArray(field.value) ? field.value.join(", ") : field.value}
                            />
                          </FormControl>
                          <FormDescription>
                            Comma-separated list of sizes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        form.reset();
                        setSelectedProductId(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createProductMutation.isPending || updateProductMutation.isPending}
                    >
                      {selectedProductId ? "Update Product" : "Add Product"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Product List */}
        <div className="w-full md:w-1/2">
          <Card>
            <CardHeader>
              <CardTitle>Product List</CardTitle>
              <CardDescription>Manage your existing products</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading products...</div>
              ) : (
                <div className="space-y-4">
                  {products && products.length > 0 ? (
                    products.map((product: any) => (
                      <div key={product.id} className="border rounded-md p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">{product.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              ${product.price}
                              {product.originalPrice && (
                                <span className="line-through ml-2">${product.originalPrice}</span>
                              )}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedProductId(product.id)}
                            >
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => deleteProductMutation.mutate(product.id)}
                              disabled={deleteProductMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {product.images && product.images.length > 0 && (
                          <div className="flex gap-1 mb-2 overflow-x-auto">
                            {product.images.map((url: string, i: number) => (
                              <img 
                                key={i} 
                                src={url} 
                                alt={`${product.title} image ${i+1}`} 
                                className="h-12 w-12 object-cover rounded"
                              />
                            ))}
                          </div>
                        )}
                        <p className="text-sm line-clamp-2">{product.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">No products found</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}