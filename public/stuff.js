const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({

	files: {
		wasm: "/scram/scramjet.wasm.wasm",
		all: "/scram/scramjet.all.js",
		sync: "/scram/scramjet.sync.js",
	},

});

(async () => {
  try {
    if (navigator.serviceWorker) {
      await scramjet.init();
      await navigator.serviceWorker.register("/sw.js");
    } else {
      console.warn("Service workers not supported");
    }
  } catch (e) {
    console.error("Failed to initialize Scramjet:", e);
  }
})();

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
  await setTransport("epoxy");
});

document.getElementById("idk").addEventListener("submit", async (event) => {
  event.preventDefault();
  let fixedurl = search(document.getElementById("url").value);
  let url;
  if (document.getElementById("proxysel").value === "uv") {
    url = __uv$config.prefix + __uv$config.encodeUrl(fixedurl);
  } else {
    url = scramjet.encodeUrl(fixedurl);
  }
  document.getElementById("iframe").src = url;
});
