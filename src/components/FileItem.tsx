import { ChevronDown, ChevronUp, GripVertical, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { PdfSection } from "@/types"

interface FileItemProps {
  index: number
  sections: PdfSection[]
  draggedIndex: number | null
  dragOverIndex: number | null
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void
  handleDragEnd: () => void
  handleDragOverItem: (e: React.DragEvent<HTMLDivElement>, index: number) => void
  handleDropItem: (e: React.DragEvent<HTMLDivElement>, index: number) => void
  updateSection: (id: string, updates: Partial<PdfSection>) => void
  moveSectionUp: (index: number) => void
  moveSectionDown: (index: number) => void
  removeSection: (id: string) => void
}

export function FileItem({
  index,
  sections,
  draggedIndex,
  dragOverIndex,
  handleDragStart,
  handleDragEnd,
  handleDragOverItem,
  handleDropItem,
  updateSection,
  moveSectionUp,
  moveSectionDown,
  removeSection,
}: FileItemProps) {
  const section = sections[index]

  return (
    <div
      className={`flex items-center gap-2 p-2 transition-all ${index === sections.length - 1 ? "border-b-0" : "border-b"} ${draggedIndex === index ? "opacity-50" : ""} ${dragOverIndex === index ? "border border-blue-500 bg-blue-50" : ""} ${dragOverIndex === sections.length - 1 ? "rounded-b-md" : ""} ${dragOverIndex === 0 ? "rounded-t-md" : ""} `}
      draggable
      onDragStart={e => handleDragStart(e, index)}
      onDragEnd={handleDragEnd}
      onDragOver={e => handleDragOverItem(e, index)}
      onDrop={e => handleDropItem(e, index)}
    >
      <GripVertical className="h-4 w-4 cursor-move text-gray-500" />
      <Checkbox
        className="h-4 w-4"
        checked={section.enabled}
        onCheckedChange={checked => updateSection(section.id, { enabled: checked === true })}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="0"
            className="h-7 w-16"
            value={section.sectionNumber}
            onChange={e => updateSection(section.id, { sectionNumber: e.target.value })}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {section.file?.name || "ファイルが選択されていません"}
            </p>
            {section.file && <p className="text-xs text-gray-500">{section.pageCount} ページ</p>}
          </div>
        </div>
      </div>
      <div className="flex gap-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => moveSectionUp(index)}
          disabled={index === 0}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => moveSectionDown(index)}
          disabled={index === sections.length - 1}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => removeSection(section.id)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
