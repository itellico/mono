import Image from 'next/image';


interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
}

export const OptimizedImage = function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 85,
  ...props
}) {
  const imageProps = {
    src,
    alt,
    className,
    priority,
    quality,
    sizes: fill ? sizes : undefined,
    ...props
  };

  if (fill) {
    return <Image {...imageProps} fill />;
  }

  if (width && height) {
    return <Image {...imageProps} width={width} height={height} />;
  }

  // Fallback for cases where dimensions aren't specified
  return (
    <Image
      {...imageProps}
      width={800}
      height={600}
      style={{ width: 'auto', height: 'auto' }}
    />
  );
}

// Lazy image component
export const LazyImage = function LazyImage(props: OptimizedImageProps) {
  return <OptimizedImage {...props} loading="lazy" />;
}

// Hero image component with priority loading
export const HeroImage = function HeroImage(props: OptimizedImageProps) {
  return <OptimizedImage {...props} priority />;
};