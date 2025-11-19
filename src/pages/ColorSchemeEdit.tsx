import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ColorSchemeEditorFull, type ColorScheme } from "@/components/admin/ColorSchemeEditorFull";
import { useToast } from "@/hooks/use-toast";

export default function ColorSchemeEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isNew = id === 'new';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [colors, setColors] = useState<ColorScheme | null>(null);

  // Fetch existing color scheme if editing
  const { data: colorScheme, isLoading } = useQuery({
    queryKey: ['colorScheme', id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from('color_schemes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  const handleColorSchemeChange = (newColors: ColorScheme) => {
    setColors(newColors);
  };

  // Initialize form when data loads
  useEffect(() => {
    if (colorScheme) {
      setName(colorScheme.name || '');
      setDescription(colorScheme.description || '');
      setColors(colorScheme as ColorScheme);
    }
  }, [colorScheme]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!colors) throw new Error('No colors to save');

      const schemeData = {
        name,
        description,
        ...colors,
      };

      if (isNew) {
        const { data, error } = await supabase
          .from('color_schemes')
          .insert(schemeData)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('color_schemes')
          .update(schemeData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['colorSchemes'] });
      queryClient.invalidateQueries({ queryKey: ['colorScheme', id] });
      
      toast({
        title: "Success",
        description: `Color scheme ${isNew ? 'created' : 'updated'} successfully`,
      });

      if (isNew && data) {
        navigate(`/admin/color-schemes/${data.id}`);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save color scheme",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/color-schemes')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/color-schemes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">
          {isNew ? 'Create New Color Scheme' : 'Edit Color Scheme'}
        </h1>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Name and description for this color scheme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Game of Thrones"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the theme or purpose of this color scheme"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Color Scheme Editor */}
        <ColorSchemeEditorFull
          initialColors={colorScheme || undefined}
          onChange={handleColorSchemeChange}
        />

        {/* Save Button */}
        <div className="flex gap-4">
          <Button
            size="lg"
            onClick={() => saveMutation.mutate()}
            disabled={!name || !colors || saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving...' : isNew ? 'Create Color Scheme' : 'Save Changes'}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/admin/color-schemes')}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
