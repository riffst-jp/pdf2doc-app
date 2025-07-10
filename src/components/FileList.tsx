import { Button } from "@/components/ui/button"
import { PdfSection } from "@/types"
import { Plus, Trash } from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { FileItem } from "./FileItem"

interface FileListProps {
  sections: PdfSection[]
  onSectionsChange: (sections: PdfSection[]) => void
}

export function FileList({ sections, onSectionsChange }: FileListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ファイルをアップロード
  const handleFileUpload = useCallback((files: FileList) => {
    const newSections: PdfSection[] = []

    Array.from(files).forEach((file, index) => {
      if (file.type === 'application/pdf') {
        const newSection: PdfSection = {
          id: Date.now().toString() + index,
          sectionNumber: String(sections.length + index),
          file: file,
          pageCount: 0,
          enabled: true
        }
        newSections.push(newSection)
      }
    })

    onSectionsChange([...sections, ...newSections])
  }, [sections, onSectionsChange])

  // ファイル選択処理
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      handleFileUpload(files)
      // ファイル選択後にinputをクリア
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [handleFileUpload])

  // ファイル選択ボタンクリック
  const handleFileButtonClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // ドラッグオーバー（ファイルドロップ用）
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }, [])

  // ドラッグリーブ（ファイルドロップ用）
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  // ドロップ（ファイルドロップ用）
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files) {
      handleFileUpload(files)
    }
  }, [handleFileUpload])

  // セクションを削除
  const removeSection = useCallback((id: string) => {
    onSectionsChange(sections.filter(section => section.id !== id))
  }, [sections, onSectionsChange])

  // セクションを更新
  const updateSection = useCallback((id: string, updates: Partial<PdfSection>) => {
    onSectionsChange(sections.map(section =>
      section.id === id ? { ...section, ...updates } : section
    ))
  }, [sections, onSectionsChange])

  // セクションを上に移動
  const moveSectionUp = useCallback((index: number) => {
    if (index > 0) {
      const newSections = [...sections]
      const temp = newSections[index]
      newSections[index] = newSections[index - 1]
      newSections[index - 1] = temp
      onSectionsChange(newSections)
    }
  }, [sections, onSectionsChange])

  // セクションを下に移動
  const moveSectionDown = useCallback((index: number) => {
    if (index < sections.length - 1) {
      const newSections = [...sections]
      const temp = newSections[index]
      newSections[index] = newSections[index + 1]
      newSections[index + 1] = temp
      onSectionsChange(newSections)
    }
  }, [sections, onSectionsChange])

  // ドラッグ開始
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  // ドラッグ終了
  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [])

  // ドラッグオーバー（並び替え用）
  const handleDragOverItem = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }, [draggedIndex])

  // ドロップ（並び替え用）
  const handleDropItem = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const newSections = [...sections]
      const draggedItem = newSections[draggedIndex]
      newSections.splice(draggedIndex, 1)
      newSections.splice(dropIndex, 0, draggedItem)
      onSectionsChange(newSections)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [sections, draggedIndex, onSectionsChange])

  return (
    <div className='flex flex-col h-full w-full pt-3 overflow-hidden'>
      <p className='text-xs font-medium text-gray-700 pb-3'>ファイルリスト</p>
      {sections.length > 0 && (
        <div className='flex flex-col overflow-y-auto border mb-2 border-gray-200 rounded-md bg-white'>
          {sections.map((section, index) => (
            <FileItem
              key={section.id}
              index={index}
              sections={sections}
              draggedIndex={draggedIndex}
              dragOverIndex={dragOverIndex}
              handleDragStart={handleDragStart}
              handleDragEnd={handleDragEnd}
              handleDragOverItem={handleDragOverItem}
              handleDropItem={handleDropItem}
              updateSection={updateSection}
              moveSectionUp={moveSectionUp}
              moveSectionDown={moveSectionDown}
              removeSection={removeSection}
            />
          ))}
        </div>
      )}
      <div className='w-full pb-2'>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-md p-4 transition-colors ${isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
            }`}
        >
          <Button
            variant='outline'
            onClick={handleFileButtonClick}
            className='w-full shadow-none'
          >
            <Plus className="h-4 w-4 mr-2" />
            PDFファイルを追加
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">
            または、PDFファイルをここにドラッグ&ドロップしてください
          </p>
        </div>
      </div>
      <div className='flex justify-end mt-auto'>
        <Button variant='outline' onClick={() => onSectionsChange([])}>
          <Trash className='w-4 h-4 mr-2' />
          <span>全てのPDFをリストから削除</span>
        </Button>
      </div>
    </div>
  )
}
