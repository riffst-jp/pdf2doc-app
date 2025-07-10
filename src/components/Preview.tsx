import { ViewMode } from "@/types"
import { ChevronLeft, ChevronRight, File, FileStack, ZoomIn, ZoomOut } from "lucide-react"
import { useEffect, useMemo, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { DocumentCallback } from "react-pdf/dist/shared/types.js"
import { Progress } from "./ui/progress"
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group"

pdfjs.GlobalWorkerOptions.workerSrc = './pdf.worker.min.mjs'

interface PreviewProps {
  pdfBytes: Uint8Array | null
  progress?: { current: number; total: number }
  isProcessing?: boolean
}

export function Preview({
  pdfBytes,
  progress = { current: 0, total: 0 },
  isProcessing = false
}: PreviewProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('singlePage')
  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  // PDFデータが変更されたらエラーをリセット
  useEffect(() => {
    setError(null)
    setNumPages(0)
    setPageNumber(1)
  }, [pdfBytes])

  const pdfOptions = useMemo(() => ({
    cMapUrl: './cmaps/',
    cMapPacked: true,
    standardFontDataUrl: './standard_fonts/'
  }), [])

  // PDFファイルの作成（メモ化）
  const pdfFile = useMemo(() => {
    if (!pdfBytes) return null

    // ArrayBufferの状態をチェック
    if (pdfBytes.byteLength === 0) {
      console.warn('PDFデータが空です')
      return null
    }

    try {
      // ArrayBufferが有効かチェック（より安全な方法）
      const testSlice = pdfBytes.slice(0, 1)
      if (testSlice.length === 0) {
        console.error('ArrayBufferが無効です')
        return null
      }

      return new Blob([pdfBytes], { type: 'application/pdf' })
    } catch (error) {
      console.error('PDF Blob作成エラー:', error)
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
    console.error('PDF読み込みエラー:', error)
    setError(error.message || 'PDFの読み込みに失敗しました')
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
    <div className='w-full h-full flex flex-col overflow-hidden'>
      {isProcessing ? (
        <ProcessingPage
          progress={progress}
          progressPercentage={progressPercentage}
        />
      ) : pdfBytes && pdfFile ? (
        <div className='w-full h-full bg-gray-50 flex-none relative'>
          {/* コントロールバーを絶対位置で上に重ねる */}
          <div className='@container/control-bar absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 bg-gray-50/90 backdrop-blur-md border-b border-gray-200/50 shadow-xs'>
            <ToggleGroup
              type='single'
              value={viewMode.toString()}
              defaultValue={viewMode}
              onValueChange={(value) => setViewMode(value as ViewMode)}
              className='h-8 border border-gray-200 rounded-md bg-white'
            >
              <ToggleGroupItem value='singlePage' className='h-8 flex items-center justify-center px-4'>
                <File className='size-5' strokeWidth={1} />
                <span className='text-sm hidden @min-[600px]:flex'>単一表示</span>
              </ToggleGroupItem>
              <ToggleGroupItem value='multiPage' className='h-8 flex items-center justify-center px-4'>
                <FileStack className='size-5' strokeWidth={1} />
                <span className='text-sm hidden @min-[600px]:flex'>全表示</span>
              </ToggleGroupItem>
            </ToggleGroup>
            <div className='flex items-center space-x-2 absolute left-1/2 -translate-x-1/2'>
              <button
                onClick={previousPage}
                disabled={pageNumber <= 1}
                className='px-3 py-1 text-sm bg-white border border-gray-200 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
              >
                <ChevronLeft className='size-5' strokeWidth={1.5} />
              </button>
              <span className='text-sm text-gray-700 font-medium'>
                ページ {pageNumber} / {numPages}
              </span>
              <button
                onClick={nextPage}
                disabled={pageNumber >= numPages}
                className='px-3 py-1 text-sm bg-white border border-gray-200 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
              >
                <ChevronRight className='size-5' strokeWidth={1.5} />
              </button>
            </div>
            <div className='flex items-center space-x-2'>
              <button
                onClick={zoomOut}
                className='px-2 py-1 text-sm bg-white border border-gray-200 rounded hover:bg-white'
              >
                <ZoomOut className='size-5' strokeWidth={1.5} />
              </button>
              <span className='text-sm text-gray-700 font-medium text-center px-2'>
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className='px-2 py-1 text-sm bg-white border border-gray-200 rounded hover:bg-white'
              >
                <ZoomIn className='size-5' strokeWidth={1.5} />
              </button>
            </div>
          </div>
          {/* PDFプレビューエリア */}
          <div className='overflow-auto bg-gray-100 flex items-center justify-center py-4 h-full w-full pt-16'>
            {error ? (
              <ErrorPage error={error} setError={setError} />
            ) : (
              <Document
                file={pdfFile}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                options={pdfOptions}
                className='h-full space-y-4'
              >
                {viewMode === 'singlePage' ? (
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className='shadow-lg'
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
                    <div className='h-2' />
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
  progressPercentage
}: {
  progress: { current: number, total: number }
  progressPercentage: number
}) {
  return (
    <div className='w-full h-full flex items-center justify-center bg-gray-50'>
      <div className='text-center text-gray-500'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
        <p className='text-lg font-medium mb-2'>処理中...</p>
        <p className='text-sm mb-4'>しばらくお待ちください。</p>
        {progress.total > 0 && (
          <div className='w-64 mx-auto'>
            <Progress value={progressPercentage} />
            <p className='text-xs text-gray-400 mt-2'>
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
    <div className='w-full h-full flex items-center justify-center bg-gray-50'>
      <div className='text-center text-gray-500'>
        <p className='text-sm'>PDFファイルをアップロードすると、ここにリアルタイムプレビューが表示されます。</p>
      </div>
    </div>
  )
}

function ErrorPage({
  error,
  setError
}: {
  error: string | null,
  setError: (error: string | null) => void
}) {
  return (
    <div className='text-center text-red-500'>
      <p className='text-sm font-medium mb-2'>PDFの読み込みに失敗しました</p>
      <p className='text-xs text-gray-500 mb-4'>{error}</p>
      <button
        onClick={() => setError(null)}
        className='px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600'
      >
        再試行
      </button>
    </div>
  )
}

