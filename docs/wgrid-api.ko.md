# wgrid API Guide (AI 중심)

기준 소스: `src/wgrid.js` (version `0.12.2`)

## Quick Start

```js
import wgrid from "./src/wgrid.js";

const grid = new wgrid("grid", {
  fields: [
    { name: "id", title: "ID", element: "text" },
    { name: "name", title: "Name", element: "text-edit" },
  ],
  option: {
    isHead: true,
    isPaging: false,
    isRowStatusColor: true,
    style: {
      width: "100%",
      height: 360,
      overflow: { y: "auto", x: "hidden" },
      row: { cursor: "default", isChose: false },
    },
  },
  event: {
    change: (event, row, rowIdx, rowSeq) => {
      console.log(event.type, row, rowIdx, rowSeq);
    },
  },
  loaded: (instance) => {
    console.log("wgrid loaded", instance);
  },
});

grid.setData([{ id: 1, name: "Alpha" }], {});
```

## Core Concepts

- `rowIdx`: 현재 렌더링 데이터 기준 행 인덱스(0부터 시작).
- `rowSeq`: wgrid가 부여하는 내부 고유 시퀀스 키(`_rowSeq`).
- `_state`: 행 상태 문자열.
  - `SELECT`: 기본/조회 상태
  - `INSERT`: 신규 추가 상태
  - `UPDATE`: 수정 상태
  - `REMOVE`: 삭제 표시 상태

## Constructor

### `new wgrid(target, parameter)`
- Signature: `new wgrid(target: string, parameter: object)`
- Params:
  - `target`: DOM element id.
  - `parameter.fields`: 컬럼 스키마 배열.
  - `parameter.option`: 그리드 옵션.
  - `parameter.event`: 전역 row/cell 이벤트 콜백 (`click`, `change`, `keyup`, `dblclick`).
  - `parameter.search`: `search()`와 페이지네이션에서 사용하는 async 검색 콜백.
  - `parameter.data.insert`: 신규 행 기본값(옵션).
  - `parameter.loaded`: 최초 렌더 후 호출되는 콜백.
- Returns: `wgrid` instance.
- State change: 저장소, 상태, 옵션, 플러그인, 이벤트 워처를 초기화.
- Side effects: target 하위에 그리드 DOM 생성, 리스너 바인딩, 브라우저 환경에서 `window.wgrid` 노출.
- Example:
  ```js
  const grid = new wgrid("grid", { fields, option, event, search, loaded });
  ```
- Related methods: `setData`, `search`, `getData`, `getPagingData`.

## API Reference

### `search`

#### `search(params)`
- Signature: `search(params: any)`
- Params: 사용자 정의 검색 파라미터 객체.
- Returns: `parameter.search`가 반환하는 값(일반적으로 `Promise<{ list, param }>`).
- State change: 자체적으로는 없음.
- Side effects: 등록된 `parameter.search` 콜백을 호출.
- Example:
  ```js
  const result = await grid.search({ filter: {}, paging: { pageNo: 1, pageSize: 20 } });
  grid.setData(result.list, result.param);
  ```
- Related methods: `setData`, `getPagingData`.

### Data Access and Loading

#### `getData()`
- Signature: `getData()`
- Params: 없음.
- Returns: 깊은 복사(deep clone)된 row 리스트.
- State change: 없음.
- Side effects: 없음.
- Example:
  ```js
  const rows = grid.getData();
  ```
- Related methods: `getDataRowSeq`, `getDataIndex`.

#### `getPagingData()`
- Signature: `getPagingData()`
- Params: 없음.
- Returns: paging 객체(`pageNo`, `pageSize`, `pageBlock`, `totalCount`) 가능 시 반환.
- State change: 없음.
- Side effects: 없음.
- Example:
  ```js
  const paging = grid.getPagingData();
  ```
- Related methods: `search`, `setData`.

#### `setData(list, param)`
- Signature: `setData(list: array, param?: object)`
- Params:
  - `list`: 소스 row 목록.
  - `param`: 요청/결과 메타데이터; paging 사용 시 `param.paging` 포함.
