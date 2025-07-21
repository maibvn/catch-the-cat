# 🐱 Catch the Cat

A cozy and curious desktop game where you explore your own folders to find a hidden cat photo — all inside a beautifully simple app.

## 🧩 Game Concept

**"Catch the Cat"** is a gallery-explorer game. The cat hides one of its photos in one of your main folders — **Documents**, **Downloads**, **Pictures**, or **Desktop**. The app gives you a cryptic **hint**, and it's your job to **browse your folders** and uncover the hidden cat 🐾.

🖼 The twist? The cat only reveals itself when you **open the right folder in the app**. The UI is a modern gallery: you start at "Home" (the 4 main folders). Only images are shown in each folder. You can always return to Home with a single button.

## 🎮 How It Works

1. Launch the app.
2. A random main folder is chosen, and a cat image is secretly placed inside.
3. Listen carefully.
4. You browse your folders inside the app's gallery view. Only images are shown in each folder.
5. Open the correct folder → Click the cat photo → You win 🎉
6. A timer starts when you begin playing and stops when you click the cat. Try to beat your best time!

## 🐾 Features

- Interactive gallery UI (shows only images)
- Hidden cat image in a random main folder
- Timer: see how fast you can find the cat!
- Fully self-contained — doesn’t modify or access private data
- Fun, relaxing, and safe!

## 📂 Permissions & Safety

- Only accesses folder contents with your permission
- Never uploads or tracks anything
- You can delete the cat image any time

## 🔧 Tech Stack

## 🐾 Features

- Interactive gallery UI (shows only images)
- Hidden cat image in a random main folder
- Timer: see how fast you can find the cat!
- Secure Electron IPC: no Node.js modules in the renderer, all file/folder access via IPC
- Uses async/await for all Electron API calls for reliability
- Fully self-contained — doesn’t modify or access private data
- Fun, relaxing, and safe!

## 🚀 Getting Started

## 🔧 Tech Stack

- [Electron](https://electronjs.org/) (with secure preload and IPC)
- [React](https://react.dev/)
- [Node.js fs module](https://nodejs.org/api/fs.html)
  npm run dev

## 🚀 Getting Started

```bash
git clone https://github.com/maibuivn/catch-the-cat.git
cd catch-the-cat
npm install
npm run dev
```

## 📦 Building

```bash
npm run build
```

## � Exporting as Windows EXE

1. Build the React app (see above).
2. Install Electron Packager (if not already):
   ```bash
   npm install --save-dev electron-packager
   ```
3. Package your app as a Windows executable:
   ```bash
   npx electron-packager . catch-the-cat --platform=win32 --arch=x64 --out=dist --overwrite --icon=public/logo.ico
   ```
   - The output EXE will be in the `dist/catch-the-cat-win32-x64/` folder.
   - Double-click `catch-the-cat.exe` to run your game!

For custom icons, place a `logo.ico` in your `public/` folder.
Crafted by [MB] — just for fun 🐈
