const pad2 = (value) => String(value).padStart(2, "0");
const statuses = ["NEW", "DONE", "HOLD"];

const DEFAULT_ITEMS = Array.from({ length: 120 }, (_, index) => {
  const id = index + 1;
  const month = Math.floor(index / 30) + 1;
  const day = (index % 28) + 1;
  const hasDate = id % 10 !== 0;

  return {
    id,
    name: `Item-${String(id).padStart(3, "0")}`,
    qty: (id * 3) % 25,
    status: statuses[index % statuses.length],
    active: id % 2 === 1,
    date: hasDate ? `2026-${pad2(month)}-${pad2(day)}` : "",
  };
});

const STATUS_SET = new Set(["NEW", "DONE", "HOLD"]);

const clone = (value) => JSON.parse(JSON.stringify(value));

let items = clone(DEFAULT_ITEMS);
let nextId = items.reduce((max, item) => Math.max(max, item.id), 0) + 1;

const toBoolean = (value) => value === true || value === "true" || value === 1 || value === "1";
const toInteger = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const normalizePayload = (payload = {}) => {
  const status = STATUS_SET.has(payload.status) ? payload.status : "NEW";
  return {
    name: String(payload.name ?? "").trim(),
    qty: toInteger(payload.qty, 0),
    status,
    active: toBoolean(payload.active),
    date: String(payload.date ?? "").trim(),
  };
};

const listItems = () => clone(items);

const getItem = (id) => {
  const found = items.find((item) => item.id === id);
  return found ? clone(found) : null;
};

const createItem = (payload) => {
  const normalized = normalizePayload(payload);
  if (!normalized.name) {
    return { error: "name is required" };
  }
  const created = { id: nextId++, ...normalized };
  items.push(created);
  return { item: clone(created) };
};

const updateItem = (id, payload) => {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) {
    return { error: "item not found" };
  }
  const normalized = normalizePayload(payload);
  if (!normalized.name) {
    return { error: "name is required" };
  }
  const updated = { id, ...normalized };
  items[index] = updated;
  return { item: clone(updated) };
};

const deleteItem = (id) => {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) {
    return { error: "item not found" };
  }
  const [deleted] = items.splice(index, 1);
  return { item: clone(deleted) };
};

const applyItems = (changeItems = []) => {
  if (!Array.isArray(changeItems)) {
    return { error: "items must be an array" };
  }

  const workingItems = clone(items);
  let workingNextId = nextId;
  const result = { created: [], updated: [], deleted: [] };

  const findIndexById = (id) => workingItems.findIndex((item) => item.id === id);

  for (let i = 0; i < changeItems.length; i += 1) {
    const raw = changeItems[i] || {};
    const state = String(raw._state || raw.state || "").toUpperCase();

    if (state === "INSERT") {
      const normalized = normalizePayload(raw);
      if (!normalized.name) {
        return { error: `name is required (index ${i})` };
      }
      const created = { id: workingNextId++, ...normalized };
      workingItems.push(created);
      result.created.push(clone(created));
      continue;
    }

    if (state === "UPDATE") {
      const id = toInteger(raw.id, Number.NaN);
      if (Number.isNaN(id)) {
        return { error: `id is required for update (index ${i})` };
      }
      const index = findIndexById(id);
      if (index < 0) {
        return { error: `item not found for update (id ${id})` };
      }
      const normalized = normalizePayload(raw);
      if (!normalized.name) {
        return { error: `name is required (index ${i})` };
      }
      const updated = { id, ...normalized };
      workingItems[index] = updated;
      result.updated.push(clone(updated));
      continue;
    }

    if (state === "REMOVE" || state === "DELETE") {
      const id = toInteger(raw.id, Number.NaN);
      if (Number.isNaN(id)) {
        return { error: `id is required for delete (index ${i})` };
      }
      const index = findIndexById(id);
      if (index < 0) {
        return { error: `item not found for delete (id ${id})` };
      }
      const [deleted] = workingItems.splice(index, 1);
      result.deleted.push(clone(deleted));
      continue;
    }

    return { error: `invalid state '${state}' (index ${i})` };
  }

  items = workingItems;
  nextId = workingNextId;

  return { ...result, items: clone(items) };
};

const parseOptionalInteger = (value) => {
  if (value === undefined || value === null || value === "") {
    return { hasValue: false, value: null, isValid: true };
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return { hasValue: true, value: null, isValid: false };
  }
  return { hasValue: true, value: parsed, isValid: true };
};

const normalizeActiveFilter = (value) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized || normalized === "all") return "all";
  if (normalized === "true") return "true";
  if (normalized === "false") return "false";
  return "invalid";
};

const normalizeSearchFilters = (filters = {}) => {
  const id = parseOptionalInteger(filters.id);
  const qty = parseOptionalInteger(filters.qty);
  const status = String(filters.status ?? "").trim().toUpperCase();
  const name = String(filters.name ?? "").trim().toLowerCase();
  const active = normalizeActiveFilter(filters.active);
  const dateFrom = String(filters.dateFrom ?? "").trim();
  const dateTo = String(filters.dateTo ?? "").trim();
  const useDateRange = Boolean(dateFrom && dateTo);

  return {
    id,
    qty,
    status,
    name,
    active,
    dateFrom,
    dateTo,
    useDateRange,
  };
};

const filterItems = (filters = {}) => {
  const normalized = normalizeSearchFilters(filters);

  if (!normalized.id.isValid || !normalized.qty.isValid || normalized.active === "invalid") {
    return [];
  }

  return listItems().filter((item) => {
    if (normalized.id.hasValue && item.id !== normalized.id.value) return false;
    if (normalized.qty.hasValue && item.qty !== normalized.qty.value) return false;
    if (normalized.status && item.status !== normalized.status) return false;
    if (normalized.name && !String(item.name ?? "").toLowerCase().includes(normalized.name)) return false;

    if (normalized.active === "true" && item.active !== true) return false;
    if (normalized.active === "false" && item.active !== false) return false;

    if (normalized.useDateRange) {
      if (!item.date) return false;
      if (item.date < normalized.dateFrom || item.date > normalized.dateTo) return false;
    }

    return true;
  });
};

const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return parsed;
};

const searchItems = (filters = {}, paging = {}) => {
  const rows = filterItems(filters);
  const pageNo = toPositiveInteger(paging.pageNo, 1);
  const pageSize = toPositiveInteger(paging.pageSize, 10);
  const pageBlock = toPositiveInteger(paging.pageBlock, 5);
  const totalCount = rows.length;
  const maxPageNo = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePageNo = Math.min(pageNo, maxPageNo);
  const start = (safePageNo - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: rows.slice(start, end),
    paging: {
      pageNo: safePageNo,
      pageSize,
      pageBlock,
      totalCount,
    },
  };
};

module.exports = {
  listItems,
  filterItems,
  searchItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  applyItems,
};