- Returns: `void`.
- State change:
  - 로드된 행에 `_rowSeq`, `_state = SELECT` 부여.
  - 원본 스냅샷 리셋.
  - client paging 모드면 전체 소스를 paging 캐시에 저장.
- Side effects: 그리드 body/pagination 재렌더링.
- Example:
  ```js
  grid.setData(data.list, { paging: { pageNo: 1, pageSize: 20, totalCount: 120 } });
  ```
- Related methods: `search`, `getPagingData`, `getApplyData`.

#### `getDataRowSeq(rowSeq)`
- Signature: `getDataRowSeq(rowSeq: string | number)`
- Params: `rowSeq`.
- Returns: 해당 sequence의 row 객체.
- State change: 없음.
- Side effects: 없음.
- Example:
  ```js
  const row = grid.getDataRowSeq(12);
  ```
- Related methods: `getRowElementRowSeq`, `getSeqCellElement`.

#### `getDataIndex(index)`
- Signature: `getDataIndex(index: number)`
- Params: `index`.
- Returns: 해당 index의 row 객체.
- State change: 없음.
- Side effects: 없음.
- Example:
  ```js
  const first = grid.getDataIndex(0);
  ```
- Related methods: `getDataRowSeq`.

#### `getSelectData()`
- Signature: `getSelectData()`
- Params: 없음.
- Returns: `_state === "SELECT"` 행 목록.
- State change: 없음.
- Side effects: 없음.
- Example:
  ```js
  const unchanged = grid.getSelectData();
  ```
- Related methods: `getInsertData`, `getUpdateData`, `getDeleteData`, `getApplyData`.

#### `getInsertData()`
- Signature: `getInsertData()`
- Params: 없음.
- Returns: `_state === "INSERT"` 행 목록.
- State change: 없음.
- Side effects: 없음.
- Example:
  ```js
  const inserts = grid.getInsertData();
  ```
- Related methods: `appendRow`, `prependRow`.

#### `getUpdateData()`
- Signature: `getUpdateData()`
- Params: 없음.
- Returns: `_state === "UPDATE"` 행 목록.
- State change: 없음.
- Side effects: 없음.
- Example:
  ```js
  const updates = grid.getUpdateData();
  ```
- Related methods: `modifyRow`, `modifyRowElement`.

#### `getDeleteData()`
- Signature: `getDeleteData()`
- Params: 없음.
- Returns: `_state === "REMOVE"` 행 목록.
- State change: 없음.
- Side effects: 없음.
- Example:
  ```js
  const removes = grid.getDeleteData();
  ```
- Related methods: `removeRow`, `removeRowElement`.

#### `getApplyData()`
- Signature: `getApplyData()`
- Params: 없음.
- Returns: `_state !== "SELECT"` 행 목록.
- State change: 없음.
- Side effects: 없음.
- Example:
  ```js
  const pending = grid.getApplyData();
  ```
- Related methods: `getInsertData`, `getUpdateData`, `getDeleteData`.

### Row Creation

#### `prependRow()`
- Signature: `prependRow()`
- Params: 없음.
- Returns: `void`.
- State change: `_state = INSERT` 신규 행 생성(기본값 포함).
- Side effects: tbody 맨 위에 신규 row element 삽입.
- Example:
  ```js
  grid.prependRow();
  ```
- Related methods: `appendRow`, `getInsertData`.

#### `appendRow()`
- Signature: `appendRow()`
- Params: 없음.
- Returns: `void`.
- State change: `_state = INSERT` 신규 행 생성(기본값 포함).
- Side effects: tbody 맨 아래에 신규 row element 추가.
- Example:
  ```js
  grid.appendRow();
  ```
- Related methods: `prependRow`, `getInsertData`.

### DOM and Cell Access

