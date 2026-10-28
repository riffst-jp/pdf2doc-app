import { Info } from "lucide-react"
import { PDFDocument, PDFPage, StandardFonts, degrees, rgb } from "pdf-lib"
import { useCallback, useEffect, useRef, useState } from "react"

import { ConfigForm } from "@/components/ConfigForm"
import { FileList } from "@/components/FileList"
import { Preview } from "@/components/Preview"
import { flattenPdfWithGhostscript, isGhostscriptAvailable } from "@/lib/utils"
import { GeneralConfig, PdfSection } from "@/types"

import { Toolbar } from "./components/Toolbar"
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./components/ui/resizable"

const DEFAULT_CONFIGS: GeneralConfig = {
  mergePages: true,
  addBlankPage: true,
  flattenAnnotations: true,
  orientation: "auto",
  prefixFormat: "{section}-{page}",
  pagePosition: {
    horizontal: "center",
    vertical: "bottom",
  },
  margin: 10,
  fontSize: 9,
  autoUpdate: true,
}

async function addPageNumber(
  config: GeneralConfig,
  pdfDoc: PDFDocument,
  section: PdfSection,
  page: PDFPage,
  i: number,
): Promise<void> {
  const { width, height } = page.getSize()

  // ページ番号を生成
  const pageNumber = config.prefixFormat
    .replace("{section}", section.sectionNumber)
    .replace("{page}", String(i + 1))

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const textSize = {
    width: font.widthOfTextAtSize(pageNumber, config.fontSize),
    height: font.heightAtSize(config.fontSize),
  }

  let x = {
    left: config.margin,
    center: width / 2 - textSize.width / 2,
    right: width - config.margin - textSize.width,
  }[config.pagePosition.horizontal]

  let y = {
    top: height - config.margin - textSize.height,
    center: height / 2 - textSize.height / 2,
    bottom: config.margin,
  }[config.pagePosition.vertical]

  let rotation = 0

  if (width > height) {
    // 横向き
    if (config.orientation === "portrait") {
      page.setRotation(degrees(-90))

      x = {
        top: width - config.margin - textSize.height,
        center: width / 2 - textSize.height / 2,
        bottom: config.margin,
      }[config.pagePosition.vertical]

      y = {
        right: config.margin + textSize.width,
        center: height / 2 - textSize.width / 2,
        left: height - config.margin,
      }[config.pagePosition.horizontal]

      rotation = -90
    }
  } else {
    // 縦向き
    if (config.orientation === "landscape") {
      page.setRotation(degrees(90))

      x = {
        bottom: width - config.margin,
        center: width / 2 + textSize.height / 2,
        top: config.margin + textSize.height,
      }[config.pagePosition.vertical]

      y = {
        left: config.margin,
        center: height / 2 - textSize.width / 2,
        right: height - config.margin - textSize.width,
      }[config.pagePosition.horizontal]

      rotation = 90
    }
  }
  page.drawText(pageNumber, {
    x: x,
    y: y,
    rotate: degrees(rotation),
    size: config.fontSize,
    font: font,
    color: rgb(0, 0, 0),
  })
}

