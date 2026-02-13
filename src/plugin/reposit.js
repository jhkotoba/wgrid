import { util } from './util.js';
import { constant } from "./constant.js";
import { status } from "./status.js";
import { creator } from "./creator.js";

// grid sequence
let sequence = 1;

// row data
let data = {};

// default insert row
let basic = {};

// request/search params
let parameter = {};

// source rows for client paging mode
let pagingSource = {};

// field schema
let fields = {};

/**
 * grid data repository
 */
export const reposit = {

    init: (self, params) => init(self, params),

    getFields: (self) => fields[self.sequence],

    setData: (self, list, params) => setData(self, list, params),

    appendData: (self, row) => data[self.sequence].data.push(row),

    getDeepData: (self, index) => getDeepData(self, index),

    getData: (self, index) => getData(self, index),

    getOriginData: (self) => data[self.sequence].originData,

    getDataSize: (self) => data[self.sequence].data.length,

    getDataRowSeq: (self, rowSeq) => data[self.sequence].data[status.getSeqIndex(self, rowSeq)],

    getDataIndex: (self, index) => data[self.sequence].data[index],

    getSelectData: (self) => data[self.sequence].data.filter(item => isSelect(item._state)),

    getInsertData: (self) => data[self.sequence].data.filter(item => isInsert(item._state)),

    getUpdateData: (self) => data[self.sequence].data.filter(item => isUpdate(item._state)),

    getDeleteData: (self) => data[self.sequence].data.filter(item => isDelete(item._state)),

    getApplyData: (self) => data[self.sequence].data.filter(item => !isSelect(item._state)),

    getBasicInsertData: (self) => basic[self.sequence].insert,

    getParameter: (self) => parameter[self.sequence],

    getPagingSource: (self) => getPagingSource(self),

    getPagingData: (self) => parameter[self.sequence]?.paging
}

const toPositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    if(Number.isNaN(parsed) || parsed < 1){
        return fallback;
    }
    return parsed;
}

const normalizePageSizeOptions = (list) => {
    const defaultList = [10, 20, 50, 100];
    if(!Array.isArray(list)){
        return defaultList;
    }

    const normalized = [...new Set(
        list
            .map(value => toPositiveInt(value, null))
            .filter(value => value !== null)
    )];

    return normalized.length > 0 ? normalized : defaultList;
}

const init = (self, params) => {

    self.sequence = sequence++;

    data[self.sequence] = {
        data: [],
        originData: {},
        editData: {}
    };

    basic[self.sequence] = {};
    basic[self.sequence].insert = params?.data?.insert === undefined ? null : params.data.insert;

    fields[self.sequence] = params.fields;
    const pageSizeOptions = normalizePageSizeOptions(params?.option?.paging?.pageSizeOptions ?? params?.option?.paging?.pageSizes);
    const pageSize = pageSizeOptions.includes(toPositiveInt(params?.option?.paging?.pageSize, pageSizeOptions[0]))
        ? toPositiveInt(params?.option?.paging?.pageSize, pageSizeOptions[0])
        : pageSizeOptions[0];

    parameter[self.sequence] = {
        paging: {
            pageNo: 1,
            pageSize,
            pageBlock: 5,
            totalCount: 0
        }
    };

    pagingSource[self.sequence] = [];
}

const getDeepData = (self, index) => {
    if(util.isEmpty(index)){
        return JSON.parse(JSON.stringify(data[self.sequence].data));
    }else{
        return JSON.parse(JSON.stringify(data[self.sequence].data[index]));
    }
}

const getData = (self, index) => {

    if(util.isEmpty(index)){
        return data[self.sequence].data;
    }else{
        return data[self.sequence].data[index];
    }
}

const getPagingSource = (self) => {
    if(!Array.isArray(pagingSource[self.sequence])){
        return [];
    }
    return JSON.parse(JSON.stringify(pagingSource[self.sequence]));
}

const toSafeInt = (value, fallback, min = 1) => {
    const parsed = Number.parseInt(value, 10);
    if(Number.isNaN(parsed)){
        return fallback;
    }
    if(parsed < min){
        return min;
    }
    return parsed;
}

const normalizePaging = (paging, totalCount) => {
    const safeTotalCount = toSafeInt(totalCount, 0, 0);
    const pageSize = toSafeInt(paging?.pageSize, 10, 1);
    const pageBlock = toSafeInt(paging?.pageBlock, 5, 1);
    const maxPageNo = Math.max(1, Math.ceil(safeTotalCount / pageSize));
    const pageNo = Math.min(toSafeInt(paging?.pageNo, 1, 1), maxPageNo);

    return {
        pageNo,
        pageSize,
        pageBlock,
        totalCount: safeTotalCount
    };
}

const cloneList = (list) => JSON.parse(JSON.stringify(Array.isArray(list) ? list : []));

const setData = (self, list, params) => {

    let renderList = cloneList(list);
    const baseParam = params && typeof params === 'object' ? JSON.parse(JSON.stringify(params)) : {};

    if(self.option.isPaging === true){
        if(self.option.pagingMode === 'client'){
            pagingSource[self.sequence] = cloneList(list);

            const paging = normalizePaging(baseParam.paging, pagingSource[self.sequence].length);
            const startIdx = (paging.pageNo - 1) * paging.pageSize;
            const endIdx = startIdx + paging.pageSize;

            renderList = cloneList(pagingSource[self.sequence].slice(startIdx, endIdx));
            parameter[self.sequence] = { ...baseParam, paging };
        }else{
            let totalCount = baseParam?.paging?.totalCount;
            if(totalCount === undefined || totalCount === null){
                totalCount = renderList.length;
            }

            const paging = normalizePaging(baseParam.paging, totalCount);
            parameter[self.sequence] = { ...baseParam, paging };
            pagingSource[self.sequence] = [];
        }
    }else{
        pagingSource[self.sequence] = [];
    }

    for(let item of renderList){
        item._rowSeq = status.getNextSeq(self);
        item._state = constant.row.status.select;
    }

    data[self.sequence].data = renderList;
    data[self.sequence].originData = {};

    data[self.sequence].data.forEach(item => {
        data[self.sequence].originData[item._rowSeq] = JSON.parse(JSON.stringify(item));
    });

    creator.refresh(self);
}

const isSelect = state => constant.row.status.select === state;
const isInsert = state => constant.row.status.insert === state;
const isUpdate = state => constant.row.status.update === state;
const isDelete = state => constant.row.status.remove === state;
const isRemove = state => constant.row.status.remove === state;