#### `getFirstRowElement()`
- Signature: `getFirstRowElement()`
- Params: 없음.
- Returns: 첫 번째 row의 `TR` element.
- State change: 없음.
- Side effects: 없음.
- Example:
  ```js
  const tr = grid.getFirstRowElement();
  ```
- Related methods: `getFirstRowSeq`.

#### `getFirstRowSeq()`
- Signature: `getFirstRowSeq()`
- Params: 없음.
- Returns: 첫 번째 row sequence.
- State change: 없음.
- Side effects: 없음.
- Example:
  ```js
  const seq = grid.getFirstRowSeq();
  ```
- Related methods: `getFirstRowElement`, `getRowElementRowSeq`.

#### `getRowElementRowSeq(rowSeq)`
- Signature: `getRowElementRowSeq(rowSeq: string | number)`
- Params: `rowSeq`.
- Returns: 해당 행의 `TR` element.
- State change: 없음.
- Side effects: 없음.
- Example:
  ```js
  const tr = grid.getRowElementRowSeq(15);
  ```
- Related methods: `getDataRowSeq`, `getSeqCellElement`.

#### `getSeqCellElement(rowSeq, name)`
- Signature: `getSeqCellElement(rowSeq: string | number, name: string)`
- Params: `rowSeq`, 컬럼 `name`.
- Returns: cell input/select/button/span element.
- State change: 없음.
- Side effects: 없음.
- Example:
  ```js
  const input = grid.getSeqCellElement(15, "name");
  ```
- Related methods: `getCheckedElement`, `setAllChecked`.

### Checkbox and Selection Helpers

#### `getCheckedElement(name)`
- Signature: `getCheckedElement(name: string)`
- Params: 체크박스 필드명.
- Returns: 체크된 체크박스 element 목록.
- State change: 없음.
- Side effects: 없음.
- Example:
  ```js
  const checkedEls = grid.getCheckedElement("checked");
  ```
- Related methods: `getNameCheckedSeqs`, `getNameCheckedItems`.

#### `setAllChecked(name, bool)`
- Signature: `setAllChecked(name: string, bool: boolean)`
- Params: 체크박스 필드 `name`, 대상 체크 상태.
- Returns: `void`.
- State change: 체크박스 필드의 row 데이터를 함께 갱신.
- Side effects: 모든 행의 체크박스 DOM 상태 변경.
- Example:
  ```js
  grid.setAllChecked("checked", true);
  ```
- Related methods: `getCheckedElement`, `getNameCheckedSeqs`.

#### `getNameCheckedSeqs(name)`
- Signature: `getNameCheckedSeqs(name: string)`
- Params: 체크박스 필드명.
- Returns: 체크된 행의 `rowSeq[]`.
- State change: 없음.
- Side effects: 없음.
- Example:
  ```js
  const seqs = grid.getNameCheckedSeqs("checked");
  ```
- Related methods: `getNameCheckedItems`, `removeRowCheckedElement`.

#### `getNameCheckedItems(name)`
- Signature: `getNameCheckedItems(name: string)`
- Params: 체크박스 필드명.
- Returns: 체크된 row의 deep clone 목록.
- State change: 없음.
- Side effects: 없음.
- Example:
  ```js
  const items = grid.getNameCheckedItems("checked");
  ```
- Related methods: `getNameCheckedSeqs`, `cancelRowCheckedElement`, `modifyRowCheckedElement`.

### Option Mutation

#### `changeOption(optionName, value)`
- Signature: `changeOption(optionName: string, value: any)`
- Params:
  - `optionName`: `self.` 이후 속성 경로(예: `option.isHead`).
  - `value`: 할당할 값. Primitive/object를 직접 전달할 수 있고, 문자열은 `"'client'"`, `"false"` 같은 기존 입력도 호환됩니다.
- Returns: `void`.
- State change: 런타임 옵션 값을 변경.
- Side effects: 잘못되었거나 안전하지 않은 경로(예: `__proto__`)는 예외를 발생시킵니다.
- Example:
  ```js
  grid.changeOption("option.pagingMode", "client");
  grid.changeOption("option.isRowStatusColor", false);
  // legacy 문자열 입력도 계속 동작
  grid.changeOption("option.pagingMode", "'client'");
  ```
