function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const message = chrome.i18n.getMessage(key);
    if (message) el.textContent = message;
  });

  // Title fallback
  document.title = chrome.i18n.getMessage("optionsTitle");
}

document.addEventListener("DOMContentLoaded", () => {
  applyI18n();

  const jpegRange = document.getElementById("jpegQualityRange");
  const webpRange = document.getElementById("webpQualityRange");
  const jpegValue = document.getElementById("jpegQualityValue");
  const webpValue = document.getElementById("webpQualityValue");
  const resetBtn = document.getElementById("resetBtn");
  const note = document.getElementById("note");

  const DEFAULT_JPEG = 0.92;
  const DEFAULT_WEBP = 0.92;

  const updateValueDisplay = () => {
    jpegValue.textContent = parseFloat(jpegRange.value).toFixed(2);
    webpValue.textContent = parseFloat(webpRange.value).toFixed(2);
  };

  chrome.storage.sync.get(["jpegQuality", "webpQuality"], (result) => {
    const jpeg = result.jpegQuality ?? DEFAULT_JPEG;
    const webp = result.webpQuality ?? DEFAULT_WEBP;
    jpegRange.value = jpeg;
    webpRange.value = webp;
    updateValueDisplay();
  });

  jpegRange.addEventListener("input", updateValueDisplay);
  webpRange.addEventListener("input", updateValueDisplay);

  jpegRange.addEventListener("change", () => {
    chrome.storage.sync.set({ jpegQuality: parseFloat(jpegRange.value) });
    note.style.display = "none";
  });

  webpRange.addEventListener("change", () => {
    chrome.storage.sync.set({ webpQuality: parseFloat(webpRange.value) });
    note.style.display = "none";
  });

  resetBtn.addEventListener("click", () => {
    jpegRange.value = DEFAULT_JPEG;
    webpRange.value = DEFAULT_WEBP;
    updateValueDisplay();
    chrome.storage.sync.set(
      { jpegQuality: DEFAULT_JPEG, webpQuality: DEFAULT_WEBP },
      () => {
        note.style.display = "block";
        setTimeout(() => (note.style.display = "none"), 2000);
      }
    );
  });

  // Set name, description and version
  document.getElementById("extName").textContent =
    chrome.i18n.getMessage("extName");
  document.getElementById("extDescription").textContent =
    chrome.i18n.getMessage("extDescription");

  chrome.runtime.getManifest &&
    (document.getElementById("extVersion").textContent =
      chrome.runtime.getManifest().version);
});
