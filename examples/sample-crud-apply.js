import wgrid from "../src/wgrid.js";
import { renderSampleMenu } from "./menu.js";

const $ = (selector) => document.querySelector(selector);
const output = $("#output");
const loading = $("#loading");
const errorMessage = $("#error-message");
const themeSelect = $("#theme-select");
const themeLink = document.getElementById("wgrid-theme");
const actionButtons = Array.from(document.querySelectorAll("[data-api-action]"));

const CHECK_FIELD = "checked";
const EDITABLE_FIELDS = ["name", "qty", "status", "date", "active"];

let pendingRequests = 0;
let originById = new Map();
renderSampleMenu("#sample-menu", "sample-crud-apply");

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
  actionButtons.forEach((button) => {
    button.disabled = busy;
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

  const href = themeMap[theme] ?? themeMap.white;
  themeLink.setAttribute("href", href);
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
  apply: (items) => request("/api/items/apply", { method: "POST", body: { items } }),
};

const runAction = async (action) => {
  try {
    await action();
  } catch {
    // request() handles visible errors.
  }
};

const normalizeApplyRow = (row) => ({
  _state: row._state,
  id: row.id,
  name: String(row.name ?? "").trim(),
  qty: Number.parseInt(row.qty ?? 0, 10) || 0,
  status: row.status || "NEW",
  date: String(row.date ?? "").trim(),
  active: Boolean(row.active),
});

const rebuildOriginMap = (rows) => {
  originById = new Map();
  rows.forEach((row) => {
    if (row?.id !== undefined && row?.id !== null) {
      originById.set(Number(row.id), { ...row });
    }
  });
};

const getRows = () => grid.getData();

const findRowIndexBySeq = (rowSeq) =>
  getRows().findIndex((row) => String(row._rowSeq) === String(rowSeq));

const setChecked = (rowSeq, checked) => {
  const checkbox = grid.getSeqCellElement(rowSeq, CHECK_FIELD);
  if (!checkbox) return;
  checkbox.checked = checked;
};

const ensureCheckedIfChanged = (rowSeq) => {
  const row = getRows().find((item) => String(item._rowSeq) === String(rowSeq));
  if (!row) return;
  if (["INSERT", "UPDATE", "REMOVE"].includes(row._state)) {
    setChecked(rowSeq, true);
  }
};

const markRowAsUpdate = (rowIdx, rowSeq) => {
  const row = getRows()[rowIdx];
  if (!row) return;
  if (row._state === "SELECT") {
    grid.modifyRow(rowIdx, rowSeq);
  }
  ensureCheckedIfChanged(rowSeq);
};

const restoreUpdatedRowFromOrigin = (rowSeq, row) => {
  const id = Number(row.id);
  if (Number.isNaN(id)) return;

  const original = originById.get(id);
  if (!original) return;

  EDITABLE_FIELDS.forEach((name) => {
    const element = grid.getSeqCellElement(rowSeq, name);
    if (!element) return;

    if (element.type === "checkbox") {
      element.checked = Boolean(original[name]);
    } else {
      element.value = original[name] ?? "";
    }

    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
};

const fields = [
  { name: CHECK_FIELD, title: "", element: "checkbox", width: "48px" },
  { name: "id", title: "ID", element: "text", width: "60px", align: "center", emptyText: "-" },
  { name: "name", title: "Name", element: "text-edit", width: "180px" },
  { name: "qty", title: "Qty", element: "number-edit", width: "80px", align: "right" },
  {
    name: "status",
    title: "Status",
    element: "select",
    width: "110px",
    data: {
      select: {
        list: [
          { value: "NEW", text: "NEW" },
          { value: "DONE", text: "DONE" },
          { value: "HOLD", text: "HOLD" },
        ],
      },
    },
  },
  { name: "date", title: "Date", element: "date-edit", width: "120px" },
  { name: "active", title: "Active", element: "checkbox", width: "80px" },
];

const grid = new wgrid("grid", {
  fields,
  option: {
    isHead: true,
    isRowStatusColor: true,
    isRowStatusObserve: false,
    style: {
      width: "100%",
      height: 420,
      overflow: { y: "auto", x: "hidden" },
      row: { cursor: "default", isChose: false },
    },
    checkbox: { check: true, uncheck: false },
  },
  event: {
    change: (event, row, index, seq) => {
      if (!row || !event?.target) return;
      if (event.target.name !== CHECK_FIELD) {
        markRowAsUpdate(index, seq);
      }
    },
    keyup: (event, row, index, seq) => {
      if (!row || !event?.target) return;
      if (event.target.name !== CHECK_FIELD) {
        markRowAsUpdate(index, seq);
      }
    },
  },
  loaded: () => log("sample-crud-apply grid loaded"),
});

const refreshGrid = async () => {
  const response = await api.list();
  const rows = Array.isArray(response?.items) ? response.items : [];

  grid.setData(rows, {});
  grid.setAllChecked(CHECK_FIELD, false);
  rebuildOriginMap(rows);
  log({ sample: "sample-crud-apply", type: "list", count: rows.length });
};

const deleteCheckedRows = () => {
  const checkedSeqs = grid.getNameCheckedSeqs(CHECK_FIELD);
  if (!checkedSeqs.length) {
    setError("sample-crud-apply: select rows to mark as delete.");
    return;
  }

  checkedSeqs.forEach((seq) => {
    const rowIdx = findRowIndexBySeq(seq);
    if (rowIdx < 0) return;

    const row = getRows()[rowIdx];
    if (!row) return;

    if (row._state === "INSERT") {
      grid.deleteRow(rowIdx, seq);
      return;
    }

    if (row._state === "UPDATE") {
      restoreUpdatedRowFromOrigin(seq, row);
    }

    grid.removeRow(rowIdx, seq, {
      isDisabled: true,
      exceptDisabledList: [CHECK_FIELD],
    });
    setChecked(seq, true);
  });

  log({ sample: "sample-crud-apply", type: "marked-remove", checkedSeqs });
};

const applyChanges = async () => {
  const applyList = grid.getApplyData().map(normalizeApplyRow);
  if (!applyList.length) {
    log("sample-crud-apply: no pending changes to apply.");
    return;
  }

  const response = await api.apply(applyList);
  const rows = Array.isArray(response?.items) ? response.items : [];

  grid.setData(rows, {});
  grid.setAllChecked(CHECK_FIELD, false);
  rebuildOriginMap(rows);

  log({
    sample: "sample-crud-apply",
    type: "applied",
    created: response?.created?.length ?? 0,
    updated: response?.updated?.length ?? 0,
    deleted: response?.deleted?.length ?? 0,
  });
};

$("#btn-reload").addEventListener("click", () =>
  runAction(async () => {
    await refreshGrid();
  })
);

$("#btn-add-row").addEventListener("click", () => {
  setError("");
  grid.appendRow();

  const insertRows = grid.getInsertData();
  const latest = insertRows[insertRows.length - 1];
  if (latest?._rowSeq !== undefined) {
    setChecked(latest._rowSeq, true);
    const input = grid.getSeqCellElement(latest._rowSeq, "name");
    if (input) input.focus();
  }

  log({ sample: "sample-crud-apply", type: "append-row", insertCount: insertRows.length });
});

$("#btn-delete-checked").addEventListener("click", () => {
  setError("");
  deleteCheckedRows();
});

$("#btn-apply").addEventListener("click", () =>
  runAction(async () => {
    await applyChanges();
  })
);

runAction(async () => {
  await refreshGrid();
});