function App() {
  const [config, setConfig] = useState<GeneralConfig>(DEFAULT_CONFIGS)
  const [sections, setSections] = useState<PdfSection[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const isProcessingRef = useRef(false)
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 })
  const [ghostscriptAvailable, setGhostscriptAvailable] = useState<boolean | null>(null)
  const [previewPdf, setPreviewPdf] = useState<Uint8Array | null>(null)

  // ページ数を取得する関数
  const getPageCount = useCallback(async (file: File): Promise<number> => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      return pdf.getPageCount()
    } catch (error) {
      console.error("PDF読み込みエラー:", error)
      return 0
    }
  }, [])

  const processPdf = useCallback(async () => {
    try {
      isProcessingRef.current = true
      setIsProcessing(true)
      setProcessingProgress({ current: 0, total: 0 })

      const pdfDoc = await PDFDocument.create()

      const totalPages = sections.reduce((acc, section) => acc + section.pageCount, 0)
      setProcessingProgress({ current: 0, total: totalPages })

      for (const section of sections) {
        if (!section.file) continue

        let sourcePdf: PDFDocument

        if (config.flattenAnnotations && ghostscriptAvailable) {
          try {
            const flattenedPdfBytes = await flattenPdfWithGhostscript(section.file)
            sourcePdf = await PDFDocument.load(flattenedPdfBytes)
          } catch (error) {
            console.warn("Ghostscriptフラット化に失敗しました。元のPDFを使用します:", error)
            const arrayBuffer = await section.file.arrayBuffer()
            sourcePdf = await PDFDocument.load(arrayBuffer)
          }
        } else {
          const arrayBuffer = await section.file.arrayBuffer()
          sourcePdf = await PDFDocument.load(arrayBuffer)
        }

        const sourcePages = await pdfDoc.copyPages(sourcePdf, sourcePdf.getPageIndices())

        for (let i = 0; i < sourcePages.length; i++) {
          const page = sourcePages[i]
          if (section.enabled) await addPageNumber(config, pdfDoc, section, page, i)
          setProcessingProgress(prev => ({ ...prev, current: prev.current + 1 }))
          pdfDoc.addPage(page)
        }

        if (config.addBlankPage && section.id !== sections[sections.length - 1].id) {
          const lastPage = pdfDoc.getPage(pdfDoc.getPageCount() - 1)
          const { width, height } = lastPage.getSize()

          switch (config.orientation) {
            case "auto":
              pdfDoc.addPage([width, height])
              break
            case "landscape":
              if (width > height) {
                pdfDoc.addPage([width, height])
              } else {
                pdfDoc.addPage([height, width])
              }
              break
            case "portrait":
              if (width > height) {
                pdfDoc.addPage([height, width])
              } else {
                pdfDoc.addPage([width, height])
              }
              break
          }
        }
      }

      const pdfBytes = await pdfDoc.save()
      setPreviewPdf(pdfBytes)
    } catch (error) {
      console.error("プレビュー生成エラー:", error)
      setPreviewPdf(null)
    } finally {
      isProcessingRef.current = false
      setIsProcessing(false)
      setProcessingProgress({ current: 0, total: 0 })
    }
  }, [sections, config, ghostscriptAvailable])

  const generatePreview = useCallback(
    async (forceUpdate = false) => {
      if (sections.length === 0) {
        setPreviewPdf(null)
        return
      }
      try {
        if (!config.autoUpdate && !forceUpdate) {
          return
        }
        await processPdf()
      } catch (error) {
        console.error("プレビュー生成エラー:", error)
        setPreviewPdf(null)
      }
    },
    [sections, config, processPdf],
  )

  const updateSettings = (updates: Partial<GeneralConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const downloadPdf = useCallback(() => {
    if (!previewPdf) return
    const link = document.createElement("a")
    const pdfFile = new Blob([previewPdf as Uint8Array<ArrayBuffer>], { type: "application/pdf" })
    link.href = URL.createObjectURL(pdfFile)
    link.download = "output.pdf"
    link.click()
  }, [previewPdf])

  useEffect(() => {
    const checkGhostscript = async () => {
      const available = await isGhostscriptAvailable()
      setGhostscriptAvailable(available)
      if (!available) setConfig(prev => ({ ...prev, flattenAnnotations: false }))
    }
    void checkGhostscript()
  }, [])

  // セクションが更新されたときにページ数を取得
  useEffect(() => {
    const updatePageCounts = async () => {
      const updatedSections = await Promise.all(
        sections.map(async section => {
          if (section.file && section.pageCount === 0) {
            const pageCount = await getPageCount(section.file)
            return { ...section, pageCount }
          }
          return section
        }),
      )

      // ページ数が変更された場合のみ更新
      const hasChanges = updatedSections.some(
        (section, index) => section.pageCount !== sections[index].pageCount,
      )

      if (hasChanges) {
        setSections(updatedSections)
      }
    }

    void updatePageCounts()
  }, [sections, getPageCount])

  useEffect(() => {
    if (!isProcessingRef.current && config.autoUpdate) void generatePreview()
  }, [config.autoUpdate, generatePreview])

  return (
    <div className="h-screen w-screen">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full" autoSaveId="pdf-merger">
        <ResizablePanel
          minSize={2}
          defaultSize={2}
          className="flex h-full w-90 min-w-85 flex-col overflow-hidden bg-gray-50/90 p-4"
        >
          <div id="draggable" className="-m-4 mb-2 px-4 pt-11">
            {ghostscriptAvailable === false && (
              <Alert variant="default" className="mb-2">
                <Info className="size-4" strokeWidth={1.5} />
                <AlertTitle>Ghostscriptが見つかりません</AlertTitle>
                <AlertDescription>
                  PDFのフラット化機能を使用するには、Ghostscriptをインストールしてください。
                </AlertDescription>
              </Alert>
            )}
          </div>
          <ConfigForm
            settings={config}
            onSettingsChange={updateSettings}
            ghostscriptAvailable={ghostscriptAvailable}
          />
          <FileList sections={sections} onSectionsChange={setSections} />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel minSize={2} className="flex h-full min-w-100 flex-col overflow-hidden">
          <Toolbar
            downloadable={!!previewPdf}
            downloadCallback={downloadPdf}
            autoUpdate={config.autoUpdate}
            autoUpdateCallback={value => updateSettings({ autoUpdate: value })}
            onRefresh={() => generatePreview(true)}
          />
          <Preview
            pdfBytes={previewPdf}
            isProcessing={isProcessing}
            progress={processingProgress}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default App
