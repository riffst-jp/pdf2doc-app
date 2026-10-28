import { Download, RotateCcw } from "lucide-react"

import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { Switch } from "./ui/switch"

export function Toolbar({
  downloadable,
  downloadCallback,
  autoUpdate,
  autoUpdateCallback,
  onRefresh,
}: {
  downloadable: boolean
  downloadCallback: () => void
  autoUpdate: boolean
  autoUpdateCallback: (value: boolean) => void
  onRefresh: () => void
}) {
  return (
    <div id="toolbar" className="flex items-center justify-between gap-4 border-b bg-gray-50 p-4">
      <div className="flex min-w-fit items-center gap-2">
        <Button variant="outline" className="h-9" onClick={onRefresh}>
          <RotateCcw className="size-5" strokeWidth={1.5} />
        </Button>
        <div className="flex items-center gap-2">
          <Label htmlFor="auto-update" className="text-sm">
            自動更新
          </Label>
          <Switch id="auto-update" checked={autoUpdate} onCheckedChange={autoUpdateCallback} />
        </div>
      </div>
      <div className="flex min-w-fit items-center gap-2">
        <Button className="ml-2 h-9" onClick={downloadCallback} disabled={!downloadable}>
          <Download className="size-5" />
          <span className="hidden text-sm sm:flex">保存</span>
        </Button>
      </div>
    </div>
  )
}
