import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, AlertTriangle, Plus, Pencil, Trash2, Package, Tag, BarChart3, Headphones } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "../../../convex/_generated/api";

type ProductForm = {
  name: string;
  description: string;
  deliveryContent: string;
  price: string;
  imageUrl: string;
  categoryId: string;
  stock: string;
  isActive: boolean;
  isFeatured: boolean;
};

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: string;
};

const emptyProduct: ProductForm = { name: "", description: "", deliveryContent: "", price: "", imageUrl: "", categoryId: "", stock: "0", isActive: true, isFeatured: false };
const emptyCategory: CategoryForm = { name: "", slug: "", description: "", imageUrl: "", sortOrder: "0" };

async function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read image"));
    image.src = source;
  });
}

async function compressImageDataUrl(source: string) {
  const image = await loadImage(source);
  const maxSize = 700;
  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not prepare image");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
  if (dataUrl.length > 900_000) {
    throw new Error("Image is too large. Try a smaller image.");
  }

  return dataUrl;
}

async function readFileAsDataUrl(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file");
  }

  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });

  return compressImageDataUrl(source);
}

async function prepareProductFormForSave(form: ProductForm) {
  const imageUrl = form.imageUrl.trim();
  return {
    ...form,
    imageUrl: imageUrl.startsWith("data:image/")
      ? await compressImageDataUrl(imageUrl)
      : imageUrl,
  };
}

async function prepareCategoryFormForSave(form: CategoryForm) {
  const imageUrl = form.imageUrl.trim();
  return {
    ...form,
    imageUrl: imageUrl.startsWith("data:image/")
      ? await compressImageDataUrl(imageUrl)
      : imageUrl,
  };
}

