/** 10/28 寄信(B-1): manager 下對上 課評部 */
// function sendMemberListToManager_downToUp() {
//   const ss = SpreadsheetApp.openById(googleSheetId);
//   const staffSheet = ss.getSheetByName('manager(all-check)');
//   const dataRange = staffSheet.getRange(2, 1, 1, staffSheet.getLastColumn()); // (第2row,第Acolumn,row數)
//   const data = dataRange.getValues();

//   for (let i = 0; i < data.length; i++) { // 跳過表頭，從第二行開始
//     const employeeId = data[i][0]; // 員工ID 在第1欄
//     const userNT_id = data[i][1]; //NT_id 在第2欄
//     const staffEmail = data[i][2]; //同仁email在第3欄 (C欄)
//     const staffGrade = data[i][6]; //同仁職級(G欄)
//     const staffStatus = data[i][19]; // 狀態在第20列 (T欄)
//     const staffLevel = data[i][8]; // 同仁身分 (I欄)
//     const satffDivision = data[i][3]; // 處別在第4列 (D欄)
//     const satffDep = data[i][4]; // 部別在第5列 (E欄)

//     const firstManager_NT = data[i][11]; // 第一層主管NT(L)
//     const firstManagerLevel = data[i][13]; // 第一層主管-層級(N欄)
//     const firstManagerGrade = data[i][14]; // 第一層主管-職級(O欄)

//     // 1. 過濾條件
//     // 狀態已寄送過，不重寄(只有空白狀態要寄信)
//     if (staffStatus !== "" && staffStatus !== undefined) {
//       Logger.log(`SKIP: ${employeeId}:${userNT_id} 狀態非待寄信狀態 ${staffStatus}。`);
//       continue;
//     }

//     // G欄: 員工G61以上、如果是NAN 或 不存在 => 不發送 (已經先剃除過，不會存在)
//     const parsedGrade = parseInt(staffGrade);
//     if (!staffGrade || isNaN(parsedGrade)) {
//       Logger.log(`SKIP: ${employeeId}:${userNT_id} 職級無效 (${staffGrade})，不寄信。`);
//       continue;
//     }
//     if (parsedGrade >= 61) {
//       Logger.log(`SKIP: ${employeeId}:${userNT_id} 同仁職級: G${staffGrade} 不寄信。`);
//       continue;
//     }

//     // 只處理manager/manager-1
//     if (staffLevel !== "manager" && staffLevel !== "manager-1") {
//       Logger.log(`SKIP: ${employeeId}:${userNT_id} 身分為 ${staffLevel}，非課級主管，不寄送。`);
//       continue;
//     }

//     if (!staffEmail) {
//       Logger.log(`SKIP: ${employeeId}:${userNT_id}: 無法成功寄信，請確認同仁信箱是否存在。`);
//       continue;
//     }

//     // 2. 判斷表單連結
//     let firstManagerFormUrl = "";

//     //第1層主管邏輯
//     if (firstManagerGrade !== "" && parseInt(firstManagerGrade) < 61) {
//       if (firstManagerLevel === "manager" || firstManagerLevel === "manager-1") {
//         // firstManagerFormUrl = `${formBaseUrlA}&${formUrlA_reviewer}=${satffDivision}%2F${satffDep}%2F${userNT_id}&${formUrlA_reviewee}=${firstManager_NT}`; //不存在的情況，暫時拿掉
//         Logger.log(`SKIP: ${employeeId}:${userNT_id}:的部級主管 ${firstManager_NT}:主管層級 ${firstManagerLevel}。非屬被評對象，無表單可寄送。`);
//         continue;
//       }else if (firstManagerLevel ==="manager-2" || firstManagerLevel === "manager-3") {
//         firstManagerFormUrl = `${formBaseUrlB}&${formUrlB_reviewer}=${satffDivision}%2F${satffDep}%2F${userNT_id}&${formUrlB_reviewee}=${firstManager_NT}`;
//       }
//       data[i][20] = firstManagerFormUrl || "";
//     }

//     // 3. 若都沒有表單，略過寄信
//     if (!firstManagerFormUrl) {
//       Logger.log(`SKIP: ${employeeId}:${userNT_id}:的部級主管 ${firstManager_NT}:主管職級 ${firstManagerGrade}/主管層級 ${firstManagerLevel}。非屬被評對象，無表單可寄送。`);
//       continue;
//     }

