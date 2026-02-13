import { util } from './util.js';
import { reposit } from "./reposit.js";

// 그리드 상태 데이터
let states = {};

/**
 * 그리드 상태관련 객체
 */
export const status = {

    /**
     * 그리드 상태 객체 초기설정
     * @param {*} self 
     * @returns 
     */
    init: (self) => init(self),

    /**
     * 그리드 상태 초기화
     * @param {*} self 
     * @returns 
     */
    clean: (self) => clean(self), 
    
    /**
     * 다음시퀀스 가져오기(시퀀스 증가)
     * @param {*} self 
     * @returns 
     */
    getCurSeq: (self) => states[self.sequence].curSeq,

    /**
     * 다음시퀀스 가져오기(시퀀스 증가)
     * @param {*} self 
     * @returns 
     */
    getNextSeq: (self) => ++states[self.sequence].curSeq,

    /**
     * key:sequence value: index 인덱싱 push
     * @param {*} self 
     * @param {string} sequence 
     * @param {string} index 
     */
    setSeqIndex: (self, sequence, index) => states[self.sequence].seqIndex[sequence] = index,

    /**
     * 시퀀스번호로 데이터의 index 가져오기
     * @param {*} self
     * @param {string} sequence 
     * @returns 
     */
    getSeqIndex: (self, sequence) => states[self.sequence].seqIndex[sequence],

    /**
     * key:index value: sequence 인덱싱 push
     * @param {*} self
     * @param {string} index 
     * @param {string} sequence 
     */
	setIdxSequence: (self, index, sequence) => states[self.sequence].idxSequence[index] = sequence,
		
    /**
     * index로 시퀀스번호 가져오기
     * @param {*} self
     * @param {string} index 
     * @returns 
     */
	getIdxSequence: (self, index) => states[self.sequence].idxSequence[index],

    /**
     * 최상위 rowElement 반환
     * @param {*} self
     * @returns
     */
    getFirstRowElement: (self) => status.getSeqRowElement(self, status.getIdxSequence(self, 0)),

    /**
     * 최상위 rowElement 반환
     * @param {*} self
     * @returns
     */
    getFirstRowSeq: (self) => status.getSeqRowElement(self, status.getIdxSequence(self, 0)).dataset.rowSeq,

    /**
     * 그리드 행 엘리먼트 인덱싱
     * @param {*} self 
     * @param {string} sequence 
     * @param {element} element 
     * @returns 
     */
    setSeqRowElement: (self, sequence, element) => states[self.sequence].seqRowElement[sequence] = element,

    /**
     * 그리드 행 엘리먼트 가져오기
     * @param {*} self 
     * @param {*} sequence 
     * @returns 
     */
    getSeqRowElement: (self, sequence) => states[self.sequence].seqRowElement[sequence],

    /**
     * 그리드 셀 엘리먼트 인덱싱
     * @param {*} self 
     * @param {string} sequence 
     * @param {string} name 
     * @param {element} element 
     * @returns 
     */
    setSeqCellElement: (self, sequence, name, element) => {
        if(!states[self.sequence].seqCellElement[sequence]) states[self.sequence].seqCellElement[sequence] = {}
        states[self.sequence].seqCellElement[sequence][name] = element;
    },

    /**
     * 그리드 셀 엘리먼트 가져오기
     * @param {*} self 
     * @param {string/number} sequence 
     * @param {string} name 
     * @returns 
     */
    getSeqCellElement: (self, sequence, name) => states[self.sequence].seqCellElement[sequence][name],

    /**
     * name값으로 체크된 체크박스된 엘리먼트 가져오기
     * @param {*} self
     * @param {string} name 
     * @returns
     */
    getCheckedCellElement: (self, name) => getCheckedCellElement(self, name),

    /**
     * name값으로 체크된 체크박스 seq(list)번호 가져오기
     * @param {*} self
     * @param {string} name 
     * @returns 
     */
    getNameCheckedSeqs: (self, name) => getNameCheckedSeqs(self, name),

    /**
     * name값으로 체크된 체크박스 행 데이터(itemList) 가져오기
     * @param {*} self
     * @param {string} name 
     * @returns 
     */
    getNameCheckedItems: (self, name) => getNameCheckedItems(self, name),

    /**
     * name값으로 body 체크박스 전체 선택/해제
     * @param {string} name 
     * @param {boolean} bool 
     * @returns 
     */
    setAllChecked: (self, name, bool) => setAllChecked(self, name, bool),

    /**
     * 데이터 재 인덱싱
     * @param {*} self 
     * @param {*} rowSequence 
     * @returns 
     */
    dataReIndexing: (self, rowSequence) => reIndexing(self, rowSequence),

    /**
     * 그리드 옵션 세팅
     * @param {*} self 
     * @param {*} option 
     * @returns 
     */
    settingOption: (self, option) => settingOption(self, option),

    /**
     * 옵션변경
     * @param {*} self 
     * @param {*} optionName 
     * @param {*} value 
     * @returns 
     */
    changeOption: (self, optionName, value) => changeOption(self, optionName, value),
}

