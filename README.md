# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list

# PDF2Doc App

PDFファイルにページ番号を追加し、注釈をフラット化するElectronアプリケーションです。

## 機能

- PDFファイルのアップロードと管理
- ページ番号の自動追加
- セクション間の空白ページ追加
- 注釈のフラット化（Ghostscript使用）
- レイアウトの強制変換（縦向き/横向き）

## 必要な環境

### Node.js
- Node.js 18.0.0以上

### Ghostscript（フラット化機能を使用する場合）
PDFの注釈をフラット化する機能を使用するには、Ghostscriptをインストールする必要があります。

#### macOS
```bash
# Homebrewを使用
brew install ghostscript

# または、MacPortsを使用
sudo port install ghostscript
```

#### Windows
1. [Ghostscript公式サイト](https://www.ghostscript.com/releases/gsdnld.html)からインストーラーをダウンロード
2. インストーラーを実行
3. システム環境変数PATHにGhostscriptのbinディレクトリを追加

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install ghostscript
```

#### Linux (CentOS/RHEL/Fedora)
```bash
# CentOS/RHEL
sudo yum install ghostscript

# Fedora
sudo dnf install ghostscript
```

## インストールと実行

### 依存関係のインストール
```bash
pnpm install
```

### 開発モードで実行
```bash
pnpm dev
```

### ビルド
```bash
pnpm build
```

## 使用方法

1. PDFファイルをアップロード
2. 設定を調整
   - ページ番号フォーマット
   - フラット化オプション
   - レイアウト設定
3. 「変換」ボタンをクリック
4. 処理されたPDFをダウンロード

## 技術スタック

- **フロントエンド**: React + TypeScript + Vite
- **UI**: Tailwind CSS + Radix UI
- **PDF処理**: pdf-lib + Ghostscript
- **デスクトップ**: Electron

## 開発

### プロジェクト構造
```
pdf2doc-app/
├── electron/          # Electronメインプロセス
├── src/              # Reactアプリケーション
│   ├── components/   # UIコンポーネント
│   ├── lib/         # ユーティリティ関数
│   └── types/       # TypeScript型定義
└── public/          # 静的ファイル
```

### 貢献
1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
