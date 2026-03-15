import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className }: BrandMarkProps): React.JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background text-base font-bold leading-none",
        className
      )}
      aria-hidden="true"
    >
      A
    </span>
  );
}