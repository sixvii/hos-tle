import { Building2 } from "lucide-react";
import PropertyVideoPreview from "@/components/PropertyVideoPreview";

export default function PropertyMediaCover({
  name,
  photos,
  videos,
}: {
  name: string;
  photos?: string[];
  videos?: string[];
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-black/5">
      {photos?.[0] ? (
        <img
          src={photos[0]}
          alt={`${name} property`}
          className="h-full w-full object-cover"
        />
      ) : videos?.[0] ? (
        <PropertyVideoPreview src={videos[0]} label={`${name} property video`} />
      ) : (
        <div className="flex h-full items-center justify-center text-black/30">
          <Building2 className="h-8 w-8" />
        </div>
      )}
    </div>
  );
}