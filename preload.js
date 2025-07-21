const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  hideCatFile: (folderName, filename) =>
    ipcRenderer.invoke("hide-cat-file", folderName, filename),
  deleteCatFile: (folderName, filename) =>
    ipcRenderer.invoke("delete-cat-file", folderName, filename),
  listFolder: (folderPath) => ipcRenderer.invoke("list-folder", folderPath),
  //   parentFolder: (folderPath) => ipcRenderer.invoke("parent-folder", folderPath),
  getImageDataUrl: (imagePath) =>
    ipcRenderer.invoke("get-image-data-url", imagePath),
  getHomeDir: () => ipcRenderer.invoke("get-home-dir"),
});
