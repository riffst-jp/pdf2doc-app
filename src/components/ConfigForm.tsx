import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronLeft,
  ChevronsDownUp,
  Info,
  RectangleHorizontal,
  RectangleVertical,
} from "lucide-react"
import { useState } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DocumentOrientation, GeneralConfig, PagePosition } from "@/types"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible"
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

interface ConfigFormProps {
  settings: GeneralConfig
  onSettingsChange: (updates: Partial<GeneralConfig>) => void
  ghostscriptAvailable?: boolean | null
}

function FormGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible className="space-y-1" open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between text-xs font-medium text-gray-700">
        <span>{title}</span>
        <ChevronLeft
          className={`h-4 w-4 transition-transform duration-200 ${open ? "-rotate-90" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={`overflow-hidden transition-all duration-100 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down`}
      >
        <div className="mt-2 space-y-3 rounded-md border bg-white p-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function ConfigForm({ settings, onSettingsChange, ghostscriptAvailable }: ConfigFormProps) {
  const orientation: Record<DocumentOrientation, React.ReactNode> = {
    auto: <span className="text-xs text-gray-500">auto</span>,
    portrait: <RectangleVertical />,
    landscape: <RectangleHorizontal />,
  } as const

  const horizontalAligns: Record<PagePosition["horizontal"], React.ReactNode> = {
    left: <AlignLeft />,
    center: <AlignCenter />,
    right: <AlignRight />,
  } as const

  const verticalAligns: Record<PagePosition["vertical"], React.ReactNode> = {
    top: <ArrowUpToLine />,
    center: <ChevronsDownUp />,
    bottom: <ArrowDownToLine />,
  } as const

  return (
    <div className="flex flex-col space-y-4">
      {/* ファイル処理設定 */}
      <FormGroup title="ファイル処理設定">
        <div className="flex items-center justify-between">
          <Label htmlFor="merge-pages" className="w-full text-sm font-medium text-gray-500">
            ファイルをマージ
          </Label>
          <Switch
            id="merge-pages"
            checked={settings.mergePages}
            onCheckedChange={checked => onSettingsChange({ mergePages: checked })}
            disabled={true}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="add-blank-page" className="w-full text-sm font-medium">
            セクション間に空白ページを追加
          </Label>
          <Switch
            id="add-blank-page"
            checked={settings.addBlankPage}
            onCheckedChange={checked => onSettingsChange({ addBlankPage: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label
            htmlFor="flatten-annotations"
            className={`w-full text-sm font-medium ${ghostscriptAvailable === false ? "text-gray-400" : ""}`}
          >
            既存の注釈をフラット化
            {ghostscriptAvailable === false && (
              <Tooltip>
                <TooltipTrigger>
                  <Info className="size-4" color="red" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ghostscriptが必要です。</p>
                </TooltipContent>
              </Tooltip>
            )}
          </Label>
          <Switch
            id="flatten-annotations"
            checked={settings.flattenAnnotations}
            disabled={ghostscriptAvailable === false}
            onCheckedChange={checked => onSettingsChange({ flattenAnnotations: checked })}
          />
        </div>
      </FormGroup>

      {/* レイアウト設定 */}
      <FormGroup title="レイアウト設定">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">向き</Label>
          <ToggleGroup
            type="single"
            value={settings.orientation}
            onValueChange={value =>
              onSettingsChange({
                orientation: value as DocumentOrientation,
              })
            }
            className="h-7 rounded-md border border-gray-200"
          >
            {Object.keys(orientation).map(position => (
              <ToggleGroupItem key={position} value={position} className="h-7 w-12 text-xs">
                {orientation[position as keyof typeof orientation]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </FormGroup>

      {/* ページ番号設定 */}
      <FormGroup title="ページ番号設定">
        <div className="flex items-center justify-between">
          <Label htmlFor="offset" className="text-sm font-medium">
            フォントサイズ
          </Label>
          <Input
            id="font-size"
            value={settings.fontSize}
            onChange={e => onSettingsChange({ fontSize: Number(e.target.value) })}
            placeholder="10"
            className="h-7 w-36.5 rounded-sm px-1 text-right text-sm shadow-none"
          />
        </div>
        <div className="flex-col items-center justify-between">
          <div className="flex items-center justify-between pb-1">
            <Label htmlFor="prefix-format" className="w-1/2 text-sm font-medium">
              フォーマット
            </Label>
            <Input
              id="prefix-format"
              value={settings.prefixFormat}
              onChange={e => onSettingsChange({ prefixFormat: e.target.value })}
              placeholder="{section}-{page}"
              className="h-7 w-1/2 rounded-sm px-1 text-right text-sm shadow-none"
            />
          </div>
          <div className="flex items-center justify-end text-xs text-gray-500">
            <span className="pr-2">※</span>
            <span className="flex h-5 items-center rounded-sm bg-gray-100 px-1 py-1">
              {"{section}"}
            </span>
            <span className="pr-2">セクション番号</span>
            <span className="flex h-5 items-center rounded-sm bg-gray-100 px-1 py-1">
              {"{page}"}
            </span>
            <span>ページ番号</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">垂直位置</Label>
          <ToggleGroup
            type="single"
            value={settings.pagePosition.vertical}
            onValueChange={value =>
              onSettingsChange({
                pagePosition: {
                  ...settings.pagePosition,
                  vertical: value as PagePosition["vertical"],
                },
              })
            }
            className="h-7 rounded-md border border-gray-200"
          >
            {Object.keys(verticalAligns).map(position => (
              <ToggleGroupItem key={position} value={position} className="h-7 w-12 text-xs">
                {verticalAligns[position as keyof typeof verticalAligns]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">水平位置</Label>
          <ToggleGroup
            type="single"
            value={settings.pagePosition.horizontal}
            onValueChange={value =>
              onSettingsChange({
                pagePosition: {
                  ...settings.pagePosition,
                  horizontal: value as PagePosition["horizontal"],
                },
              })
            }
            className="h-7 rounded-md border border-gray-200"
          >
            {Object.keys(horizontalAligns).map(position => (
              <ToggleGroupItem key={position} value={position} className="h-7 w-12 text-xs">
                {horizontalAligns[position as keyof typeof horizontalAligns]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="offset" className="text-sm font-medium">
            マージン
          </Label>
          <Input
            id="offset"
            value={settings.margin}
            onChange={e => onSettingsChange({ margin: Number(e.target.value) })}
            placeholder="10"
            className="h-7 w-36.5 rounded-sm px-1 text-right text-sm shadow-none"
          />
        </div>
      </FormGroup>
    </div>
  )
}
