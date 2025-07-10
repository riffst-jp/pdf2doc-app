export interface GeneralConfig {
    mergePages: boolean
    addBlankPage: boolean
    prefixFormat: string
    flattenAnnotations: boolean
    pagePosition: PagePosition
    margin: number
    fontSize: number
    orientation: DocumentOrientation
    autoUpdate: boolean
}

export interface PdfSection {
    id: string
    sectionNumber: string
    file: File | null
    pageCount: number
    enabled: boolean
}

export interface PagePosition {
    horizontal: 'left' | 'center' | 'right'
    vertical: 'top' | 'center' | 'bottom'
}

export type DocumentOrientation = 'portrait' | 'landscape' | 'auto'

export type ViewMode = 'singlePage' | 'multiPage'
