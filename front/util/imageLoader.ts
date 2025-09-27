import { ImageLoaderProps } from "next/image";

export default function imageLoader ({ src, width, quality }: ImageLoaderProps) {
  return process.env.NEXT_PUBLIC_IMAGE_URL + `${src}?w=${width}&q=${quality || 75}`
}
 