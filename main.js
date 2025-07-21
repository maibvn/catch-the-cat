// For file operations and user folders
const fs = require("fs");
const os = require("os");
const path = require("path");
const { app, BrowserWindow, ipcMain, screen } = require("electron");

// IPC: Get home directory for renderer (fix for preload.js context)
ipcMain.handle("get-home-dir", async () => {
  const os = require("os");
  return os.homedir();
});
// IPC: Read image as base64 data URL
ipcMain.handle("get-image-data-url", async (event, imagePath) => {
  try {
    const ext = path.extname(imagePath).toLowerCase().replace(".", "");
    const mime =
      ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "png"
        ? "image/png"
        : ext === "gif"
        ? "image/gif"
        : ext === "bmp"
        ? "image/bmp"
        : ext === "webp"
        ? "image/webp"
        : "application/octet-stream";
    const data = fs.readFileSync(imagePath);
    const base64 = data.toString("base64");
    return `data:${mime};base64,${base64}`;
  } catch (err) {
    return null;
  }
});

// IPC: Delete the cat file
ipcMain.handle("delete-cat-file", async (event, folderName, filename) => {
  try {
    const folderPath = getUserFolder(folderName);
    const catPath = path.join(folderPath, filename);
    if (fs.existsSync(catPath)) {
      fs.unlinkSync(catPath);
    }
    return true;
  } catch (err) {
    return false;
  }
});

// Helper to get a user folder path by name
function getUserFolder(folderName) {
  const home = os.homedir();
  switch (folderName) {
    case "Documents":
      return path.join(home, "Documents");
    case "Downloads":
      return path.join(home, "Downloads");
    case "Pictures":
      return path.join(home, "Pictures");
    case "Desktop":
      return path.join(home, "Desktop");
    default:
      return home;
  }
}

// IPC: Hide the cat file (copy cat.png from public to target folder)
ipcMain.handle("hide-cat-file", async (event, folderName, filename) => {
  try {
    const folderPath = getUserFolder(folderName);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    // Always use build/cat.png (all public assets are copied to build/ by postbuild)
    const publicCatPath = path.join(__dirname, "build", "cat.png");
    const catPath = path.join(folderPath, filename);
    fs.copyFileSync(publicCatPath, catPath);
    return { catPath };
  } catch (err) {
    console.error("Failed to hide cat file:", err);
    throw err;
  }
});

// IPC: List folder contents
ipcMain.handle("list-folder", async (event, folderPath) => {
  try {
    let basePath;
    if (!folderPath) {
      // Home view: show common folders
      const home = os.homedir();
      const folders = ["Documents", "Downloads", "Pictures", "Desktop"];
      const entries = folders.map((name) => {
        const p = path.join(home, name);
        return { name, path: p, isDirectory: true };
      });
      return { entries, path: "" };
    } else {
      basePath = folderPath;
    }
    const files = fs.readdirSync(basePath, { withFileTypes: true });
    const entries = files.map((f) => ({
      name: f.name,
      path: path.join(basePath, f.name),
      isDirectory: f.isDirectory(),
    }));
    return { entries, path: basePath };
  } catch (err) {
    console.error("Failed to list folder:", err);
    throw err;
  }
});

// IPC: Check if the cat file exists
ipcMain.handle("check-cat-file", async (event, catPath) => {
  try {
    return fs.existsSync(catPath);
  } catch (err) {
    return false;
  }
});

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().size;
  const win = new BrowserWindow({
    width,
    height,
    fullscreen: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
    backgroundColor: "#222",
  });
  win.once("ready-to-show", () => win.show());
  if (!app.isPackaged) {
    win.loadURL("http://localhost:3000"); // React dev server
  } else {
    const indexPath = path.join(__dirname, "build", "index.html");
    win.loadFile(indexPath).catch((err) => {
      console.error("Failed to load index.html:", indexPath, err);
    });
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
