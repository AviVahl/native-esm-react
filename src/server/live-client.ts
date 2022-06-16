export function injectLiveClient(html: string) {
  const bodyCloseIdx = html.lastIndexOf("</body>");
  return bodyCloseIdx === -1
    ? html
    : html.slice(0, bodyCloseIdx) +
        `  <script>
      const wsURL = new URL(window.location.href);
      wsURL.protocol = "ws";
      wsURL.hash = "";
      const ws = new WebSocket(wsURL);
      ws.addEventListener("message", ({ data }) => {
        if (data === "reload") {
          window.location.reload();
        }
      });
    </script>\n  ` +
        html.slice(bodyCloseIdx);
}
