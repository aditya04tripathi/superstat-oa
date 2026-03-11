import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
  return (
    <div className="animate-in fade-in flex h-screen w-full items-center justify-center bg-background/50 backdrop-blur-sm duration-500">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="size-8 text-primary" />
        <p className="animate-pulse text-sm font-medium text-muted-foreground">
          Loading your statistics...
        </p>
      </div>
    </div>
  )
}
