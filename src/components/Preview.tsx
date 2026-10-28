import { ChevronLeft, ChevronRight, File, FileStack, ZoomIn, ZoomOut } from "lucide-react"
import { useMemo, useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { DocumentCallback } from "react-pdf/dist/shared/types.js"

import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"
import { ViewMode } from "@/types"

import { Progress } from "./ui/progress"
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group"

pdfjs.GlobalWorkerOptions.workerSrc = "./pdf.worker.min.mjs"

const DEFAULT_PROGRESS = { current: 0, total: 0 }

interface PreviewProps {
  pdfBytes: Uint8Array | null
  progress?: { current: number; total: number }
  isProcessing?: boolean
}

export function Preview({
  pdfBytes,
  progress = DEFAULT_PROGRESS,
  isProcessing = false,
}: PreviewProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("singlePage")
  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  const [prevPdfBytes, setPrevPdfBytes] = useState(pdfBytes)

  // PDFデータが変更されたらエラーをリセット
  if (pdfBytes !== prevPdfBytes) {
    setPrevPdfBytes(pdfBytes)
    setError(null)
    setNumPages(0)
    setPageNumber(1)
  }

  const pdfOptions = useMemo(
    () => ({
      cMapUrl: "./cmaps/",
      cMapPacked: true,
      standardFontDataUrl: "./standard_fonts/",
    }),
    [],
  )

  // PDFファイルの作成（メモ化）
  const pdfFile = useMemo(() => {
    if (!pdfBytes) return null

    // ArrayBufferの状態をチェック
    if (pdfBytes.byteLength === 0) {
      console.warn("PDFデータが空です")
      return null
    }

    try {
      // ArrayBufferが有効かチェック（より安全な方法）
      const testSlice = pdfBytes.slice(0, 1)
      if (testSlice.length === 0) {
        console.error("ArrayBufferが無効です")
        return null
      }

      return new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" })
    } catch (error) {
      console.error("PDF Blob作成エラー:", error)
      return null
    }
  }, [pdfBytes])

  async function onDocumentLoadSuccess(document: DocumentCallback) {
    const numPages = document.numPages
    setNumPages(numPages)
    setPageNumber(1)
    setError(null)
  }

  function onDocumentLoadError(error: Error) {
    console.error("PDF読み込みエラー:", error)
    setError(error.message || "PDFの読み込みに失敗しました")
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => prevPageNumber + offset)
  }

  function previousPage() {
    changePage(-1)
  }

  function nextPage() {
    changePage(1)
  }

  function zoomIn() {
    setScale(prev => Math.min(prev + 0.1, 3.0))
  }

  function zoomOut() {
    setScale(prev => Math.max(prev - 0.1, 0.5))
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {isProcessing ? (
        <ProcessingPage progress={progress} progressPercentage={progressPercentage} />
      ) : pdfBytes && pdfFile ? (
        <div className="relative h-full w-full flex-none bg-gray-50">
          {/* コントロールバーを絶対位置で上に重ねる */}
          <div className="@container/control-bar absolute top-0 right-0 left-0 z-20 flex items-center justify-between border-b border-gray-200/50 bg-gray-50/90 p-3 shadow-xs backdrop-blur-md">
            <ToggleGroup
              type="single"
              value={viewMode.toString()}
              defaultValue={viewMode}
              onValueChange={value => setViewMode(value as ViewMode)}
              className="h-8 rounded-md border border-gray-200 bg-white"
            >
              <ToggleGroupItem
                value="singlePage"
                className="flex h-8 items-center justify-center px-4"
              >
                <File className="size-5" strokeWidth={1} />
                <span className="hidden text-sm @min-[600px]:flex">単一表示</span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="multiPage"
                className="flex h-8 items-center justify-center px-4"
              >
                <FileStack className="size-5" strokeWidth={1} />
                <span className="hidden text-sm @min-[600px]:flex">全表示</span>
              </ToggleGroupItem>
            </ToggleGroup>
            <div className="absolute left-1/2 flex -translate-x-1/2 items-center space-x-2">
              <button
                onClick={previousPage}
                disabled={pageNumber <= 1}
                className="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-1 text-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="size-5" strokeWidth={1.5} />
              </button>
              <span className="text-sm font-medium text-gray-700">
                ページ {pageNumber} / {numPages}
              </span>
              <button
                onClick={nextPage}
                disabled={pageNumber >= numPages}
                className="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-1 text-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="size-5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={zoomOut}
                className="rounded border border-gray-200 bg-white px-2 py-1 text-sm hover:bg-white"
              >
                <ZoomOut className="size-5" strokeWidth={1.5} />
              </button>
              <span className="px-2 text-center text-sm font-medium text-gray-700">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className="rounded border border-gray-200 bg-white px-2 py-1 text-sm hover:bg-white"
              >
                <ZoomIn className="size-5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
          {/* PDFプレビューエリア */}
          <div className="flex h-full w-full items-center justify-center overflow-auto bg-gray-100 py-4 pt-16">
            {error ? (
              <ErrorPage error={error} setError={setError} />
            ) : (
              <Document
                file={pdfFile}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                options={pdfOptions}
                className="h-full space-y-4"
              >
                {viewMode === "singlePage" ? (
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="shadow-lg"
                  />
                ) : (
                  <>
                    {Array.from({ length: numPages }, (_, index) => (
                      <Page
                        key={index}
                        pageNumber={index + 1}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        width={1000}
                      />
                    ))}
                    <div className="h-2" />
                  </>
                )}
              </Document>
            )}
          </div>
        </div>
      ) : (
        <BlankPage />
      )}
    </div>
  )
}

function ProcessingPage({
  progress,
  progressPercentage,
}: {
  progress: { current: number; total: number }
  progressPercentage: number
}) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-50">
      <div className="text-center text-gray-500">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
        <p className="mb-2 text-lg font-medium">処理中...</p>
        <p className="mb-4 text-sm">しばらくお待ちください。</p>
        {progress.total > 0 && (
          <div className="mx-auto w-64">
            <Progress value={progressPercentage} />
            <p className="mt-2 text-xs text-gray-400">
              {progress.current} / {progress.total} pages processed
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function BlankPage() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-50">
      <div className="text-center text-gray-500">
        <p className="text-sm">
          PDFファイルをアップロードすると、ここにリアルタイムプレビューが表示されます。
        </p>
      </div>
    </div>
  )
}

function ErrorPage({
  error,
  setError,
}: {
  error: string | null
  setError: (error: string | null) => void
}) {
  return (
    <div className="text-center text-red-500">
      <p className="mb-2 text-sm font-medium">PDFの読み込みに失敗しました</p>
      <p className="mb-4 text-xs text-gray-500">{error}</p>
      <button
        onClick={() => setError(null)}
        className="rounded bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600"
      >
        再試行
      </button>
    </div>
  )
}
