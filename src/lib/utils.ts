import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Ghostscriptを使用したPDFフラット化機能
export async function flattenPdfWithGhostscript(file: File): Promise<Uint8Array> {
    try {
        // ファイルを一時的に保存
        const tempPath = await saveFileToTemp(file)

        // Ghostscriptでフラット化
        const flattenedBuffer = await window.ghostscript.flattenPdf(tempPath)

        // 一時ファイルを削除
        await deleteTempFile(tempPath)

        return new Uint8Array(flattenedBuffer)
    } catch (error) {
        console.error('Ghostscriptフラット化エラー:', error)
        throw new Error(`PDFフラット化に失敗しました: ${error}`)
    }
}

// ファイルを一時ディレクトリに保存
async function saveFileToTemp(file: File): Promise<string> {
    const tempDir = await window.ipcRenderer.invoke('get-temp-dir')
    const tempPath = `${tempDir}/${file.name}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    await window.ipcRenderer.invoke('write-temp-file', tempPath, buffer)
    return tempPath
}

// 一時ファイルを削除
async function deleteTempFile(filePath: string): Promise<void> {
    await window.ipcRenderer.invoke('delete-temp-file', filePath)
}

// Ghostscriptの利用可能性をチェック
export async function isGhostscriptAvailable(): Promise<boolean> {
    try {
        return await window.ghostscript.isAvailable()
    } catch (error) {
        console.warn('Ghostscriptの利用可能性チェックに失敗しました:', error)
        return false
    }
}
