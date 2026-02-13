import wgrid from "../src/wgrid.js";
import { renderSampleMenu } from "./menu.js";

const $ = (selector) => document.querySelector(selector);
const output = $("#output");
const loading = $("#loading");
const errorMessage = $("#error-message");
const themeSelect = $("#theme-select");
const themeLink = document.getElementById("wgrid-theme");
const btnReload = $("#btn-reload");
const btnCreate = $("#btn-create");
const btnUpdate = $("#btn-update");
const btnDelete = $("#btn-delete");
const btnReset = $("#btn-reset");

const form = $("#item-form");
const inputId = $("#item-id");
const inputName = $("#item-name");
const inputQty = $("#item-qty");
const inputStatus = $("#item-status");
const inputDate = $("#item-date");
const inputActive = $("#item-active");

let pendingRequests = 0;
let selectedRowSeq = null;
let registerMode = false;
renderSampleMenu("#sample-menu", "sample-crud-single");

const log = (value) => {
  if (typeof value === "string") {
    output.textContent = value;
    return;
  }
  output.textContent = JSON.stringify(value, null, 2);
};

const syncActionButtons = () => {
  const busy = pendingRequests > 0;
  loading.hidden = !busy;

  btnReload.disabled = busy;
  btnCreate.disabled = busy;
  btnReset.disabled = busy;
  btnUpdate.disabled = busy || registerMode;
  btnDelete.disabled = busy || registerMode;
};

const setLoading = (isLoading) => {
  pendingRequests += isLoading ? 1 : -1;
  if (pendingRequests < 0) pendingRequests = 0;
  syncActionButtons();
};

const setRegisterMode = (enabled) => {
  registerMode = enabled;
  btnCreate.textContent = enabled ? "Register" : "Create";
  syncActionButtons();
};

const cancelRegisterMode = ({ reset = false, message = "" } = {}) => {
  if (!registerMode) return false;
  setRegisterMode(false);
  selectedRowSeq = null;
  if (reset) resetForm();
  if (message) log(message);
  return true;
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
  themeSelect.addEventListener("change", (event) => {
    applyTheme(event.target.value);
  });
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
  create: (item) => request("/api/items", { method: "POST", body: item }),
  update: (id, item) => request(`/api/items/${id}`, { method: "PUT", body: item }),
  remove: (id) => request(`/api/items/${id}`, { method: "DELETE" }),
};

const resetForm = () => {
  form.reset();
  inputId.value = "";
  inputStatus.value = "NEW";
};

const fillForm = (item) => {
  inputId.value = String(item.id ?? "");
  inputName.value = item.name ?? "";
  inputQty.value = String(item.qty ?? 0);
  inputStatus.value = item.status ?? "NEW";
  inputDate.value = item.date ?? "";
  inputActive.checked = Boolean(item.active);
};

const readForm = () => ({
  name: inputName.value.trim(),
  qty: Number.parseInt(inputQty.value || "0", 10),
  status: inputStatus.value,
  date: inputDate.value,
  active: inputActive.checked,
});

const getRowSeqById = (id) => {
  if (!id) return null;
  const row = grid.getData().find((item) => Number(item.id) === Number(id));
  if (row?._rowSeq === undefined || row?._rowSeq === null) return null;
  return String(row._rowSeq);
};

const getActiveRowSeq = () => {
  if (selectedRowSeq !== null) {
    const selectedRow = grid.getDataRowSeq(selectedRowSeq);
    if (selectedRow) return String(selectedRowSeq);
  }

  const id = getSelectedId();
  const rowSeq = getRowSeqById(id);
  if (!rowSeq) return null;
  selectedRowSeq = rowSeq;
  return rowSeq;
};

const syncFormFieldToGrid = (name, value) => {
  if (registerMode) return;

  const rowSeq = getActiveRowSeq();
  if (!rowSeq) return;

  const element = grid.getSeqCellElement(rowSeq, name);
  if (!element) return;

  if (element.type === "checkbox") {
    const next = Boolean(value);
    if (element.checked === next) return;
    element.checked = next;
  } else {
    const next = String(value ?? "");
    if (String(element.value ?? "") === next) return;
    element.value = next;
  }

  element.dispatchEvent(new Event("change", { bubbles: true }));
};

const getSelectedId = () => {
  const id = Number.parseInt(inputId.value, 10);
  return Number.isNaN(id) ? null : id;
};

const runAction = async (action) => {
  try {
    await action();
  } catch {
    // Error is already handled in request().
  }
};

const bindRowToForm = (row, index, seq, { logSelection = false, logCancel = false } = {}) => {
  if (!row) return;

  if (registerMode) {
    cancelRegisterMode({
      reset: true,
      message: logCancel ? "sample-crud-single register canceled by row selection" : "",
    });
    setError("");
  }

  selectedRowSeq = String(seq);
  fillForm(row);

  if (logSelection) {
    log({ sample: "sample-crud-single", type: "selected", index, seq, row });
  }
};