- Related methods: constructor options.

### Cancel APIs

#### `cancelRowSeq(rowSeq)`, `cancelRowIdx(rowIdx)`, `cancelRow(rowIdx, rowSeq)`
- Signature:
  - `cancelRowSeq(rowSeq: string | number)`
  - `cancelRowIdx(rowIdx: number)`
  - `cancelRow(rowIdx: number, rowSeq: string | number)`
- Params: seq/idx 또는 둘 다로 행 식별.
- Returns: `void`.
- State change: 행 상태 표시(`UPDATE`/`REMOVE`)를 가능한 경우 `SELECT`로 취소.
- Side effects: 상태 CSS 클래스 제거, 비활성화된 셀 re-enable.
- Example:
  ```js
  grid.cancelRowSeq(10);
  ```
- Related methods: `cancelRowElement*`, `applyModifyAndCancel*`.

#### `cancelRowCheckedElement(name)`
- Signature: `cancelRowCheckedElement(name: string)`
- Params: 체크박스 필드명.
- Returns: `void`.
- State change:
  - `INSERT`: 물리 삭제
  - `UPDATE`: 스냅샷 복구 후 `SELECT`
  - `REMOVE`: `SELECT`
- Side effects: row cell 재구성 가능, 상태 클래스 제거.
- Example:
  ```js
  grid.cancelRowCheckedElement("checked");
  ```
- Related methods: `cancelRowElementRowSeqs`, `cancelRowElementRowIdxs`.

#### `cancelRowElementRowSeqs(rowSeqList)`, `cancelRowElementRowIdxs(rowIdxList)`, `cancelRowElementRowSeq(rowSeq)`, `cancelRowElementRowIdx(rowIdx)`
- Signature:
  - `cancelRowElementRowSeqs(rowSeqList: (string | number)[])`
  - `cancelRowElementRowIdxs(rowIdxList: number[])`
  - `cancelRowElementRowSeq(rowSeq: string | number)`
  - `cancelRowElementRowIdx(rowIdx: number)`
- Params: 행 목록 또는 단건 식별자.
- Returns: `void`.
- State change: 상단 취소 규칙과 동일(행 element 기반 흐름).
- Side effects: 저장된 수정 스냅샷 기준으로 행 DOM을 재생성할 수 있음.
- Example:
  ```js
  grid.cancelRowElementRowIdxs([0, 2, 3]);
  ```
- Related methods: `modifyRowElement*`, `removeRowElement*`.

### Modify Detection and Conditional Apply

#### `isRowModifyRowSeq(rowSeq, option)`, `isRowModifyRowIdx(rowIdx, option)`, `isRowModify(rowIdx, rowSeq, option)`
- Signature:
  - `isRowModifyRowSeq(rowSeq: string | number, option?: { exceptList?: string[] })`
  - `isRowModifyRowIdx(rowIdx: number, option?: { exceptList?: string[] })`
  - `isRowModify(rowIdx: number, rowSeq: string | number, option?: { exceptList?: string[] })`
- Params: row 식별자, 비교 옵션.
- Returns: `boolean`.
- State change: 없음.
- Side effects: 현재 데이터와 origin 스냅샷을 비교.
- Example:
  ```js
  const changed = grid.isRowModifyRowSeq(12, { exceptList: ["updatedAt"] });
  ```
- Related methods: `applyModifyAndCancel*`, `modifyRow*`, `cancelRow*`.

#### `applyModifyAndCancelRowIdx(rowIdx, option)`, `applyModifyAndCancelRowSeq(rowSeq, option)`, `applyModifyAndCancel(rowIdx, rowSeq, option)`
- Signature:
  - `applyModifyAndCancelRowIdx(rowIdx: number, option?: { exceptList?: string[], isRowEditMode?: boolean })`
  - `applyModifyAndCancelRowSeq(rowSeq: string | number, option?: { exceptList?: string[], isRowEditMode?: boolean })`
  - `applyModifyAndCancel(rowIdx: number, rowSeq: string | number, option?: { exceptList?: string[], isRowEditMode?: boolean })`