//     // 如果要先產生每一筆同仁的URL供確認，以下這段寄信func.可先註解
//     // 4. 引用信件樣板&寄信
//    let emailContent = emailTemplate_staff(userNT_id,firstManagerFormUrl,'',firstManager_NT,'')
//     try {
//       const result = sendEmail(staffEmail, '敬邀參與意見調查，以提升工作環境與管理效能(下對上-課評部)', emailContent);
//       // 5. 確認郵件是否成功發送
//       if (result && result.success) {
//         data[i][19] = "staff_sent"; //更新同仁狀態
//         Logger.log(`
// 成功寄信給 ${employeeId}:${userNT_id}。狀態變更為:${data[i][19]}。
// 第1層主管: ${firstManager_NT}/主管層級${firstManagerLevel}/職級${firstManagerGrade}。
// 主管表單1：${firstManagerFormUrl || "無"}。
//         `);
//       } else {
//         Logger.log(`無法成功寄信 ${employeeId}:${userNT_id}:${staffEmail}`);
//         data[i][19] = staffStatus; // 捕捉到錯誤時，不更新狀態
//       }
//       // ✅ 加入發送延遲，避免觸發 AWS SES 速率限制
//       // 每封郵件間隔 100ms，相當於每秒最多發送 10 封
//       if (i < data.length - 1) {
//         Utilities.sleep(100);
//       }
//     } catch (error) {
//       Logger.log(`發送失敗：${employeeId}:${userNT_id} Error: ${error.message}`);
//     }

//   }
//   // 5. 回寫狀態
//   dataRange.setValues(data);
// }

/**--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
/** 10/28 寄信(B-3): manager 課、部主管 > 自評 & 助理表單*/
function sendManagerList_SelfandPA() {
  const ss = SpreadsheetApp.openById(googleSheetId);
  const staffSheet = ss.getSheetByName("manager(all-check)"); //這邊要替換成prod的工作表名稱
  const dataRange = staffSheet.getRange(2, 1, 1, staffSheet.getLastColumn()); // (第2row,第Acolumn,row數)
  const data = dataRange.getValues();

  for (let i = 0; i < data.length; i++) {
    // 跳過表頭，從第二行開始
    const employeeId = data[i][0]; // 員工ID 在第1欄
    const userNT_id = data[i][1]; //NT_id 在第2欄
    const staffEmail = data[i][2]; //同仁email在第3欄 (C欄)
    const staffGrade = data[i][6]; //同仁職級(G欄)
    const staffLevel = data[i][8]; // 同仁身分 (I欄)
    const staffDep = data[i][3]; // 處別(D欄)
    const satffDivision = data[i][3]; // 處別在第4列 (D欄)
    const satffDep = data[i][4]; // 部別在第5列 (E欄)

    const pa_NT = data[i][18]; // 助理NT (S欄)
    const self_status = data[i][24]; // 狀態在第25列 (Y欄)

    // 1. 過濾條件
    // 狀態已寄送過，不重寄(只有空白狀態要寄信)
    if (self_status !== "" && self_status !== undefined) {
      Logger.log(
        `SKIP: ${employeeId}:${userNT_id} 狀態非待寄信狀態 ${self_status}。`,
      );
      continue;
    }

    // G欄: 員工G61以上、如果是NAN 或 不存在 => 不發送
    const parsedGrade = parseInt(staffGrade);
    if (!staffGrade || isNaN(parsedGrade)) {
      Logger.log(
        `SKIP: ${employeeId}:${userNT_id} 職級無效 (${staffGrade})，不寄信。`,
      );
      continue;
    } else if (parsedGrade >= 61) {
      Logger.log(
        `SKIP: ${employeeId}:${userNT_id} 同仁職級: G${staffGrade} 不寄信。`,
      );
      continue;
    }

    // 只處理manager/manager-1/manager-2/manager-3
    if (
      staffLevel !== "manager" &&
      staffLevel !== "manager-1" &&
      staffLevel !== "manager-2" &&
      staffLevel !== "manager-3"
    ) {
      Logger.log(
        `SKIP: ${employeeId}:${userNT_id}。層級為 ${staffLevel}，不符合自評條件。`,
      );
      continue;
    }

    if (!staffEmail) {
      Logger.log(
        `SKIP: ${employeeId}:${userNT_id}: 無法成功寄信，請確認同仁信箱是否存在。`,
      );
      continue;
    }

    // 2. 表單連結(自評&助理)
    let selfManagerFormUrl = "";
    let paManagerFormUrl = "";

    //自評表單(沒有要做自評的話註解掉)
    // selfManagerFormUrl = `${formBaseUrlC}&${formUrlC_reviewer}=${satffDivision}%2F${satffDep}%2F${userNT_id}&${formUrlC_reviewee}=${userNT_id}`;
    data[i][25] = selfManagerFormUrl || "";

    //助理表單(資訊長室/台固同仁 助理名單)
    if (pa_NT) {
      paManagerFormUrl = `${formBaseUrlD}&${formUrlD_reviewer}=${satffDivision}%2F${satffDep}%2F${userNT_id}&${formUrlD_reviewee}=${staffDep}:${pa_NT}`;
      data[i][26] = paManagerFormUrl || "";
    }

    // 3. 若都沒有表單，略過寄信
    if (!selfManagerFormUrl && !paManagerFormUrl) {
      Logger.log(
        `SKIP: ${employeeId}:${userNT_id}:主管無自評或助理表單可寄送。`,
      );
      continue;
    }

    // 如果要先產生每一筆同仁的URL供確認，以下這段寄信func.可先註解
    // 4. 引用信件樣板&寄信
    let emailContent = emailTemplate_manager_self(
      userNT_id,
      selfManagerFormUrl,
      paManagerFormUrl,
      pa_NT,
      staffDep,
    );
    try {
      const result = sendEmail(
        staffEmail,
        "敬邀參與意見調查，以提升工作環境與管理效能(助理滿意度)",
        emailContent,
      );
      // 5. 確認郵件是否成功發送
      if (result && result.success) {
        data[i][24] = "self_sent"; //更新寄送後狀態(Y欄)
        Logger.log(`
成功寄信給 ${employeeId}:${userNT_id}。層級${staffLevel}/職級${staffGrade}。狀態變更為:${
          data[i][24]
        }。
自評表單：${selfManagerFormUrl || "無"}。
處別: ${staffDep} / 處助理: ${pa_NT}。
助理名單：${paManagerFormUrl || "無"}。
        `);
      } else {
        Logger.log(`無法成功寄信 ${employeeId}:${userNT_id}:${staffEmail}`);
        data[i][24] = self_status; // 捕捉到錯誤時，不更新狀態
      }
      // ✅ 加入發送延遲，避免觸發 AWS SES 速率限制
      // 每封郵件間隔 100ms，相當於每秒最多發送 10 封
      if (i < data.length - 1) {
        Utilities.sleep(100);
      }
    } catch (error) {
      Logger.log(
        `發送失敗：${employeeId}:${userNT_id} Error: ${error.message}`,
      );
    }
  }

  // 5. 回寫狀態
  dataRange.setValues(data);
}

