import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function LifelineEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  useEffect(() => {
    document.title = isNew ? "Create Lifeline" : "Edit Lifeline";
  }, [isNew]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? "New Lifeline" : "Edit Lifeline"}
          </h1>
          <p className="text-muted-foreground">Basic editor placeholder</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
        </div>
      </header>

      <section className="rounded-lg border p-6 bg-card">
        <p className="text-muted-foreground">
          This editor is not implemented yet. You can add fields later. For now, this page exists to avoid 404s and let you proceed.
        </p>
      </section>
    </div>
  );
}