function ProductEditor({
  open,
  onOpenChange,
  value,
  onChange,
  onSubmit,
  categories,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: ProductForm;
  onChange: (value: ProductForm) => void;
  onSubmit: () => void;
  categories: Array<{ _id: string; name: string }>;
  title: string;
}) {
  const handleImageSelect = async (file: File | undefined) => {
    if (!file) return;
    try {
      const imageUrl = await readFileAsDataUrl(file);
      onChange({ ...value, imageUrl });
      toast.success("Image added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add image");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>שם</Label><Input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>מחיר</Label><Input type="number" value={value.price} onChange={(e) => onChange({ ...value, price: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>מלאי</Label><Input type="number" value={value.stock} onChange={(e) => onChange({ ...value, stock: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5"><Label>תמונה</Label><Input value={value.imageUrl} onChange={(e) => onChange({ ...value, imageUrl: e.target.value })} placeholder="Image URL or local image" /><Input type="file" accept="image/*" onChange={(e) => void handleImageSelect(e.target.files?.[0])} />{value.imageUrl ? <img src={value.imageUrl} alt="Preview" className="h-28 w-full rounded-md border border-border bg-muted object-contain" /> : null}</div>
          <div className="space-y-1.5"><Label>קטגוריה</Label><select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={value.categoryId} onChange={(e) => onChange({ ...value, categoryId: e.target.value })}><option value="">ללא</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select></div>
          <div className="space-y-1.5"><Label>תיאור</Label><Textarea rows={4} value={value.description} onChange={(e) => onChange({ ...value, description: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Delivery content</Label><Textarea rows={4} value={value.deliveryContent} onChange={(e) => onChange({ ...value, deliveryContent: e.target.value })} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button><Button onClick={onSubmit}>שמור</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryEditor({
  open,
  onOpenChange,
  value,
  onChange,
  onSubmit,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: CategoryForm;
  onChange: (value: CategoryForm) => void;
  onSubmit: () => void;
  title: string;
}) {
  const handleImageSelect = async (file: File | undefined) => {
    if (!file) return;
    try {
      const imageUrl = await readFileAsDataUrl(file);
      onChange({ ...value, imageUrl });
      toast.success("Image added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add image");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>שם</Label><Input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })} /></div>
          <div className="space-y-1.5"><Label>Slug</Label><Input dir="ltr" value={value.slug} onChange={(e) => onChange({ ...value, slug: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>תמונה</Label><Input value={value.imageUrl} onChange={(e) => onChange({ ...value, imageUrl: e.target.value })} placeholder="Image URL or local image" /><Input type="file" accept="image/*" onChange={(e) => void handleImageSelect(e.target.files?.[0])} />{value.imageUrl ? <img src={value.imageUrl} alt="Preview" className="h-28 w-full rounded-md border border-border bg-muted object-contain" /> : null}</div>
          <div className="space-y-1.5"><Label>תיאור</Label><Textarea rows={3} value={value.description} onChange={(e) => onChange({ ...value, description: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>סדר</Label><Input type="number" value={value.sortOrder} onChange={(e) => onChange({ ...value, sortOrder: e.target.value })} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button><Button onClick={onSubmit}>שמור</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const adminData = useQuery(api.store.adminPageData);
  const categories = adminData?.categories ?? [];
  const products = adminData?.products ?? [];
  const stats = adminData?.stats;
  const createProduct = useMutation(api.store.createProduct);
  const updateProduct = useMutation(api.store.updateProduct);
  const deleteProduct = useMutation(api.store.deleteProduct);
  const createCategory = useMutation(api.store.createCategory);
  const updateCategory = useMutation(api.store.updateCategory);
  const deleteCategory = useMutation(api.store.deleteCategory);

  const [newProductOpen, setNewProductOpen] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProduct);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategory);

  if (loading) {
    return <div className="container py-12"><div className="mb-8 h-8 w-48 rounded skeleton" /><div className="h-64 rounded-xl skeleton" /></div>;
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="container py-20 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-muted"><AlertTriangle className="h-10 w-10 text-muted-foreground/40" /></div>
        <h2 className="mb-3 text-2xl font-black text-foreground">גישה אסורה</h2>
        <Link href="/"><Button className="gap-2"><ArrowRight className="h-4 w-4" />חזרה לדף הבית</Button></Link>
      </div>
    );
  }

  const saveNewProduct = async () => {
    const form = await prepareProductFormForSave(productForm);
    await createProduct({ ...form, categoryId: form.categoryId ? form.categoryId as never : undefined, stock: parseInt(form.stock || "0", 10) || 0 });
    toast.success("המוצר נוצר");
    setProductForm(emptyProduct);
    setNewProductOpen(false);
  };

  const saveEditedProduct = async () => {
    if (!editProductId) return;
    const form = await prepareProductFormForSave(productForm);
    await updateProduct({ id: editProductId as never, data: { ...form, categoryId: form.categoryId ? form.categoryId as never : undefined, stock: parseInt(form.stock || "0", 10) || 0 } });
    toast.success("המוצר עודכן");
    setEditProductId(null);
  };

  const saveNewCategory = async () => {
    const form = await prepareCategoryFormForSave(categoryForm);
    await createCategory({ ...form, sortOrder: parseInt(form.sortOrder || "0", 10) || 0 });
    toast.success("הקטגוריה נוצרה");
    setCategoryForm(emptyCategory);
    setNewCategoryOpen(false);
  };

  const saveEditedCategory = async () => {
    if (!editCategoryId) return;
    const form = await prepareCategoryFormForSave(categoryForm);
    await updateCategory({ id: editCategoryId as never, data: { ...form, sortOrder: parseInt(form.sortOrder || "0", 10) || 0 } });
    toast.success("הקטגוריה עודכנה");
    setEditCategoryId(null);
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container py-8">
        <div className="mb-8"><Link href="/"><span className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowRight className="h-4 w-4" />חזרה לחנות</span></Link></div>
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><h1 className="text-2xl font-black text-foreground md:text-3xl">פאנל ניהול</h1><p className="mt-1 text-muted-foreground">ניהול קטלוג המוצרים, המלאי ופניות התמיכה של החנות.</p></div><Button asChild className="gap-2"><Link href="/admin/support"><Headphones className="h-4 w-4" />לייב צ׳אט</Link></Button></div>
        <Tabs defaultValue="stats" dir="rtl">
          <TabsList className="mb-6">
            <TabsTrigger value="stats" className="gap-2"><BarChart3 className="h-4 w-4" />סקירה</TabsTrigger>
            <TabsTrigger value="products" className="gap-2"><Package className="h-4 w-4" />מוצרים</TabsTrigger>
            <TabsTrigger value="categories" className="gap-2"><Tag className="h-4 w-4" />קטגוריות</TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {stats ? [
                { label: "מוצרים", value: stats.totalProducts },
                { label: "פעילים", value: stats.activeProducts },
                { label: "אזל", value: stats.outOfStock },
                { label: "מלאי נמוך", value: stats.lowStock },
                { label: "קטגוריות", value: stats.totalCategories },
              ].map((stat) => <div key={stat.label} className="rounded-xl border border-border bg-card p-5"><p className="text-2xl font-black text-foreground">{stat.value}</p><p className="mt-1 text-xs text-muted-foreground">{stat.label}</p></div>) : null}
            </div>
          </TabsContent>

          <TabsContent value="products">
            <div className="mb-6 flex items-center justify-between"><div><h2 className="text-xl font-bold text-foreground">מוצרים</h2><p className="text-sm text-muted-foreground">{products.length} מוצרים</p></div><Button className="gap-2" onClick={() => { setProductForm(emptyProduct); setNewProductOpen(true); }}><Plus className="h-4 w-4" />הוסף מוצר</Button></div>
            <div className="space-y-2">
              {products.map((product) => (
                <motion.div key={product._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{product.name}</p><p className="text-sm text-muted-foreground">₪{parseFloat(product.price).toFixed(2)} · מלאי {product.stock}</p></div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setEditProductId(product._id); setProductForm({ name: product.name, description: product.description ?? "", deliveryContent: product.deliveryContent ?? "", price: product.price, imageUrl: product.imageUrl ?? "", categoryId: product.categoryId ?? "", stock: String(product.stock), isActive: product.isActive, isFeatured: product.isFeatured }); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => void deleteProduct({ id: product._id as never }).then(() => toast.success("המוצר נמחק"))}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <div className="mb-6 flex items-center justify-between"><div><h2 className="text-xl font-bold text-foreground">קטגוריות</h2><p className="text-sm text-muted-foreground">{categories.length} קטגוריות</p></div><Button className="gap-2" onClick={() => { setCategoryForm(emptyCategory); setNewCategoryOpen(true); }}><Plus className="h-4 w-4" />הוסף קטגוריה</Button></div>
            <div className="space-y-2">
              {categories.map((category) => (
                <motion.div key={category._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{category.name}</p><p className="text-xs text-muted-foreground">{category.slug}</p></div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setEditCategoryId(category._id); setCategoryForm({ name: category.name, slug: category.slug, description: category.description ?? "", imageUrl: category.imageUrl ?? "", sortOrder: String(category.sortOrder) }); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => void deleteCategory({ id: category._id as never }).then(() => toast.success("הקטגוריה נמחקה"))}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ProductEditor open={newProductOpen} onOpenChange={setNewProductOpen} value={productForm} onChange={setProductForm} onSubmit={() => void saveNewProduct()} categories={categories} title="הוספת מוצר" />
      <ProductEditor open={Boolean(editProductId)} onOpenChange={(open) => !open && setEditProductId(null)} value={productForm} onChange={setProductForm} onSubmit={() => void saveEditedProduct()} categories={categories} title="עריכת מוצר" />
      <CategoryEditor open={newCategoryOpen} onOpenChange={setNewCategoryOpen} value={categoryForm} onChange={setCategoryForm} onSubmit={() => void saveNewCategory()} title="הוספת קטגוריה" />
      <CategoryEditor open={Boolean(editCategoryId)} onOpenChange={(open) => !open && setEditCategoryId(null)} value={categoryForm} onChange={setCategoryForm} onSubmit={() => void saveEditedCategory()} title="עריכת קטגוריה" />
    </div>
  );
}
