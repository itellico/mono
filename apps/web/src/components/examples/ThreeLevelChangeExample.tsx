import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useThreeLevelChange } from '@/hooks/useThreeLevelChange';
import { 
  ChangeIndicator, 
  ChangeHistory,
  ConflictResolver,
  useChangeContext 
} from '@/components/changes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, History, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  isActive: boolean;
  updatedAt: string;
}

export function ThreeLevelChangeExample({ productId }: { productId: string }) {
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [showHistory, setShowHistory] = useState(false);
  const { getEntityConflicts } = useChangeContext();
  
  // Fetch product data
  const { data: product, isLoading, error, refetch } = useQuery<Product>({
    queryKey: ['products', productId],
    queryFn: () => apiClient.get(`/v1/products/${productId}`),
  });

  // Three-level change mutation
  const { mutate, isLoading: isSaving } = useThreeLevelChange<Product>({
    entityType: 'products',
    entityId: productId,
    optimisticUpdate: (old, changes) => ({ ...old, ...changes }),
    requireApproval: (formData.price || 0) < (product?.price || 0) * 0.5, // Require approval for >50% price reduction
    onConflict: (conflicts) => {
      // Conflicts are handled by the global provider
      console.log('Conflicts detected:', conflicts);
    },
  });

  // Initialize form when product loads
  React.useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: product.category,
        isActive: product.isActive,
      });
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) return;

    // Include version for conflict detection
    const changes = {
      ...formData,
      _version: product.updatedAt,
    };

    mutate(changes);
  };

  const handleFieldChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const hasChanges = product && Object.keys(formData).some(
    key => formData[key as keyof Product] !== product[key as keyof Product]
  );

  const conflicts = getEntityConflicts('products', productId);

  if (isLoading) {
    return <div>Loading product...</div>;
  }

  if (error || !product) {
    return <div>Error loading product</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Edit Product</CardTitle>
              <CardDescription>
                Changes are saved with three-level tracking
              </CardDescription>
            </div>
            <ChangeIndicator 
              entityType="products" 
              entityId={productId} 
              showDetails 
            />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="Enter product name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category || ''}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  placeholder="Enter category"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Enter product description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => handleFieldChange('price', parseFloat(e.target.value))}
                  placeholder="0.00"
                />
                {formData.price && product.price && formData.price < product.price * 0.5 && (
                  <p className="text-xs text-amber-600">
                    Price reduction &gt;50% will require approval
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock || ''}
                  onChange={(e) => handleFieldChange('stock', parseInt(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={!hasChanges || isSaving}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => refetch()}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowHistory(!showHistory)}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                {showHistory ? 'Hide' : 'Show'} History
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {showHistory && (
        <ChangeHistory
          entityType="products"
          entityId={productId}
          showRollback={true}
        />
      )}

      {/* Example of showing conflicts inline */}
      {conflicts.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Conflicts Detected</CardTitle>
            <CardDescription>
              Your changes conflict with recent updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Another user has made changes to this product. Please resolve the conflicts before proceeding.
            </p>
            <Button variant="destructive" size="sm">
              View Conflicts
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Example usage with provider
export function ProductEditorWithProvider({ productId }: { productId: string }) {
  return (
    <Tabs defaultValue="editor" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="editor">Editor</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      
      <TabsContent value="editor" className="space-y-4">
        <ThreeLevelChangeExample productId={productId} />
      </TabsContent>
      
      <TabsContent value="history">
        <ChangeHistory
          entityType="products"
          entityId={productId}
          showRollback={true}
          className="w-full"
        />
      </TabsContent>
    </Tabs>
  );
}