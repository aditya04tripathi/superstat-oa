"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const PlayerChartsLazy = dynamic(() => import("./PlayerCharts"), {
  ssr: false,
  loading: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-70 w-full" />
      <Skeleton className="h-70 w-full" />
      <Skeleton className="h-75 w-full md:col-span-2" />
    </div>
  ),
})

export default PlayerChartsLazy
