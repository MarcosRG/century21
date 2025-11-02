import { MapPin, Bed, Bath, Ruler } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Property {
  id: string;
  title: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  type: string;
  status: string;
  address: string;
  images: string[];
}

interface PreviewListProps {
  properties: Property[];
}

export default function PreviewList({ properties }: PreviewListProps) {
  if (properties.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-slate-600">No properties to preview</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {/* Image Preview */}
            <div className="relative h-40 bg-slate-200">
              {property.images.length > 0 ? (
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23e2e8f0' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='24' fill='%2394a3b8' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-slate-100">
                  <span className="text-xs text-slate-500">No image available</span>
                </div>
              )}
              <Badge className="absolute right-2 top-2 bg-emerald-600">
                {property.status}
              </Badge>
              {property.images.length > 1 && (
                <Badge variant="secondary" className="absolute left-2 top-2">
                  +{property.images.length - 1} more
                </Badge>
              )}
            </div>

            <CardContent className="space-y-3 pt-4">
              {/* Title */}
              <div>
                <h3 className="line-clamp-2 font-semibold text-slate-900">
                  {property.title}
                </h3>
              </div>

              {/* Price */}
              <div className="text-lg font-bold text-emerald-600">
                ${property.price}
              </div>

              {/* Address */}
              <div className="flex gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0 text-slate-400" />
                <p className="line-clamp-1 text-xs text-slate-600">
                  {property.address}
                </p>
              </div>

              {/* Property Details */}
              <div className="flex gap-4 border-t border-slate-200 pt-3">
                {property.bedrooms && (
                  <div className="flex items-center gap-1">
                    <Bed className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-700">
                      {property.bedrooms} bed
                    </span>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex items-center gap-1">
                    <Bath className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-700">
                      {property.bathrooms} bath
                    </span>
                  </div>
                )}
                {property.area && (
                  <div className="flex items-center gap-1">
                    <Ruler className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-700">
                      {property.area} m²
                    </span>
                  </div>
                )}
              </div>

              {/* Type Badge */}
              <div>
                <Badge variant="outline" className="text-xs">
                  {property.type}
                </Badge>
              </div>

              {/* Reference ID */}
              <p className="text-xs text-slate-500">
                ID: {property.id}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
