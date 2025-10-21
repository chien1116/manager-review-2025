/** ====================================================== 共用func ======================================================================= */
/** 取得ITG成員名單的資料row */
function getRowByEmployeeId(sheetName,employeeId) {
  let sheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/'+googleSheetId+'/edit?gid=0#gid=0').getSheetByName(sheetName);
  let data = sheet.getRange("A2:A" + sheet.getLastRow()).getValues(); //所有員工編號
  // Logger.log("Employee IDs in sheet: " + data);  //印出員工編號

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] == employeeId) {
      return i + 2; 
    }
  }
  return null; // 如果找不到匹配的員工編號
}

//欄位參考
/* let ITG_sheet_col = {
  "user_employeeID" : "A",
  "userNT_id" : "B",
  "user_unit": "D",
  "user_manager": "E",
  "manager_email" : "F"
} */

/** 取得sheetName的資料，根據employeeID 找到列, 以及column代號找到欄位 */
function get_ITG_sheet_value(sheetName, employeeId, column){
  let sheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/'+googleSheetId+'/edit?gid=0#gid=0').getSheetByName(sheetName);
  let row = getRowByEmployeeId(sheetName,employeeId);
  if (row) {
    return sheet.getRange(column + row).getValue();
  }
}


