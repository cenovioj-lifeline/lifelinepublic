import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfileEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/profiles")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? "Create Profile" : "Edit Profile"}
          </h1>
          <p className="text-muted-foreground">
            Profile editing is being rebuilt for the new modular architecture
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            The profile editor is being rebuilt to support the new flexible, modular profile system.
            For now, use the CSV upload feature to import profiles.
          </p>
          <Button onClick={() => navigate("/profiles")}>
            Back to Profiles
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
