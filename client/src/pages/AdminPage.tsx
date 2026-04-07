import { useState } from "react";
import { Link } from "wouter";
import {
  Plus, Pencil, Trash2, Package, Tag, BarChart3,
  ArrowRight, Save, X, AlertTriangle, Star, Eye, EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ───────────────────────────────────────────────────────────────────

type ProductForm = {
  name: string;
  description: string;
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

const emptyProductForm: ProductForm = {
  name: "", description: "", price: "", imageUrl: "",
  categoryId: "", stock: "0", isActive: true, isFeatured: false,
};

const emptyCategoryForm: CategoryForm = {
  name: "", slug: "", description: "", imageUrl: "", sortOrder: "0",
};

// ─── Stock Badge ─────────────────────────────────────────────────────────────

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="stock-out text-xs px-2 py-0.5 rounded-full font-medium">אזל</span>;
  if (stock <= 5) return <span className="stock-low text-xs px-2 py-0.5 rounded-full font-medium">{stock} יח'</span>;
  return <span className="stock-in text-xs px-2 py-0.5 rounded-full font-medium">{stock} יח'</span>;
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

function ProductsTab() {
  const utils = trpc.useUtils();
  const [editProduct, setEditProduct] = useState<null | { id: number; form: ProductForm }>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<ProductForm>(emptyProductForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [stockEdit, setStockEdit] = useState<{ id: number; value: string } | null>(null);

  const { data: products, isLoading } = trpc.products.list.useQuery({ adminView: true });
  const { data: categories } = trpc.categories.list.useQuery();

  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); setAddOpen(false); setAddForm(emptyProductForm); toast.success("המוצר נוצר בהצלחה!"); },
    onError: (e) => toast.error(e.message),
  });

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); setEditProduct(null); toast.success("המוצר עודכן!"); },
    onError: (e) => toast.error(e.message),
  });

  const updateStock = trpc.products.updateStock.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); setStockEdit(null); toast.success("המלאי עודכן!"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); setDeleteId(null); toast.success("המוצר נמחק"); },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!addForm.name || !addForm.price) { toast.error("שם ומחיר הם שדות חובה"); return; }
    createProduct.mutate({
      name: addForm.name,
      description: addForm.description || undefined,
      price: addForm.price,
      imageUrl: addForm.imageUrl || undefined,
      categoryId: addForm.categoryId ? parseInt(addForm.categoryId) : undefined,
      stock: parseInt(addForm.stock) || 0,
      isActive: addForm.isActive,
      isFeatured: addForm.isFeatured,
    });
  };

  const handleUpdate = () => {
    if (!editProduct) return;
    updateProduct.mutate({
      id: editProduct.id,
      data: {
        name: editProduct.form.name,
        description: editProduct.form.description || undefined,
        price: editProduct.form.price,
        imageUrl: editProduct.form.imageUrl || undefined,
        categoryId: editProduct.form.categoryId ? parseInt(editProduct.form.categoryId) : undefined,
        stock: parseInt(editProduct.form.stock) || 0,
        isActive: editProduct.form.isActive,
        isFeatured: editProduct.form.isFeatured,
      },
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">מוצרים</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{products?.length ?? 0} מוצרים בסך הכל</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          הוסף מוצר
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}
        </div>
      ) : !products || products.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-border rounded-xl">
          <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">אין מוצרים עדיין</p>
          <Button variant="outline" className="mt-4 gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" />
            הוסף מוצר ראשון
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
            >
              {/* Image */}
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-muted-foreground/40" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground text-sm truncate">{product.name}</p>
                  {product.isFeatured && <Badge variant="secondary" className="text-xs gap-1 shrink-0"><Star className="w-2.5 h-2.5" />מומלץ</Badge>}
                  {!product.isActive && <Badge variant="outline" className="text-xs gap-1 shrink-0 text-muted-foreground"><EyeOff className="w-2.5 h-2.5" />מוסתר</Badge>}
                </div>
                <p className="text-sm font-bold text-foreground mt-0.5">₪{parseFloat(product.price).toFixed(2)}</p>
              </div>

              {/* Stock */}
              <div className="shrink-0 flex items-center gap-2">
                {stockEdit?.id === product.id ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min="0"
                      value={stockEdit.value}
                      onChange={(e) => setStockEdit({ id: product.id, value: e.target.value })}
                      className="w-20 h-8 text-sm text-center"
                    />
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => updateStock.mutate({ id: product.id, stock: parseInt(stockEdit.value) || 0 })}>
                      <Save className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setStockEdit(null)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <button onClick={() => setStockEdit({ id: product.id, value: String(product.stock) })} className="hover:opacity-70 transition-opacity">
                    <StockBadge stock={product.stock} />
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setEditProduct({
                    id: product.id,
                    form: {
                      name: product.name,
                      description: product.description ?? "",
                      price: product.price,
                      imageUrl: product.imageUrl ?? "",
                      categoryId: product.categoryId ? String(product.categoryId) : "",
                      stock: String(product.stock),
                      isActive: product.isActive,
                      isFeatured: product.isFeatured,
                    },
                  })}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteId(product.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Product Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>הוספת מוצר חדש</DialogTitle>
          </DialogHeader>
          <ProductFormFields form={addForm} setForm={setAddForm} categories={categories ?? []} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>ביטול</Button>
            <Button onClick={handleCreate} disabled={createProduct.isPending} className="gap-2">
              <Plus className="w-4 h-4" />
              הוסף מוצר
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={!!editProduct} onOpenChange={(o) => !o && setEditProduct(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת מוצר</DialogTitle>
          </DialogHeader>
          {editProduct && (
            <ProductFormFields
              form={editProduct.form}
              setForm={(f) => setEditProduct({ ...editProduct, form: f })}
              categories={categories ?? []}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProduct(null)}>ביטול</Button>
            <Button onClick={handleUpdate} disabled={updateProduct.isPending} className="gap-2">
              <Save className="w-4 h-4" />
              שמור שינויים
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              מחיקת מוצר
            </AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו לא ניתנת לביטול. המוצר יימחק לצמיתות.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteProduct.mutate({ id: deleteId })}
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Product Form Fields ──────────────────────────────────────────────────────

function ProductFormFields({
  form, setForm, categories
}: {
  form: ProductForm;
  setForm: (f: ProductForm) => void;
  categories: { id: number; name: string }[];
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label>שם המוצר *</Label>
          <Input placeholder="שם המוצר" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>מחיר (₪) *</Label>
          <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>מלאי</Label>
          <Input type="number" min="0" placeholder="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>קטגוריה</Label>
          <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
            <SelectTrigger>
              <SelectValue placeholder="בחר קטגוריה" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>תיאור</Label>
          <Textarea placeholder="תיאור המוצר..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>כתובת תמונה (URL)</Label>
          <Input placeholder="https://..." value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        </div>
        <div className="flex items-center justify-between col-span-2 bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <Label className="cursor-pointer">פעיל (מוצג בחנות)</Label>
          </div>
          <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
        </div>
        <div className="flex items-center justify-between col-span-2 bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-muted-foreground" />
            <Label className="cursor-pointer">מוצר מומלץ</Label>
          </div>
          <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm({ ...form, isFeatured: v })} />
        </div>
      </div>
    </div>
  );
}

// ─── Categories Tab ───────────────────────────────────────────────────────────

function CategoriesTab() {
  const utils = trpc.useUtils();
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<CategoryForm>(emptyCategoryForm);
  const [editCat, setEditCat] = useState<null | { id: number; form: CategoryForm }>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: categories, isLoading } = trpc.categories.list.useQuery();

  const createCat = trpc.categories.create.useMutation({
    onSuccess: () => { utils.categories.list.invalidate(); setAddOpen(false); setAddForm(emptyCategoryForm); toast.success("הקטגוריה נוצרה!"); },
    onError: (e) => toast.error(e.message),
  });

  const updateCat = trpc.categories.update.useMutation({
    onSuccess: () => { utils.categories.list.invalidate(); setEditCat(null); toast.success("הקטגוריה עודכנה!"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteCat = trpc.categories.delete.useMutation({
    onSuccess: () => { utils.categories.list.invalidate(); setDeleteId(null); toast.success("הקטגוריה נמחקה"); },
    onError: (e) => toast.error(e.message),
  });

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">קטגוריות</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{categories?.length ?? 0} קטגוריות</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          הוסף קטגוריה
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}
        </div>
      ) : !categories || categories.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-border rounded-xl">
          <Tag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">אין קטגוריות עדיין</p>
          <Button variant="outline" className="mt-4 gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" />
            הוסף קטגוריה ראשונה
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <motion.div
              key={cat.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Tag className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{cat.name}</p>
                <p className="text-xs text-muted-foreground">{cat.slug}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setEditCat({
                    id: cat.id,
                    form: { name: cat.name, slug: cat.slug, description: cat.description ?? "", imageUrl: cat.imageUrl ?? "", sortOrder: String(cat.sortOrder) },
                  })}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteId(cat.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Category Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>הוספת קטגוריה</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>שם הקטגוריה *</Label>
              <Input placeholder="שם" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value, slug: autoSlug(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Slug (כתובת URL)</Label>
              <Input placeholder="category-name" value={addForm.slug} onChange={(e) => setAddForm({ ...addForm, slug: e.target.value })} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label>תיאור</Label>
              <Textarea placeholder="תיאור הקטגוריה..." value={addForm.description} onChange={(e) => setAddForm({ ...addForm, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>כתובת תמונה (URL)</Label>
              <Input placeholder="https://..." value={addForm.imageUrl} onChange={(e) => setAddForm({ ...addForm, imageUrl: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>סדר תצוגה</Label>
              <Input type="number" min="0" value={addForm.sortOrder} onChange={(e) => setAddForm({ ...addForm, sortOrder: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>ביטול</Button>
            <Button onClick={() => createCat.mutate({ name: addForm.name, slug: addForm.slug, description: addForm.description || undefined, imageUrl: addForm.imageUrl || undefined, sortOrder: parseInt(addForm.sortOrder) || 0 })} disabled={createCat.isPending} className="gap-2">
              <Plus className="w-4 h-4" />הוסף
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editCat} onOpenChange={(o) => !o && setEditCat(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>עריכת קטגוריה</DialogTitle></DialogHeader>
          {editCat && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>שם *</Label>
                <Input value={editCat.form.name} onChange={(e) => setEditCat({ ...editCat, form: { ...editCat.form, name: e.target.value } })} />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input value={editCat.form.slug} onChange={(e) => setEditCat({ ...editCat, form: { ...editCat.form, slug: e.target.value } })} dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label>תיאור</Label>
                <Textarea value={editCat.form.description} onChange={(e) => setEditCat({ ...editCat, form: { ...editCat.form, description: e.target.value } })} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>כתובת תמונה</Label>
                <Input value={editCat.form.imageUrl} onChange={(e) => setEditCat({ ...editCat, form: { ...editCat.form, imageUrl: e.target.value } })} />
              </div>
              <div className="space-y-1.5">
                <Label>סדר תצוגה</Label>
                <Input type="number" min="0" value={editCat.form.sortOrder} onChange={(e) => setEditCat({ ...editCat, form: { ...editCat.form, sortOrder: e.target.value } })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCat(null)}>ביטול</Button>
            <Button onClick={() => editCat && updateCat.mutate({ id: editCat.id, data: { name: editCat.form.name, slug: editCat.form.slug, description: editCat.form.description || undefined, imageUrl: editCat.form.imageUrl || undefined, sortOrder: parseInt(editCat.form.sortOrder) || 0 } })} disabled={updateCat.isPending} className="gap-2">
              <Save className="w-4 h-4" />שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              מחיקת קטגוריה
            </AlertDialogTitle>
            <AlertDialogDescription>פעולה זו לא ניתנת לביטול.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteId && deleteCat.mutate({ id: deleteId })}>מחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────

function StatsTab() {
  const { data: products } = trpc.products.list.useQuery({ adminView: true });
  const { data: categories } = trpc.categories.list.useQuery();

  const totalProducts = products?.length ?? 0;
  const activeProducts = products?.filter((p) => p.isActive).length ?? 0;
  const outOfStock = products?.filter((p) => p.stock === 0).length ?? 0;
  const lowStock = products?.filter((p) => p.stock > 0 && p.stock <= 5).length ?? 0;
  const totalCategories = categories?.length ?? 0;

  const stats = [
    { label: "סה\"כ מוצרים", value: totalProducts, icon: Package, color: "text-blue-600 bg-blue-50" },
    { label: "מוצרים פעילים", value: activeProducts, icon: Eye, color: "text-emerald-600 bg-emerald-50" },
    { label: "אזל המלאי", value: outOfStock, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
    { label: "מלאי נמוך", value: lowStock, icon: BarChart3, color: "text-amber-600 bg-amber-50" },
    { label: "קטגוריות", value: totalCategories, icon: Tag, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-6">סקירה כללית</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Low stock warning */}
      {(outOfStock > 0 || lowStock > 0) && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <p className="font-semibold text-amber-800 text-sm">התראות מלאי</p>
          </div>
          <div className="space-y-2">
            {products?.filter((p) => p.stock <= 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-amber-800">{p.name}</span>
                <StockBadge stock={p.stock} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="container py-12">
        <div className="h-8 skeleton rounded w-48 mb-8" />
        <div className="h-64 skeleton rounded-xl" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="container py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center mb-5">
          <AlertTriangle className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-3">גישה אסורה</h2>
        <p className="text-muted-foreground mb-6">אין לך הרשאות לצפות בדף זה.</p>
        <Link href="/">
          <Button className="gap-2">
            <ArrowRight className="w-4 h-4" />
            חזרה לדף הבית
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <ArrowRight className="w-4 h-4" />
              חזרה לחנות
            </span>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-foreground">פאנל ניהול</h1>
          <p className="text-muted-foreground mt-1">ניהול מוצרים, קטגוריות ומלאי</p>
        </div>

        <Tabs defaultValue="stats" dir="rtl">
          <TabsList className="mb-6">
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              סקירה
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" />
              מוצרים
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Tag className="w-4 h-4" />
              קטגוריות
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            <StatsTab />
          </TabsContent>
          <TabsContent value="products">
            <ProductsTab />
          </TabsContent>
          <TabsContent value="categories">
            <CategoriesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