/**--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
/**XXXXXXXXXXXXXXXXXXX 不需要! 寄信(B-2): manager 上對下 部評課XXXXXXXXXXXXXXXXXXXXXXX*/
// function sendMemberListToManager_upToDown() {
//   const ss = SpreadsheetApp.openById(googleSheetId);
//   const staffSheet = ss.getSheetByName('manager(all-test)');
//   const dataRange = staffSheet.getRange(2, 1, 103, staffSheet.getLastColumn()); // (第2row,第Acolumn,row數)
//   const data = dataRange.getValues();

//   // 建立部主管集合
//   const managerMap = new Map();

//   for (let i = 0; i < data.length; i++) { // 跳過表頭，從第二行開始
//     const employeeId = data[i][0]; // 員工ID 在第1欄
//     const userNT_id = data[i][1]; //NT_id 在第2欄
//     const staffGrade = data[i][6]; //同仁職級(G欄)
//     const staffLevel = data[i][8]; //同仁(主管職)層級(I欄)
//     const satffDivision = data[i][3]; // 處別在第4列 (D欄)
//     const satffDep = data[i][4]; // 部別在第5列 (E欄)

//     const manager_NT = data[i][11]; // 主管NT(L)
//     const managerEmail = data[i][12]; // 主管email在第13欄 (M欄)
//     const managerLevel = data[i][13]; // 主管-層級(N欄)
//     const managerGrade = data[i][14]; // 主管-職級(O欄)
//     const managerStatus = data[i][22]; // 上對下狀態在第23列 (W欄)

//     const parsedGrade_m = parseInt(managerGrade);
//     const parsedGrade = parseInt(staffGrade);

//     // 1. 過濾條件
//     // 狀態已寄送過，不重寄(只有空白狀態要寄信)
//     if (managerStatus !== "" && managerStatus !== undefined) {
//       Logger.log(`SKIP: ${employeeId}:${userNT_id}。主管:${manager_NT}，狀態非待寄信狀態 ${managerStatus}。`);
//       continue;
//     }

