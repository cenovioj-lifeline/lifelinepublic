import { Profile } from "@/types/profile";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ruler, Zap, Star } from "lucide-react";

interface ProfilePhysicalCharacteristicsProps {
  profile: Profile;
}

export function ProfilePhysicalCharacteristics({ profile }: ProfilePhysicalCharacteristicsProps) {
  const physical = profile.extended_data?.physical;
  
  if (!physical) return null;

  const attributes = [];

  if (physical.height) {
    attributes.push({ label: "Height", value: physical.height });
  }
  if (physical.weight) {
    attributes.push({ label: "Weight", value: physical.weight });
  }
  if (physical.build) {
    attributes.push({ label: "Build", value: physical.build });
  }
  if (physical.condition) {
    attributes.push({ label: "Condition", value: physical.condition });
  }

  const hasAttributes = attributes.length > 0;
  const hasFeatures = physical.distinguishing_features && physical.distinguishing_features.length > 0;
  const hasSignatureItems = physical.signature_items && physical.signature_items.length > 0;
  const hasPowers = physical.powers_abilities && physical.powers_abilities.length > 0;

  if (!hasAttributes && !hasFeatures && !hasSignatureItems && !hasPowers) {
    return null;
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Physical Characteristics</h2>
      
      <div className="space-y-6">
        {hasAttributes && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {attributes.map((attr, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">
                  {attr.label}
                </div>
                <div className="font-medium">{attr.value}</div>
              </div>
            ))}
          </div>
        )}

        {hasFeatures && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              <h3 className="font-semibold">Distinguishing Features</h3>
            </div>
            <ul className="space-y-1 ml-6">
              {physical.distinguishing_features!.map((feature, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  • {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasSignatureItems && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <h3 className="font-semibold">Signature Items</h3>
            </div>
            <div className="flex flex-wrap gap-2 ml-6">
              {physical.signature_items!.map((item, index) => (
                <Badge key={index} variant="secondary">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {hasPowers && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <h3 className="font-semibold">Powers & Abilities</h3>
            </div>
            <ul className="space-y-1 ml-6">
              {physical.powers_abilities!.map((power, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  • {power}
                </li>
              ))}
            </ul>
          </div>
        )}

        {physical.why_notable && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm italic">{physical.why_notable}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
