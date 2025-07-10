import { spawn } from 'child_process'
import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import { promises as fs } from 'fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'os'
import { menu } from './menu'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
    win = new BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
        },
        minWidth: 600,
        minHeight: 400,
        ...(process.platform === 'darwin' ? {
            titleBarStyle: 'hidden',
            // titleBarOverlay: true
        } : {}),
        vibrancy: 'fullscreen-ui',
    })

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString())
    })

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
    } else {
        // win.loadFile('dist/index.html')
        win.loadFile(path.join(RENDERER_DIST, 'index.html'))
    }

    Menu.setApplicationMenu(menu)
}

async function getGsPath(): Promise<string> {
    const gsCommands = process.platform === 'win32'
        ? ['gswin64c', 'gswin32c', 'gs']
        : ['gs']

    const gsPaths = process.platform === 'win32'
        ? [
            'C:\\Program Files\\gs\\gs10.02.1\\bin\\gswin64c.exe',
            'C:\\Program Files\\gs\\gs10.01.1\\bin\\gswin64c.exe',
            'C:\\Program Files\\gs\\gs10.00.0\\bin\\gswin64c.exe',
            'C:\\Program Files (x86)\\gs\\gs10.02.1\\bin\\gswin32c.exe',
            'C:\\Program Files (x86)\\gs\\gs10.01.1\\bin\\gswin32c.exe',
            'C:\\Program Files (x86)\\gs\\gs10.00.0\\bin\\gswin32c.exe'
        ]
        : [
            '/usr/local/bin/gs',
            '/opt/homebrew/bin/gs',
            '/usr/bin/gs',
            '/opt/local/bin/gs',
            '/usr/local/ghostscript/bin/gs'
        ]

    // 方法1: システムのPATHでコマンドを直接実行
    for (const command of gsCommands) {
        try {
            const gsProcess = spawn(command, ['--version'])
            const isAvailable = await new Promise<boolean>((resolve) => {
                gsProcess.on('close', (code) => {
                    resolve(code === 0)
                })
                gsProcess.on('error', () => {
                    resolve(false)
                })
            })
            if (isAvailable) {
                return command
            }
        } catch {
            // このコマンドは失敗、次を試す
        }
    }

    // 方法2: 一般的なパスを直接チェック
    for (const gsPath of gsPaths) {
        try {
            await fs.access(gsPath)
            return gsPath
        } catch {
            // このパスには存在しない、次を試す
        }
    }

    // 方法3: whichコマンドで検索（Unix系のみ）
    if (process.platform !== 'win32') {
        try {
            const whichProcess = spawn('which', ['gs'])
            const gsPath = await new Promise<string>((resolve, reject) => {
                let output = ''
                whichProcess.stdout.on('data', (data) => {
                    output += data.toString()
                })
                whichProcess.on('close', (code) => {
                    if (code === 0) {
                        resolve(output.trim())
                    } else {
                        reject(new Error('which gs failed'))
                    }
                })
                whichProcess.on('error', () => {
                    reject(new Error('which gs error'))
                })
            })
            return gsPath
        } catch {
            // whichコマンドが失敗
        }
    }

    throw new Error('Ghostscriptが見つかりません')
}

// Ghostscriptを使用したPDFフラット化機能
ipcMain.handle('flatten-pdf-with-ghostscript', async (event, inputPath: string) => {
    try {
        // 一時ファイルのパスを生成
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-flatten-'))
        const outputPath = path.join(tempDir, 'flattened.pdf')

        try {
            const gsPath = await getGsPath()

            // Ghostscriptコマンドを実行
            const gsProcess = spawn(gsPath, [
                '-dSAFER',
                '-dBATCH',
                '-dNOPAUSE',
                '-dNOCACHE',
                '-sDEVICE=pdfwrite',
                '-dPreserveAnnots=false',
                '-sOutputFile=' + outputPath,
                inputPath
            ])

            return new Promise((resolve, reject) => {
                let stdout = ''
                let stderr = ''

                gsProcess.stdout.on('data', (data) => {
                    stdout += data.toString()
                })

                gsProcess.stderr.on('data', (data) => {
                    stderr += data.toString()
                })

                gsProcess.on('close', async (code) => {
                    if (code === 0) {
                        try {
                            // フラット化されたPDFを読み込み
                            const flattenedPdfBuffer = await fs.readFile(outputPath)

                            // 一時ファイルを削除
                            await fs.unlink(outputPath)
                            await fs.rmdir(tempDir)

                            resolve(flattenedPdfBuffer)
                        } catch (error) {
                            reject(new Error(`フラット化されたPDFの読み込みに失敗しました: ${error}`))
                        }
                    } else {
                        reject(new Error(`Ghostscriptの実行に失敗しました (終了コード: ${code}): ${stderr}`))
                    }
                })

                gsProcess.on('error', (error) => {
                    reject(new Error(`Ghostscriptの起動に失敗しました: ${error.message}`))
                })
            })
        } catch (error) {
            throw new Error('Ghostscriptが見つかりません')
        }
    } catch (error) {
        throw new Error(`PDFフラット化処理でエラーが発生しました: ${error}`)
    }
})

// Ghostscriptの利用可能性をチェック
ipcMain.handle('check-ghostscript-available', async () => {
    try {
        return await getGsPath() !== null
    } catch (error) {
        console.error('Ghostscript検出エラー:', error)
        return false
    }
})

// 一時ディレクトリの取得
ipcMain.handle('get-temp-dir', async () => {
    return await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-app-'))
})

// 一時ファイルの書き込み
ipcMain.handle('write-temp-file', async (event, filePath: string, buffer: Uint8Array) => {
    await fs.writeFile(filePath, buffer)
})

// 一時ファイルの削除
ipcMain.handle('delete-temp-file', async (event, filePath: string) => {
    try {
        await fs.unlink(filePath)
    } catch (error) {
        console.warn('一時ファイルの削除に失敗しました:', error)
    }
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
        win = null
    }
})

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

app.whenReady().then(createWindow)