/**
 * 그리드 상태 세팅 생성
 * @param {*} self 
 */
const init = (self) => {

    // 그리드 상태값 생성
    states[self.sequence] = {
        // 현재 시퀀스
        curSeq: 0,
        // 데이터 맵 key sequence value index
        seqIndex: {},
        // 데이터 맵 key index value sequence
        idxSequence: {},
        // 테이터 맵 key sequence value name element
        seqRowElement: {},
        // 테이터 맵 key sequence value name element
        seqCellElement: {}
    }
}

/**
 * 그리드 상태 정리
 * @param {*} self 
 */
const clean = (self) => {
    // 그리드 상태 초기화
    states[self.sequence].seqIndex = {};
    states[self.sequence].idxSequence = {};
    states[self.sequence].seqRowElement = {};
    states[self.sequence].seqCellElement = {};
}

/**
 * 데이터 재 인덱싱
 * @param {*} self 
 * @param {*} rowSequence 
 */
const reIndexing = (self, rowSequence) => {

    let data = reposit.getData(self);
    let seqIndex = states[self.sequence].seqIndex;

    // seqIndex 재 인덱싱
    data.forEach((item, index) => seqIndex[item._rowSeq] = index);

    // sequence가 키인 데이터 삭제
    if(rowSequence){
        delete states[self.sequence].seqRowElement[rowSequence];
        delete states[self.sequence].seqCellElement[rowSequence];
    }
}

/**
 * name값으로 body 체크박스 전체 선택/해제
 * @param {*} self
 * @param {string} name 
 * @param {boolean} bool
 */
const setAllChecked = (self, name, bool) => {

    let cellElement = states[self.sequence].seqCellElement;
    let data = reposit.getData(self);

    for(let seq in cellElement){
        cellElement[seq][name].checked = bool;
        data[status.getSeqIndex(self, seq)][name] = bool == true ? self.option.checkbox.check : self.option.checkbox.uncheck;
    }
}

/**
 * name값으로 체크된 체크박스된 엘리먼트 가져오기
 * @param {*} self
 * @param {string} name 
 * @returns
 */
const getCheckedCellElement = (self, name) => {
    return Object.entries(states[self.sequence].seqCellElement)
        .filter(f => f[1][name].checked == true)
        .flatMap(fm => fm[1][name]);
};

/**
 * name값으로 체크된 체크박스 seq(list)번호 가져오기
 * @param {*} self
 * @param {string} name 
 * @returns 
 */
const getNameCheckedSeqs = (self, name) => {

    let seqList = [];
    getCheckedCellElement(self, name)
        .forEach(check => seqList.push(Number(util.getTrNode(check).dataset.rowSeq)));

    return seqList;
};

