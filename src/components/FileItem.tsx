import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { PdfSection } from "@/types"
import { ChevronDown, ChevronUp, GripVertical, X } from "lucide-react"

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
  removeSection
}: FileItemProps) {
  const section = sections[index]

  return (
    <div
      className={`flex items-center gap-2 p-2 transition-all
        ${index === sections.length - 1 ? 'border-b-0' : 'border-b'}
        ${draggedIndex === index ? 'opacity-50' : ''}
        ${dragOverIndex === index ? 'border border-blue-500 bg-blue-50' : ''}
        ${dragOverIndex === sections.length - 1 ? 'rounded-b-md' : ''}
        ${dragOverIndex === 0 ? 'rounded-t-md' : ''}
      `}
      draggable
      onDragStart={(e) => handleDragStart(e, index)}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => handleDragOverItem(e, index)}
      onDrop={(e) => handleDropItem(e, index)}
    >
      <GripVertical className="text-gray-500 cursor-move h-4 w-4" />
      <Checkbox
        className='h-4 w-4'
        checked={section.enabled}
        onCheckedChange={(checked) => updateSection(section.id, { enabled: checked === true })}
      />
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2'>
          <Input
            type="text"
            placeholder="0"
            className='w-16 h-7'
            value={section.sectionNumber}
            onChange={(e) => updateSection(section.id, { sectionNumber: e.target.value })}
          />
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium truncate'>
              {section.file?.name || 'ファイルが選択されていません'}
            </p>
            {section.file && (
              <p className='text-xs text-gray-500'>
                {section.pageCount} ページ
              </p>
            )}
          </div>
        </div>
      </div>
      <div className='flex gap-0'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => moveSectionUp(index)}
          disabled={index === 0}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => moveSectionDown(index)}
          disabled={index === sections.length - 1}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => removeSection(section.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
