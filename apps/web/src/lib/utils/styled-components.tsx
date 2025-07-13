
import { cn } from '@/lib/utils';

interface StyledComponentProps {
  className?: string;
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  [key: string]: any;
}

export const StyledComponent = function StyledComponent({
  className,
  children,
  as: Component = 'div',
  ...props
}: StyledComponentProps) {
  return (
    <Component className={cn(className)} {...props}>
      {children}
    </Component>
  );
}

// Optimized CSS class builder
export function buildOptimizedClassName(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Theme-aware styled component
export function createThemeComponent(baseClasses: string) {
  return function ThemedComponent({ 
    className, 
    children, 
    ...props 
  }: StyledComponentProps) {
    return (
      <StyledComponent 
        className={cn(baseClasses, className)} 
        {...props}
      >
        {children}
      </StyledComponent>
    );
  };
}