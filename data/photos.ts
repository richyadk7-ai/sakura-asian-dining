import manifest from "@/data/photo-manifest.json";
import type { RestaurantPhoto } from "@/types";

export const photos = manifest as RestaurantPhoto[];
export const authorizedPhotos = photos.filter((photo) => photo.authorized && !photo.excluded);

export function getPhotoById(id?: string) {
  return id ? authorizedPhotos.find((photo) => photo.id === id) : undefined;
}
