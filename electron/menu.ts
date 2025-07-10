import { Menu, MenuItemConstructorOptions } from 'electron'

// メニューのテンプレート配列を作成
const template: MenuItemConstructorOptions[] = [
    { role: 'fileMenu' },
    // { role: 'editMenu' },
    // { role: 'viewMenu' },
    // { role: 'windowMenu' },
    { role: 'help', submenu: [{ role: 'about' }] },
]

// macOS では "アプリメニュー" が必要
if (process.platform === 'darwin') template.unshift({ role: 'appMenu' })

// テンプレートからメニューを作成
export const menu = Menu.buildFromTemplate(template)