- Params: row 식별자, 비교/적용 옵션.
- Returns: `void`.
- State change:
  - 변경됨: `UPDATE` 적용
  - 변경 없음: `SELECT`로 취소
- Side effects: `isRowEditMode === true`면 element edit 모드 전환 가능.
- Example:
  ```js
  grid.applyModifyAndCancelRowSeq(12, { exceptList: ["updatedAt"], isRowEditMode: false });
  ```
- Related methods: `isRowModify*`, `modifyRow*`, `cancelRow*`.

### Modify State APIs

#### `modifyRowIdx(rowIdx)`, `modifyRowSeq(rowSeq)`, `modifyRow(rowIdx, rowSeq)`
- Signature:
  - `modifyRowIdx(rowIdx: number)`
  - `modifyRowSeq(rowSeq: string | number)`
  - `modifyRow(rowIdx: number, rowSeq: string | number)`
- Params: row 식별자.
- Returns: `void`.
- State change: `_state = UPDATE`.
- Side effects: 옵션 활성 시 update 상태 CSS 클래스 적용.
- Example:
  ```js
  grid.modifyRowIdx(0);
  ```
- Related methods: `isRowModify*`, `modifyRowElement*`.

#### `modifyRowCheckedElement(name)`
- Signature: `modifyRowCheckedElement(name: string)`
- Params: 체크박스 필드명.
- Returns: `void`.
- State change: 체크된 행을 `UPDATE`로 변경(`INSERT`는 제외).
- Side effects: 행별 수정 스냅샷 저장, edit 모드 row cell 재구성.
- Example:
  ```js
  grid.modifyRowCheckedElement("checked");
  ```
- Related methods: `modifyRowElement*`, `cancelRowElement*`.

#### `modifyRowElementRowIdxs(rowIdxList)`, `modifyRowElementRowSeqs(rowSeqList)`, `modifyRowElementRowIdx(rowIdx)`, `modifyRowElementRowSeq(rowSeq)`, `modifyRowElement(rowIdx, rowSeq)`
- Signature:
  - `modifyRowElementRowIdxs(rowIdxList: number[])`
  - `modifyRowElementRowSeqs(rowSeqList: (string | number)[])`
  - `modifyRowElementRowIdx(rowIdx: number)`
  - `modifyRowElementRowSeq(rowSeq: string | number)`
  - `modifyRowElement(rowIdx: number, rowSeq: string | number)`
- Params: 행 목록/단건 식별자.
- Returns: `void`.
- State change: `_state = UPDATE` 전환(INSERT/REMOVE는 예외 처리 포함).
- Side effects: 원본값 스냅샷 저장, edit cell 타입으로 row DOM 재구성.
- Example:
  ```js
  grid.modifyRowElementRowSeqs([11, 12]);
  ```
- Related methods: `cancelRowElement*`, `applyModifyAndCancel*`.

### Remove and Delete APIs

#### `removeRowIdx(rowIdx, option)`, `removeRowSeq(rowSeq, option)`, `removeRow(rowIdx, rowSeq, option)`
- Signature:
  - `removeRowIdx(rowIdx: number, option?: { isDisabled?: boolean, exceptDisabledList?: string[] })`
  - `removeRowSeq(rowSeq: string | number, option?: { isDisabled?: boolean, exceptDisabledList?: string[] })`
  - `removeRow(rowIdx: number, rowSeq: string | number, option?: { isDisabled?: boolean, exceptDisabledList?: string[] })`
- Params: 행 식별자, 비활성화 옵션.
- Returns: `void`.
- State change: `_state = REMOVE`.
- Side effects: 기본적으로 셀 비활성화, remove CSS 클래스 적용.
- Example:
  ```js
  grid.removeRowSeq(21, { isDisabled: true, exceptDisabledList: ["checked"] });
  ```
