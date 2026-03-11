import type { Metadata } from "next"
import { CheckCircle2, CircleDashed } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "System Audit",
  description: "Comprehensive product readiness checklist for Superstat.",
}

const checklist = [
  { module: "Authentication", item: "Cookie-based club session routing", status: "done" },
  { module: "Authentication", item: "Protected route middleware checks", status: "done" },
  { module: "Players", item: "Modal-based add/update/delete player workflows", status: "done" },
  { module: "Players", item: "Player insights: trend + team-average comparison", status: "done" },
  { module: "Players", item: "Player tagging and classification", status: "done" },
  { module: "Players", item: "Historical metric logs and activity timeline", status: "done" },
  { module: "Club Profile", item: "Modal-based edit profile + logo upload flow", status: "done" },
  { module: "Event Types", item: "Modal-based add/update/delete workflows", status: "done" },
  { module: "Validation", item: "Zod + react-hook-form validation for core forms", status: "done" },
  { module: "Feedback", item: "Toast notifications for success and error states", status: "done" },
  { module: "Database", item: "Unified SQL migration + RLS policy script", status: "done" },
  { module: "Accessibility", item: "Dialog titles/descriptions + semantic controls", status: "done" },
  { module: "Testing", item: "Lint and typecheck verification", status: "in_progress" },
]

export default function AuditPage() {
  const doneCount = checklist.filter((entry) => entry.status === "done").length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Implementation Audit</h1>
          <p className="text-sm text-muted-foreground">
            Feature coverage and readiness validation across modules.
          </p>
        </div>
        <Badge variant="secondary">
          {doneCount}/{checklist.length} complete
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {checklist.map((entry) => (
            <div
              key={`${entry.module}-${entry.item}`}
              className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium">{entry.item}</span>
                <span className="text-[11px] text-muted-foreground">{entry.module}</span>
              </div>
              <div className="flex items-center gap-2">
                {entry.status === "done" ? (
                  <>
                    <CheckCircle2 className="size-4 text-primary" />
                    <span className="text-xs text-primary">Done</span>
                  </>
                ) : (
                  <>
                    <CircleDashed className="size-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">In Progress</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
