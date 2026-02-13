import wgrid from "../src/wgrid.js";
import { renderSampleMenu } from "./menu.js";

const $ = (selector) => document.querySelector(selector);
const output = $("#output");
const loading = $("#loading");
const errorMessage = $("#error-message");
const themeSelect = $("#theme-select");
const themeLink = document.getElementById("wgrid-theme");
const pagingModeSelect = $("#paging-mode");

const btnSearch = $("#btn-search");
const btnReload = $("#btn-reload");
const btnReset = $("#btn-reset");

const inputId = $("#search-id");
const inputName = $("#search-name");
const inputQty = $("#search-qty");
const inputStatus = $("#search-status");
const inputActive = $("#search-active");
const inputDateFrom = $("#search-date-from");
const inputDateTo = $("#search-date-to");

const actionElements = [btnSearch, btnReload, btnReset, pagingModeSelect].filter(Boolean);

// Developers can customize this list, e.g. [100, 500, 1000].
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE = DEFAULT_PAGE_SIZE_OPTIONS[0];
const DEFAULT_PAGE_BLOCK = 5;

let pendingRequests = 0;
let grid = null;
let currentPageSize = DEFAULT_PAGE_SIZE;

renderSampleMenu("#sample-menu", "sample-paging");

const log = (value) => {
  if (typeof value === "string") {
    output.textContent = value;
    return;
  }
  output.textContent = JSON.stringify(value, null, 2);
};

const setLoading = (isLoading) => {
  pendingRequests += isLoading ? 1 : -1;
  if (pendingRequests < 0) pendingRequests = 0;

  const busy = pendingRequests > 0;
  loading.hidden = !busy;
  actionElements.forEach((element) => {
    element.disabled = busy;
  });
};

const setError = (message = "") => {
  errorMessage.textContent = message;
};

const applyTheme = (theme) => {
  if (!themeLink) return;

  const themeMap = {
    white: "../src/wgrid_white.css",
    dark: "../src/wgrid_dark.css",
    gray: "../src/wgrid_gray.css",
  };

  themeLink.setAttribute("href", themeMap[theme] ?? themeMap.white);
};

if (themeSelect) {
  themeSelect.addEventListener("change", (event) => applyTheme(event.target.value));
  applyTheme(themeSelect.value);
}

const request = async (url, options = {}) => {
  setLoading(true);
  setError("");

  try {
    const headers = { ...(options.headers || {}) };
    const config = { ...options, headers };

    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);
    const text = await response.text();

    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { message: text };
      }
    }

    if (!response.ok) {
      throw new Error(payload?.message || `request failed (${response.status})`);
    }

    return payload;
  } catch (error) {
    setError(error.message);
    log({ type: "error", message: error.message });
    throw error;
  } finally {
    setLoading(false);
  }
};

const api = {
  list: () => request("/api/items"),
  searchServer: (param) => {
    const query = new URLSearchParams();
    const filter = param.filter || {};
    const paging = param.paging || {};

    if (filter.id) query.set("id", filter.id);
    if (filter.name) query.set("name", filter.name);
    if (filter.qty) query.set("qty", filter.qty);
    if (filter.status) query.set("status", filter.status);
    if (filter.active && filter.active !== "all") query.set("active", filter.active);
    if (filter.dateFrom) query.set("dateFrom", filter.dateFrom);
    if (filter.dateTo) query.set("dateTo", filter.dateTo);

    query.set("pageNo", String(paging.pageNo ?? 1));
    query.set("pageSize", String(paging.pageSize ?? DEFAULT_PAGE_SIZE));
    query.set("pageBlock", String(paging.pageBlock ?? DEFAULT_PAGE_BLOCK));

    return request(`/api/items/search?${query.toString()}`);
  },
};

const parseOptionalInt = (value) => {
  if (value === undefined || value === null || value === "") {
    return { hasValue: false, value: null, valid: true };
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return { hasValue: true, value: null, valid: false };
  }

  return { hasValue: true, value: parsed, valid: true };
};

const normalizeFilter = (raw = {}) => ({
  id: String(raw.id ?? "").trim(),
  name: String(raw.name ?? "").trim(),
  qty: String(raw.qty ?? "").trim(),
  status: String(raw.status ?? "").trim().toUpperCase(),
  active: String(raw.active ?? "all").trim().toLowerCase() || "all",
  dateFrom: String(raw.dateFrom ?? "").trim(),
  dateTo: String(raw.dateTo ?? "").trim(),
});

const normalizePaging = (raw = {}) => {
  const pageNo = Number.parseInt(raw.pageNo, 10);
  const pageSize = Number.parseInt(raw.pageSize, 10);
  const pageBlock = Number.parseInt(raw.pageBlock, 10);

  return {
    pageNo: Number.isNaN(pageNo) || pageNo < 1 ? 1 : pageNo,
    pageSize: Number.isNaN(pageSize) || pageSize < 1 ? DEFAULT_PAGE_SIZE : pageSize,
    pageBlock: Number.isNaN(pageBlock) || pageBlock < 1 ? DEFAULT_PAGE_BLOCK : pageBlock,
    totalCount: Number.parseInt(raw.totalCount, 10) || 0,
  };
};

const getCurrentPageSize = () => {
  const pagingSize = Number.parseInt(grid?.getPagingData?.()?.pageSize, 10);
  if (!Number.isNaN(pagingSize) && pagingSize > 0) {
    return pagingSize;
  }

  const parsed = Number.parseInt(currentPageSize, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return DEFAULT_PAGE_SIZE;
  }
  return parsed;
};

const normalizeSearchParam = (param = {}) => ({
  filter: normalizeFilter(param.filter || {}),
  paging: normalizePaging(param.paging || {}),
});