/**
 * name값으로 체크된 체크박스 행 데이터(itemList) 가져오기
 * @param {*} self
 * @param {string} name 
 * @returns 
 */
const getNameCheckedItems = (self, name) => {
    let itemList = [];
    getCheckedCellElement(self, name)
        .forEach(check => itemList.push(reposit.getDataIndex(self, status.getSeqIndex(self, util.getTrNode(check).dataset.rowSeq))));
    return JSON.parse(JSON.stringify(itemList));
}

/**
 * 그리드 옵션세팅
 */
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

const settingOption = (self, option) => {

    // 옵션 객체 생성
    self.option = {};

    /**
     * 그리드 스타일 옵션
     */
    self.option.style = {};
    // 넓이 (기본값: 100%)
    self.option.style.width = option?.style?.width === undefined ? '100%' : option.style.width;
    // 높이 (기본값: 500px)
    self.option.style.height = option?.style?.height === undefined ? '500px' : option.style.height; 
    
    // 스크롤바 설정
    self.option.style.overflow = {}
    // 스크롤바 y 설정
    self.option.style.overflow.y = option?.style?.overflow?.y === undefined ? null : option.style.overflow.y;
    // 스크롤바 x 설정
    self.option.style.overflow.x = option?.style?.overflow?.x === undefined ? null : option.style.overflow.x;
    
    // 행 스타일 설정
    self.option.style.row = {};
    // 행 마우스 커서 설정
    self.option.style.row.cursor = option?.style?.row?.cursor === undefined ? 'inherit' : option.style.row.cursor;
    // 행 선택 스타일 여부 설정
    self.option.style.row.isChose = option?.style?.row?.isChose === undefined ? false : option.style.row.isChose;

    /**
     * 그리드 헤드 표시여부
     * 기본값: true
     */
    self.option.isHead = option?.isHead === undefined ? true : option.isHead;
    
    /**
     * 페이지 사용여부
     * 기본값 : false
     */
    self.option.isPaging = option?.isPaging === undefined ? false : option.isPaging;
    self.option.pagingMode =
        String(option?.pagingMode === undefined ? "server" : option.pagingMode).toLowerCase() === "client"
            ? "client"
            : "server";
    self.option.paging = {};
    self.option.paging.pageSizeOptions = normalizePageSizeOptions(option?.paging?.pageSizeOptions ?? option?.paging?.pageSizes);
    self.option.paging.pageSize = self.option.paging.pageSizeOptions.includes(toPositiveInt(option?.paging?.pageSize, self.option.paging.pageSizeOptions[0]))
        ? toPositiveInt(option?.paging?.pageSize, self.option.paging.pageSizeOptions[0])
        : self.option.paging.pageSizeOptions[0];
    self.option.paging.showPageSizeSelector = option?.paging?.showPageSizeSelector === undefined
        ? (option?.paging?.isPageSizeControl === undefined ? true : Boolean(option.paging.isPageSizeControl))
        : Boolean(option.paging.showPageSizeSelector);

    /**
     * 더블클릭 사용여부
     * 기본값 : false
     */
    self.option.isDblClick = option?.isDblClick === undefined ? false : option.isDblClick;

    /**
     * 그리드 빈 상태일 경우 옵션
     */
    self.option.empty = {};
    self.option.empty.message = option?.empty?.message === undefined ? 'No Data' : option.empty.message;

    /**
     * 그리드 행 상태별 색상 적용 여부
     * 기본값: true
     * isRowStatusObserve true 설정시 무시됨
     */
    self.option.isRowStatusColor = option?.isRowStatusColor === undefined ? true : option.isRowStatusColor;

    /**
     * 그리드 행 상태변경시 상태색상 자동 적용
     * 기본값: false
     * true 적용시 isRowStatusColor 값 true 적용
     */
    self.option.isRowStatusObserve = option?.isRowStatusObserve === undefined ? false : option.isRowStatusObserve;
    // 행 상태변경 옵션
    self.option.rowStatusObserve = {};
    // 행 상태변경 태그변경 여부 옵션 (단순 행상태 변경인지 태그재생성인지 여부)
    self.option.rowStatusObserve.isRowEditMode = option?.rowStatusObserve?.isRowEditMode === undefined ? false : option.rowStatusObserve.isRowEditMode;
    // 행 상태변경 예외 항목 설정 (field의 name값을 List 형태로 전달)
    self.option.rowStatusObserve.exceptList = option?.rowStatusObserve?.exceptList === undefined ? [] : option.rowStatusObserve.exceptList;
    if(self.option.isRowStatusObserve === true){
        self.option.isRowStatusColor = true;
    }
    
    /**
     * 체크박스 선택시 기본값 설정
     */
    self.option.checkbox = {};
    self.option.checkbox.check = option?.checkbox?.check === undefined ? true : option.checkbox.check;
    self.option.checkbox.uncheck = option?.checkbox?.uncheck === undefined ? false : option.checkbox.uncheck;

    /**
     * @deprecated
     * 신규행 생성시 기본값 설정
     */
    //self.option.data = {};
    //self.option.data.insert = option?.data?.insert === undefined ? null : option.data.insert;
}

