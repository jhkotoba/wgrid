const http = require("http");
const fs = require("fs");
const path = require("path");
const {
  listItems,
  searchItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  applyItems,
} = require("./db");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || "127.0.0.1";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const sendText = (res, status, message) => {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(message);
};

const sendJson = (res, status, payload) => {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
};

const sendRedirect = (res, location) => {
  res.writeHead(302, { Location: location });
  res.end();
};

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error("request body is too large"));
      }
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("invalid json body"));
      }
    });
    req.on("error", reject);
  });

const serveFile = (res, filePath) => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendText(res, 404, "Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = contentTypes[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
};

const parseIdFromPath = (pathname) => {
  const matched = pathname.match(/^\/api\/items\/(\d+)$/);
  if (!matched) {
    return null;
  }
  return Number.parseInt(matched[1], 10);
};

const handleItemsApi = async (req, res, pathname, searchParams) => {
  if (!req.method) {
    sendText(res, 400, "Bad request");
    return true;
  }

  if (pathname === "/api/items" && req.method === "GET") {
    sendJson(res, 200, { items: listItems() });
    return true;
  }

  if (pathname === "/api/items/search" && req.method === "GET") {
    const filters = {
      id: searchParams?.get("id") ?? "",
      name: searchParams?.get("name") ?? "",
      qty: searchParams?.get("qty") ?? "",
      status: searchParams?.get("status") ?? "",
      active: searchParams?.get("active") ?? "",
      dateFrom: searchParams?.get("dateFrom") ?? "",
      dateTo: searchParams?.get("dateTo") ?? "",
    };
    const paging = {
      pageNo: searchParams?.get("pageNo") ?? "1",
      pageSize: searchParams?.get("pageSize") ?? "10",
      pageBlock: searchParams?.get("pageBlock") ?? "5",
    };

    const result = searchItems(filters, paging);
    sendJson(res, 200, result);
    return true;
  }

  if (pathname === "/api/items" && req.method === "POST") {
    try {
      const body = await readJsonBody(req);
      const created = createItem(body);
      if (created.error) {
        sendJson(res, 400, { message: created.error });
        return true;
      }
      sendJson(res, 201, { item: created.item });
      return true;
    } catch (error) {
      sendJson(res, 400, { message: error.message });
      return true;
    }
  }

  if (pathname === "/api/items/apply" && req.method === "POST") {
    try {
      const body = await readJsonBody(req);
      const applied = applyItems(body.items);
      if (applied.error) {
        sendJson(res, 400, { message: applied.error });
        return true;
      }
      sendJson(res, 200, applied);
      return true;
    } catch (error) {
      sendJson(res, 400, { message: error.message });
      return true;
    }
  }

  const id = parseIdFromPath(pathname);
  if (id === null) {
    return false;
  }

  if (req.method === "GET") {
    const item = getItem(id);
    if (!item) {
      sendJson(res, 404, { message: "item not found" });
      return true;
    }
    sendJson(res, 200, { item });
    return true;
  }

  if (req.method === "PUT") {
    try {
      const body = await readJsonBody(req);
      const updated = updateItem(id, body);
      if (updated.error) {
        const status = updated.error === "item not found" ? 404 : 400;
        sendJson(res, status, { message: updated.error });
        return true;
      }
      sendJson(res, 200, { item: updated.item });
      return true;
    } catch (error) {
      sendJson(res, 400, { message: error.message });
      return true;
    }
  }

  if (req.method === "DELETE") {
    const deleted = deleteItem(id);
    if (deleted.error) {
      sendJson(res, 404, { message: deleted.error });
      return true;
    }
    sendJson(res, 200, { item: deleted.item });
    return true;
  }

  sendText(res, 405, "Method not allowed");
  return true;
};

const redirectToSinglePathSet = new Set(["/", "/examples", "/examples/"]);

const removedLegacyPathSet = new Set([
  "/examples/index.html",
  "/examples/sample.js",
  "/examples/sample-batch.html",
  "/examples/sample-batch.js",
]);

const samplePageAliases = {
  "/sample-crud-single": "/examples/sample-crud-single.html",
  "/sample-crud-apply": "/examples/sample-crud-apply.html",
  "/sample-paging": "/examples/sample-paging.html",
  "/examples/sample-crud-single": "/examples/sample-crud-single.html",
  "/examples/sample-crud-apply": "/examples/sample-crud-apply.html",
  "/examples/sample-paging": "/examples/sample-paging.html",
};

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    sendText(res, 400, "Bad request");
    return;
  }

  let decodedPath;
  let parsedUrl;
  try {
    parsedUrl = new URL(req.url, `http://${req.headers.host || `${host}:${port}`}`);
    decodedPath = decodeURIComponent(parsedUrl.pathname);
  } catch {
    sendText(res, 400, "Bad request");
    return;
  }

  if (decodedPath.startsWith("/api/")) {
    const handled = await handleItemsApi(req, res, decodedPath, parsedUrl.searchParams);
    if (!handled) {
      sendText(res, 404, "Not found");
    }
    return;
  }

  if (redirectToSinglePathSet.has(decodedPath)) {
    sendRedirect(res, "/examples/sample-crud-single");
    return;
  }

  if (removedLegacyPathSet.has(decodedPath)) {
    sendText(res, 404, "Not found");
    return;
  }

  const resolvedPath = samplePageAliases[decodedPath] || decodedPath;
  let filePath = path.resolve(root, `.${resolvedPath}`);
  const relativeFromRoot = path.relative(root, filePath);
  if (relativeFromRoot.startsWith("..") || path.isAbsolute(relativeFromRoot)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    serveFile(res, filePath);
  });
});

server.listen(port, host, () => {
  console.log(
    `wgrid sample server running at http://${host}:${port}/examples/sample-crud-single`
  );
});