const readFilterFromForm = () =>
  normalizeFilter({
    id: inputId.value,
    name: inputName.value,
    qty: inputQty.value,
    status: inputStatus.value,
    active: inputActive.value,
    dateFrom: inputDateFrom.value,
    dateTo: inputDateTo.value,
  });

const clearFilterForm = () => {
  inputId.value = "";
  inputName.value = "";
  inputQty.value = "";
  inputStatus.value = "";
  inputActive.value = "all";
  inputDateFrom.value = "";
  inputDateTo.value = "";
};

const applyClientFilter = (rows, filter) => {
  const id = parseOptionalInt(filter.id);
  const qty = parseOptionalInt(filter.qty);

  if (!id.valid || !qty.valid) {
    return [];
  }

  const normalizedName = String(filter.name ?? "").toLowerCase();
  const status = String(filter.status ?? "").toUpperCase();
  const active = String(filter.active ?? "all").toLowerCase();
  const dateFrom = String(filter.dateFrom ?? "").trim();
  const dateTo = String(filter.dateTo ?? "").trim();
  const useDateRange = Boolean(dateFrom && dateTo);

  if (!["all", "true", "false"].includes(active)) {
    return [];
  }

  return rows.filter((item) => {
    if (id.hasValue && Number(item.id) !== id.value) return false;
    if (qty.hasValue && Number(item.qty) !== qty.value) return false;
    if (status && item.status !== status) return false;
    if (normalizedName && !String(item.name ?? "").toLowerCase().includes(normalizedName)) return false;

    if (active === "true" && item.active !== true) return false;
    if (active === "false" && item.active !== false) return false;

    if (useDateRange) {
      if (!item.date) return false;
      if (item.date < dateFrom || item.date > dateTo) return false;
    }

    return true;
  });
};

const searchRows = async (param = {}) => {
  const normalized = normalizeSearchParam(param);
  currentPageSize = normalized.paging.pageSize;
  const mode = grid?.option?.pagingMode || "server";

  if (mode === "client") {
    const response = await api.list();
    const rows = Array.isArray(response?.items) ? response.items : [];
    const filtered = applyClientFilter(rows, normalized.filter);

    return {
      list: filtered,
      param: {
        ...normalized,
        paging: {
          ...normalized.paging,
          totalCount: filtered.length,
        },
      },
    };
  }

  const response = await api.searchServer(normalized);
  const rows = Array.isArray(response?.items) ? response.items : [];

  return {
    list: rows,
    param: {
      ...normalized,
      paging: normalizePaging(response?.paging || normalized.paging),
    },
  };
};

const fields = [
  { name: "id", title: "ID", element: "text", width: "60px", align: "center" },
  { name: "name", title: "Name", element: "text", width: "180px", emptyText: "-" },
  { name: "qty", title: "Qty", element: "number", width: "80px", align: "right" },
  { name: "status", title: "Status", element: "text", width: "110px", align: "center" },
  { name: "date", title: "Date", element: "text", width: "120px", align: "center", emptyText: "-" },
  { name: "active", title: "Active", element: "text", width: "80px", align: "center" },
];

const createGrid = () => {
  const target = document.getElementById("grid");
  if (target) {
    target.replaceChildren();
  }

  grid = new wgrid("grid", {
    fields,
    option: {
      isHead: true,
      isPaging: true,
      pagingMode: pagingModeSelect?.value || "server",
      paging: {
        pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
        pageSize: getCurrentPageSize(),
        showPageSizeSelector: true,
      },
      isRowStatusColor: false,
      style: {
        width: "100%",
        height: 360,
        overflow: { y: "auto", x: "hidden" },
        row: { cursor: "default", isChose: false },
      },
    },
    search: searchRows,
    loaded: (instance) => {
      log(`sample-paging grid loaded (${instance?.option?.pagingMode || "unknown"})`);
    },
  });
};

const runAction = async (action) => {
  try {
    await action();
  } catch (error) {
    const message = error?.message || "unknown error";
    setError(message);
    log({ type: "error", message });
  }
};

const runSearch = async (pageNo = 1) => {
  if (!grid) {
    throw new Error("grid is not initialized");
  }
  
  const param = {
    filter: readFilterFromForm(),
    paging: {
      pageNo,
      pageSize: getCurrentPageSize(),
      pageBlock: DEFAULT_PAGE_BLOCK,
    },
  };

  const result = await grid.search(param);
  currentPageSize = Number.parseInt(result?.param?.paging?.pageSize, 10) || getCurrentPageSize();

  grid.setData(result.list, result.param);

  log({
    sample: "sample-paging",
    mode: grid.option.pagingMode,
    pageNo: result.param?.paging?.pageNo,
    pageSize: result.param?.paging?.pageSize,
    totalCount: result.param?.paging?.totalCount,
    count: Array.isArray(result.list) ? result.list.length : 0,
    filter: result.param?.filter,
  });
};

btnSearch.addEventListener("click", () =>
  runAction(async () => {
    await runSearch(1);
  })
);

btnReload.addEventListener("click", () =>
  runAction(async () => {
    await runSearch(1);
  })
);

btnReset.addEventListener("click", () =>
  runAction(async () => {
    clearFilterForm();
    await runSearch(1);
  })
);

[inputId, inputName, inputQty, inputStatus, inputActive, inputDateFrom, inputDateTo].forEach((element) => {
  element.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    runAction(async () => {
      await runSearch(1);
    });
  });
});

if (pagingModeSelect) {
  pagingModeSelect.addEventListener("change", () =>
    runAction(async () => {
      createGrid();
      await runSearch(1);
    })
  );
}

runAction(async () => {
  clearFilterForm();
  createGrid();
  await runSearch(1);
});