/**
 * 옵션변경
 * @param {*} self 
 * @param {*} optionName 
 * @param {*} value 
 */
const INVALID_OPTION_PATH_KEYS = ['__proto__', 'prototype', 'constructor'];

const parseChangeOptionValue = (value) => {
    if(typeof value !== 'string'){
        return value;
    }

    const trimmed = value.trim();
    if(trimmed.length === 0){
        return '';
    }

    if(trimmed === 'true'){
        return true;
    }
    if(trimmed === 'false'){
        return false;
    }
    if(trimmed === 'null'){
        return null;
    }
    if(trimmed === 'undefined'){
        return undefined;
    }

    if(/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(trimmed)){
        return Number(trimmed);
    }

    if(trimmed.startsWith('"') && trimmed.endsWith('"')){
        try{
            return JSON.parse(trimmed);
        }catch{
            return trimmed.slice(1, -1);
        }
    }

    if(trimmed.startsWith("'") && trimmed.endsWith("'")){
        return trimmed
            .slice(1, -1)
            .replace(/\\\\/g, '\\')
            .replace(/\\'/g, "'");
    }

    if(
        (trimmed.startsWith('{') && trimmed.endsWith('}'))
        || (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ){
        try{
            return JSON.parse(trimmed);
        }catch{
            return value;
        }
    }

    return value;
}

const toOptionPathList = (optionName) => {
    if(typeof optionName !== 'string'){
        throw new Error('optionName must be a string path.');
    }

    const normalized = optionName.trim().replace(/^self\./, '');
    if(normalized.length === 0){
        throw new Error('optionName must not be empty.');
    }

    const pathList = normalized.split('.').map(item => item.trim());
    if(pathList.some(item => item.length === 0)){
        throw new Error(`Invalid option path: ${optionName}`);
    }
    if(pathList.some(item => INVALID_OPTION_PATH_KEYS.includes(item))){
        throw new Error(`Unsafe option path: ${optionName}`);
    }
    if(pathList.some(item => !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(item) && !/^\d+$/.test(item))){
        throw new Error(`Unsupported option path: ${optionName}`);
    }

    return pathList;
}

const changeOption = (self, optionName, value) => {
    const pathList = toOptionPathList(optionName);
    const targetValue = parseChangeOptionValue(value);

    let target = self;
    pathList.slice(0, -1).forEach(path => {
        if(target[path] === undefined || target[path] === null || typeof target[path] !== 'object'){
            throw new Error(`Invalid option path: ${optionName}`);
        }
        target = target[path];
    });

    target[pathList[pathList.length - 1]] = targetValue;
}
