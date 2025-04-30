chrome.runtime.onInstalled.addListener(() => {
  const formats = ["PNG", "JPG", "WebP"];

  formats.forEach((format) => {
    const messageKey = `contextMenu${format}`;
    const title =
      chrome.i18n.getMessage(messageKey) || `Save image as ${format}`;

    chrome.contextMenus.create({
      id: format,
      title,
      contexts: ["image"],
    });
  });

  chrome.contextMenus.create({
    id: "separator",
    type: "separator",
    contexts: ["image"],
  });

  chrome.contextMenus.create({
    id: "github",
    title: chrome.i18n.getMessage("menuAboutGitHub") || "GitHub",
    contexts: ["image"],
  });

  chrome.contextMenus.create({
    id: "store",
    title: chrome.i18n.getMessage("menuOpenStore") || "Chrome Web Store",
    contexts: ["image"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "github") {
    chrome.tabs.create({
      url: "https://github.com/gabireze/save-image-as",
    });
    return;
  }

  if (info.menuItemId === "store") {
    chrome.tabs.create({
      url: "https://chrome.google.com/webstore/detail/lfmnkgdmceifplfmmhjjincclbjonfpd",
    });
    return;
  }

  if (info.mediaType === "image" && info.srcUrl) {
    chrome.storage.sync.get(["jpegQuality", "webpQuality"], (result) => {
      const format = info.menuItemId;
      let quality = 0.92;

      if (format === "JPG") {
        quality = result.jpegQuality ?? 0.92;
      } else if (format === "WebP") {
        quality = result.webpQuality ?? 0.92;
      }

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: convertAndDownloadImage,
        args: [info.srcUrl, format, quality],
      });
    });
  }
});

chrome.runtime.onMessage.addListener(({ url, filename }) => {
  chrome.downloads.download({ url, filename, saveAs: false });
});

function convertAndDownloadImage(originalUrl, format, quality) {
  function extractFilenameFromUrl(url, format) {
    try {
      const pathname = new URL(url).pathname;
      const originalName = pathname
        .substring(pathname.lastIndexOf("/") + 1)
        .split(/[?#]/)[0];
      const base = originalName.replace(/\.[^/.]+$/, "");
      return `${base}.${format.toLowerCase()}`;
    } catch {
      return `converted_image.${format.toLowerCase()}`;
    }
  }

  fetch(originalUrl, { mode: "cors" })
    .then((response) => response.blob())
    .then((blob) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          const mimeType = {
            PNG: "image/png",
            JPG: "image/jpeg",
            WebP: "image/webp",
          }[format];

          canvas.toBlob(
            (convertedBlob) => {
              const url = URL.createObjectURL(convertedBlob);
              const filename = extractFilenameFromUrl(originalUrl, format);
              chrome.runtime.sendMessage({ url, filename });
            },
            mimeType,
            format === "PNG" ? 1.0 : quality
          );
        };
        img.onerror = () => alert("❌ Error loading the image.");
        img.src = reader.result;
      };
      reader.readAsDataURL(blob);
    })
    .catch((err) => {
      alert("❌ Error downloading the image.");
      console.error(err);
    });
}
