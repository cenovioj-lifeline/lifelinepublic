import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowUpDown, Save } from "lucide-react";

export default function ElectionCategoryOrder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [orderValues, setOrderValues] = useState<Record<string, number>>({});

  // Fetch all unique categories from election_results
  const { data: categories, isLoading } = useQuery({
    queryKey: ["election-categories"],
    queryFn: async () => {
      // Get all unique categories
      const { data: results, error } = await supabase
        .from("election_results")
        .select("category");
      
      if (error) throw error;
      
      const uniqueCategories = [...new Set(results.map(r => r.category))];
      
      // Get existing ordering
      const { data: ordering } = await supabase
        .from("election_category_order")
        .select("*");
      
      // Create a map of category to order
      const orderMap: Record<string, number> = {};
      ordering?.forEach(o => {
        orderMap[o.category] = o.display_order;
      });
      
      // Set initial order values
      const initialOrders: Record<string, number> = {};
      uniqueCategories.forEach(cat => {
        initialOrders[cat] = orderMap[cat] ?? -1;
      });
      setOrderValues(initialOrders);
      
      return uniqueCategories.sort();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Upsert all categories with their orders
      const updates = Object.entries(orderValues).map(([category, display_order]) => ({
        category,
        display_order,
      }));
      
      const { error } = await supabase
        .from("election_category_order")
        .upsert(updates, { onConflict: "category" });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category ordering saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["election-categories"] });
      queryClient.invalidateQueries({ queryKey: ["election-category-order"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOrderChange = (category: string, value: string) => {
    const numValue = value === "" ? -1 : parseInt(value);
    setOrderValues(prev => ({
      ...prev,
      [category]: isNaN(numValue) ? -1 : numValue,
    }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading categories...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Election Category Ordering</h1>
          <p className="text-muted-foreground mt-2">
            Set the display order for election result categories. Higher numbers appear first. Use -1 for unassigned.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Category Display Order
          </CardTitle>
          <CardDescription>
            Categories are sorted by order (highest first). Categories with -1 will appear last in alphabetical order.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!categories || categories.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No categories found. Create some election results first.
            </p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <div key={category} className="space-y-2">
                    <Label htmlFor={`order-${category}`} className="font-semibold">
                      {category}
                    </Label>
                    <Input
                      id={`order-${category}`}
                      type="number"
                      value={orderValues[category] ?? -1}
                      onChange={(e) => handleOrderChange(category, e.target.value)}
                      placeholder="-1"
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  size="lg"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saveMutation.isPending ? "Saving..." : "Save Order"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