const fields = [
  { name: "id", title: "ID", element: "text", width: "60px", align: "center" },
  {
    name: "name",
    title: "Name",
    element: "text-edit",
    width: "160px",
    emptyText: "(empty)",
  },
  {
    name: "qty",
    title: "Qty",
    element: "number-edit",
    width: "80px",
    align: "right",
    loaded: (element) => {
      if (element?.tagName !== "INPUT") return;
      element.type = "number";
      element.step = "1";
    },
  },
  {
    name: "status",
    title: "Status",
    element: "select",
    width: "110px",
    data: {
      select: {
        empty: "-",
        list: [
          { value: "NEW", text: "NEW" },
          { value: "DONE", text: "DONE" },
          { value: "HOLD", text: "HOLD" },
        ],
      },
    },
  },
  {
    name: "date",
    title: "Date",
    element: "date-edit",
    width: "120px",
    loaded: (element) => {
      if (element?.tagName !== "INPUT") return;
      element.type = "date";
    },
  },
  { name: "active", title: "Active", element: "checkbox", width: "80px" },
];

const grid = new wgrid("grid", {
  fields,
  option: {
    isHead: true,
    isRowStatusColor: true,
    isRowStatusObserve: true,
    rowStatusObserve: { isRowEditMode: false, exceptList: [] },
    style: {
      width: "100%",
      height: 360,
      overflow: { y: "auto", x: "hidden" },
      row: { cursor: "pointer", isChose: true },
    },
    checkbox: { check: true, uncheck: false },
  },
  event: {
    click: (event, row, index, seq) => {
      bindRowToForm(row, index, seq, { logSelection: true, logCancel: true });
    },
    change: (event, row, index, seq) => {
      bindRowToForm(row, index, seq);
    },
    keyup: (event, row, index, seq) => {
      bindRowToForm(row, index, seq);
    },
  },
  loaded: () => log("sample-crud-single grid loaded"),
});

const refreshGrid = async () => {
  const response = await api.list();
  const rows = Array.isArray(response?.items) ? response.items : [];

  selectedRowSeq = null;
  grid.setData(rows, {});
  log({ sample: "sample-crud-single", type: "list", count: rows.length });
};

btnReload.addEventListener("click", () =>
  runAction(async () => {
    await refreshGrid();
  })
);

btnCreate.addEventListener("click", () =>
  runAction(async () => {
    if (!registerMode) {
      selectedRowSeq = null;
      resetForm();
      setError("");
      setRegisterMode(true);
      log("sample-crud-single register mode");
      return;
    }

    const response = await api.create(readForm());
    setRegisterMode(false);
    await refreshGrid();

    if (response?.item) {
      fillForm(response.item);
      selectedRowSeq = getRowSeqById(response.item.id);
      log({ type: "created", item: response.item });
    }
  })
);

btnUpdate.addEventListener("click", () =>
  runAction(async () => {
    const id = getSelectedId();
    if (!id) {
      setError("sample-crud-single: select an item before updating.");
      return;
    }

    const response = await api.update(id, readForm());
    await refreshGrid();

    if (response?.item) {
      fillForm(response.item);
      selectedRowSeq = getRowSeqById(response.item.id);
      log({ type: "updated", item: response.item });
    }
  })
);

btnDelete.addEventListener("click", () =>
  runAction(async () => {
    const id = getSelectedId();
    if (!id) {
      setError("sample-crud-single: select an item before deleting.");
      return;
    }
    if (!window.confirm(`Delete item ID ${id}?`)) return;

    const response = await api.remove(id);
    await refreshGrid();
    resetForm();

    log({ type: "deleted", item: response?.item ?? null });
  })
);

btnReset.addEventListener("click", () => {
  setError("");

  if (registerMode) {
    cancelRegisterMode({ reset: true, message: "sample-crud-single register canceled" });
    return;
  }

  selectedRowSeq = null;
  resetForm();
  log("sample-crud-single form reset");
});

inputName.addEventListener("input", () => {
  syncFormFieldToGrid("name", inputName.value);
});

inputQty.addEventListener("input", () => {
  const qty = Number.parseInt(inputQty.value || "0", 10);
  syncFormFieldToGrid("qty", Number.isNaN(qty) ? 0 : qty);
});

inputDate.addEventListener("change", () => {
  syncFormFieldToGrid("date", inputDate.value);
});

inputActive.addEventListener("change", () => {
  syncFormFieldToGrid("active", inputActive.checked);
});

runAction(async () => {
  setRegisterMode(false);
  resetForm();
  await refreshGrid();
});
