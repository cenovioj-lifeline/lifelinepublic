import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function TestAiImage() {
  const [prompt, setPrompt] = useState("A beautiful sunset over mountains, photorealistic");
  const [imageSize, setImageSize] = useState("default");
  const [aspectRatio, setAspectRatio] = useState("default");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const body: any = { prompt };
      if (imageSize !== "default") body.imageSize = imageSize;
      if (aspectRatio !== "default") body.aspectRatio = aspectRatio;

      console.log("Sending request with body:", body);

      const { data, error: fnError } = await supabase.functions.invoke("generate-ai-image", {
        body,
      });

      if (fnError) {
        setError(fnError.message);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">AI Image Parameter Test</h1>
      <p className="text-muted-foreground mb-6">
        Test page for experimenting with imageSize and aspectRatio parameters.
        Check edge function logs for detailed API request/response info.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="prompt">Prompt</Label>
            <Input
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter image prompt..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Image Size</Label>
              <Select value={imageSize} onValueChange={setImageSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (no param)</SelectItem>
                  <SelectItem value="1K">1K</SelectItem>
                  <SelectItem value="2K">2K</SelectItem>
                  <SelectItem value="4K">4K</SelectItem>
                  <SelectItem value="1024x1024">1024x1024</SelectItem>
                  <SelectItem value="1536x1024">1536x1024</SelectItem>
                  <SelectItem value="1024x1536">1024x1536</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (no param)</SelectItem>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                  <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                  <SelectItem value="4:3">4:3</SelectItem>
                  <SelectItem value="3:4">3:4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={isLoading || !prompt.trim()}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Image
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap">{error}</pre>
          </CardContent>
        </Card>
      )}

      {result && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Generated Image</CardTitle>
            </CardHeader>
            <CardContent>
              {result.imageUrl ? (
                <img
                  src={result.imageUrl}
                  alt="Generated"
                  className="max-w-full h-auto rounded-lg border"
                />
              ) : (
                <p className="text-muted-foreground">No image URL in response</p>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Diagnostics</CardTitle>
            </CardHeader>
            <CardContent>
              {result.diagnostics ? (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">Requested Size:</div>
                  <div>{result.diagnostics.requestedSize || "not sent"}</div>
                  <div className="font-medium">Requested Aspect:</div>
                  <div>{result.diagnostics.requestedAspect || "not sent"}</div>
                  <div className="font-medium">Actual Dimensions:</div>
                  <div>{result.diagnostics.actualDimensions || "unknown"}</div>
                  <div className="font-medium">File Size:</div>
                  <div>{result.diagnostics.fileSizeBytes ? `${result.diagnostics.fileSizeBytes} bytes` : "unknown"}</div>
                  <div className="font-medium">Format:</div>
                  <div>{result.diagnostics.format || "unknown"}</div>
                  <div className="font-medium">Model:</div>
                  <div>{result.diagnostics.model || "unknown"}</div>
                </div>
              ) : (
                <p className="text-muted-foreground">No diagnostics in response</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Full Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
