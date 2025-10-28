import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { importMultipleImages } from "@/utils/importImages";

export default function TestImageImport() {
  const [isImporting, setIsImporting] = useState(false);

  const testImages = [
    {
      entryId: "4968c628-8e86-4264-a95b-890bfff5f2c1",
      imageUrl: "https://static.wikia.nocookie.net/madmen/images/d/db/Season4-lane-potrait.jpg/revision/latest",
      altText: "Lane Pryce arrives from London",
      orderIndex: 0,
      position: { x: 50, y: 50, scale: 1.0 }
    },
    {
      entryId: "94286387-9a80-4aee-a6ec-d8bcd6582bbe",
      imageUrl: "https://i.ebayimg.com/images/g/4UEAAOSwrklU-b9b/s-l1600.webp",
      altText: "Lane Pryce with wife Rebecca",
      orderIndex: 0,
      position: { x: 50, y: 50, scale: 1.0 }
    }
  ];

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const result = await importMultipleImages(testImages);
      toast.success(`Successfully imported ${result.successful} images!`);
      console.log('Import results:', result);
    } catch (error) {
      toast.error("Failed to import images");
      console.error(error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Test Image Import for Lane Pryce</h1>
      <p className="mb-4">This will import 2 test images for Lane Pryce's lifeline.</p>
      <Button onClick={handleImport} disabled={isImporting}>
        {isImporting ? "Importing..." : "Import Test Images"}
      </Button>
    </div>
  );
}