- Related methods: `getDeleteData`, `removeRowElement*`, `deleteRow*`.

#### `removeRowCheckedElement(name)`
- Signature: `removeRowCheckedElement(name: string)`
- Params: 체크박스 필드명.
- Returns: `void`.
- State change: 체크된 행에 대해 remove-row-element 규칙 적용.
- Side effects: row class/UI 변경, INSERT 행은 물리 삭제될 수 있음.
- Example:
  ```js
  grid.removeRowCheckedElement("checked");
  ```
- Related methods: `removeRowElementRowSeqs`, `removeRowElementRowIdxs`.

#### `removeRowElementRowIdxs(rowIdxList)`, `removeRowElementRowSeqs(rowSeqList)`, `removeRowElementRowIdx(rowIdx)`, `removeRowElementRowSeq(rowSeq)`, `removeRowElement(rowIdx, rowSeq)`
- Signature:
  - `removeRowElementRowIdxs(rowIdxList: number[])`
  - `removeRowElementRowSeqs(rowSeqList: (string | number)[])`
  - `removeRowElementRowIdx(rowIdx: number)`
  - `removeRowElementRowSeq(rowSeq: string | number)`
  - `removeRowElement(rowIdx: number, rowSeq: string | number)`
- Params: 행 목록/단건 식별자.
- Returns: `void`.
- State change:
  - `INSERT`: 물리 삭제
  - `SELECT`: `REMOVE`
  - `UPDATE`: cancel/remove element 흐름을 거쳐 처리
- Side effects: row class 업데이트, row DOM 제거 가능.
- Example:
  ```js
  grid.removeRowElementRowIdxs([0, 1]);
  ```
- Related methods: `removeRow*`, `cancelRowElement*`, `deleteRow*`.

#### `deleteRowIdx(rowIdx)`, `deleteRowSeq(rowSeq)`, `deleteRow(rowIdx, rowSeq)`
- Signature:
  - `deleteRowIdx(rowIdx: number)`
  - `deleteRowSeq(rowSeq: string | number)`
  - `deleteRow(rowIdx: number, rowSeq: string | number)`
- Params: 행 식별자.
- Returns: `void`.
- State change: 메모리 데이터에서 행을 영구 제거.
- Side effects: 즉시 row DOM 제거 + 내부 인덱스 맵 재정렬.
- Example:
  ```js
  grid.deleteRowSeq(33);
  ```
- Related methods: `removeRow*`, `removeRowElement*`.

## Paging Notes

- paging UI 사용 조건:
  - `option.isPaging = true`
  - `option.pagingMode = "client" | "server"`
  - `setData(list, { paging })`로 paging 메타 전달
- server mode의 페이지 버튼은 내부적으로 `parameter.search(parameter)` 호출 후 `setData(result.list, result.param)` 수행.
- client mode는 전체 소스를 저장한 뒤 `pageNo`/`pageSize`로 슬라이스 렌더.

## Recommended AI Usage Recipes

### Recipe: 조회 후 변경 적용
```js
const result = await grid.search({ filter, paging: { pageNo: 1, pageSize: 20 } });
grid.setData(result.list, result.param);

// ... 사용자 편집 / 추가 / 삭제 ...
const applyList = grid.getApplyData();
await api.apply(applyList);
```

### Recipe: 실제 변경 여부 기반 update/cancel 처리
```js
grid.applyModifyAndCancelRowSeq(rowSeq, {
  exceptList: ["updatedAt"],
  isRowEditMode: false,
});
```

## Known Caveats

- 행 변경 비교는 `isRowModifyRowSeq`/`isRowModifyRowIdx`를 메서드 의도(`rowSeq` vs `rowIdx`)에 맞춰 호출 권장.
- `deleteRow*`는 하드 삭제(메모리/DOM 즉시 제거). 소프트 삭제가 필요하면 `removeRow*` 사용.