//     // G欄: 主管G61以上、如果是NAN 或 不存在 => 不發送
//     if (!parsedGrade_m || isNaN(parsedGrade_m)) {
//       Logger.log(`SKIP: ${employeeId}:${userNT_id}。主管:${manager_NT}，職級無效 (${parsedGrade_m})，不寄信。`);
//       continue;
//     }else if (parsedGrade_m >= 61) {
//       Logger.log(`SKIP: ${employeeId}:${userNT_id} 。主管:${manager_NT}，職級: G${parsedGrade_m} 不寄信。`);
//       continue;
//     }
//     // G欄: 下屬G61以上、如果是NAN 或 不存在 => 不發送 (raw data已經先剃除過，不會存在)
//     if (!parsedGrade || isNaN(parsedGrade)) {
//       Logger.log(`SKIP: ${employeeId}:${userNT_id}，下屬職級無效 (${parsedGrade})，不寄信。`);
//       continue;
//     }else if (parsedGrade >= 61) {
//       Logger.log(`SKIP: ${employeeId}:${userNT_id}，下屬職級: G${parsedGrade} 不寄信。`);
//       continue;
//     }

//     // 主管層級只處理manager-2/manager-3，下屬層級只處理manager/manager-1
//     if (managerLevel !== "manager-2" && managerLevel !== "manager-3") {
//       Logger.log(`SKIP: ${employeeId}:${userNT_id}。主管:${manager_NT}，層級為不是 manager2 或 manager3，不寄送。`);
//       continue;
//     }else if (staffLevel !== "manager" && staffLevel !== "manager-1") {
//       Logger.log(`SKIP: ${employeeId}:${userNT_id}，為被評課主管，層級不是 manager 或 manager-1，不寄送。`);
//       continue;
//     }

//     if (!managerEmail) {
//       Logger.log(`SKIP: ${employeeId}:${userNT_id}。主管:${manager_NT}，無法成功寄信，請確認主管的信箱是否存在。`);
//       continue;
//     }

//     // 組表單 URL(上填下)
//     const formUrl = `${formBaseUrlE}&${formUrlE_reviewer}=${satffDivision}%2F${satffDep}%2F${manager_NT}&${formUrlE_reviewee}=${userNT_id}`;
//     // 更新到下屬URL(X欄)
//     data[i][23] = formUrl || "";

//     // 將 下屬名單 加入對應主管的表單列表
//     if (!managerMap.has(manager_NT)) {
//       managerMap.set(manager_NT, {
//         managerEmail,
//         urls: [],
//         staff_NTs: [],
//         rowIndexes: []
//       });
//     }

//     const managerEntry = managerMap.get(manager_NT);
//     managerEntry.urls.push(formUrl);
//     managerEntry.staff_NTs.push(userNT_id);
//     managerEntry.rowIndexes.push(i); // 紀錄是第幾row???
//   }

//   // 發送信件給每位部主管
//   for (const [manager_NT, entry] of managerMap.entries()) {
//     const { managerEmail, urls, staff_NTs, rowIndexes } = entry;

//     if (!managerEmail || urls.length === 0) {
//       Logger.log(`SKIP: ${manager_NT}:無 email 或 無須填寫上對下表單`);
//       continue;
//     }

//     // 信件內容
//     const emailContent = emailTemplate_manager_multi(manager_NT, urls, staff_NTs); // 多表單模板
//     try {
//       const result = sendEmail(managerEmail, `敬邀參與意見調查，以提升工作環境與管理效能(上對下-部評課)`, emailContent);
//       if (result && result.success) {
//         for (const rowIndex of rowIndexes) {
//           data[rowIndex][22] = "manager_sent"; //上對下的發送狀態(W欄)
//         }
//         let logDetails = staff_NTs.map((name, i) => `${name}: ${urls[i]}`).join('\n'); // 每個被評人的 URL(王小名:urlXXX)
//         Logger.log(`成功寄信給主管 ${manager_NT}，共 ${urls.length} 筆問卷連結:\n${logDetails}`);
//       }else {
//          for (const rowIndex of rowIndexes) {
//           data[rowIndex][22] = "sent_error";
//         }
//         Logger.log(`無法成功寄信給 ${employeeId}:${userNT_id} 的主管: ${manager_NT}。主管狀態為:${managerStatus}。`);
//       }
//       // ✅ 加入發送延遲，避免觸發 AWS SES 速率限制
//       // 每封郵件間隔 100ms，相當於每秒最多發送 10 封
//       if (i < data.length - 1) {
//         Utilities.sleep(100);
//       }
//     } catch (error) {
//       Logger.log(`發送失敗：${manager_NT} Error: ${error.message}`);
//       data[rowIndex][22] = "sent_error";
//     }

//   }

//   // 5. 回寫狀態
//   dataRange.setValues(data);
// }
