const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
	files: {
		wasm: "/scram/scramjet.wasm.wasm",
		all: "/scram/scramjet.all.js",
		sync: "/scram/scramjet.sync.js",
	},
});

let serviceWorkerSupported = false;

// Check if service workers are supported
if ('serviceWorker' in navigator) {
  (async () => {
    try {
      await scramjet.init();
      await navigator.serviceWorker.register("/sw.js");
      serviceWorkerSupported = true;
      console.log("Service workers initialized successfully");
    } catch (e) {
      console.error("Failed to initialize service workers:", e);
      serviceWorkerSupported = false;
    }
  })();
} else {
  console.warn("Service workers not supported in this environment");
  serviceWorkerSupported = false;
}

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
const wispUrl =
  (location.protocol === "https:" ? "wss" : "ws") +
  "://" +
  location.host +
  "/wisp/";
const bareUrl = location.protocol + "//" + location.host + "/bare/";

async function setTransport(transportsel) {
  switch (transportsel) {
    case "epoxy":
      await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
      break;
    case "libcurl":
      await connection.setTransport("/libcurl/index.mjs", [{ websocket: wispUrl }]);
      break;
    default:
      await connection.setTransport("/bareasmodule/index.mjs", [bareUrl]);
      break;
  }
}
function search(input) {
  let template = "https://www.google.com/search?q=%s";
  try {
    return new URL(input).toString();
  } catch (err) {}

  try {
    let url = new URL(`http://${input}`);
    if (url.hostname.includes(".")) return url.toString();
  } catch (err) {}

  return template.replace("%s", encodeURIComponent(input));
}

// Initialize transport after page loads
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await setTransport("epoxy");
  } catch (e) {
    console.error("Failed to set transport:", e);
  }
  
  // Disable proxy functionality if service workers are not supported
  if (!serviceWorkerSupported) {
    const proxySelect = document.getElementById("proxysel");
    const submitButton = document.getElementById("idk").querySelector('button[type="submit"]');
    const urlInput = document.getElementById("url");
    
    if (proxySelect) proxySelect.disabled = true;
    if (submitButton) submitButton.disabled = true;
    if (urlInput) urlInput.placeholder = "Proxy not available - Service Workers not supported";
    
    // Add a notice to the page
    const notice = document.createElement("div");
    notice.style.cssText = "background: #ffebee; color: #c62828; padding: 10px; margin-bottom: 10px; border-radius: 4px; border: 1px solid #ef5350;";
    notice.textContent = "Proxy functionality is not available in this environment (Service Workers not supported)";
    document.body.insertBefore(notice, document.getElementById("idk"));
  }
});

document.getElementById("idk").addEventListener("submit", async (event) => {
  event.preventDefault();
  
  if (!serviceWorkerSupported) {
    alert("Proxy functionality is not available - Service Workers are not supported in this environment");
    return;
  }
  
  let fixedurl = search(document.getElementById("url").value);
  let url;
  if (document.getElementById("proxysel").value === "uv") {
    url = __uv$config.prefix + __uv$config.encodeUrl(fixedurl);
  } else {
    url = scramjet.encodeUrl(fixedurl);
  }
  document.getElementById("iframe").src = url;
});