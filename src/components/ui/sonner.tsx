import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:!bg-[hsl(145_60%_42%)] group-[.toaster]:!text-white group-[.toaster]:!border-[hsl(145_60%_35%)]",
          error:
            "group-[.toaster]:!bg-[hsl(0_72%_50%)] group-[.toaster]:!text-white group-[.toaster]:!border-[hsl(0_72%_42%)]",
          warning:
            "group-[.toaster]:!bg-[hsl(45_92%_50%)] group-[.toaster]:!text-[hsl(30_20%_10%)] group-[.toaster]:!border-[hsl(45_92%_42%)]",
          info:
            "group-[.toaster]:!bg-[hsl(210_100%_50%)] group-[.toaster]:!text-white group-[.toaster]:!border-[hsl(210_100%_42%)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
