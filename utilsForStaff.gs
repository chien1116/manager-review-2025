/** 4/25 寄信(A-1): staff 下對上 直屬兩層表單 */
function sendMemberListToStaff() {
  const ss = SpreadsheetApp.openById(googleSheetId);
  const staffSheet = ss.getSheetByName("staff(下對上-prod)");
  const dataRange = staffSheet.getRange(266, 1, 1, staffSheet.getLastColumn()); // (第2row,第Acolumn,row數)
  const data = dataRange.getValues();

  for (let i = 0; i < data.length; i++) {
    // 跳過表頭，從第二行開始
    const employeeId = data[i][0]; // 員工ID 在第1欄
    const userNT_id = data[i][1]; //NT_id 在第2欄
    const staffEmail = data[i][2]; //同仁email在第3欄 (C欄)
    const staffGrade = data[i][6]; //同仁職級(G欄)
    const staffStatus = data[i][19]; // 狀態在第20列 (T欄)
    const satffDivision = data[i][3]; // 處別在第4列 (D欄)
    const satffDep = data[i][4]; // 部別在第5列 (E欄)

    const firstManager_NT = data[i][11]; // 第一層主管NT(L)
    const firstManagerLevel = data[i][13]; // 第一層主管-層級(N欄)
    const firstManagerGrade = data[i][14]; // 第一層主管-職級(O欄)
    const secondManager_NT = data[i][15]; // 第二層主管NT(P欄)
    const secondManagerLevel = data[i][16]; // 第二層主管-層級(Q欄)
    const secondManagerGrade = data[i][17]; // 第二層主管-職級(R欄)

    // 1. 過濾條件
    // G欄: 員工G61以上、如果是NAN 或 不存在 => 不發送 (已經先剃除過，不會存在)
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

    // 狀態已寄送過，不重寄(只有空白狀態要寄信)
    if (staffStatus !== "" && staffStatus !== undefined) {
      Logger.log(`SKIP: ${userNT_id} 狀態非待寄信狀態 ${staffStatus}。`);
      continue;
    }

    if (!staffEmail) {
      Logger.log(
        `SKIP: ${employeeId}:${userNT_id}: 無法成功寄信，請確認同仁信箱是否存在。`,
      );
      continue;
    }

    // 2. 判斷表單連結
    let firstManagerFormUrl = "";
    let secondManagerFormUrl = "";

    //第1層主管邏輯
    if (firstManagerGrade !== "" && parseInt(firstManagerGrade) < 61) {
      if (
        firstManagerLevel === "manager" ||
        firstManagerLevel === "manager-1"
      ) {
        firstManagerFormUrl = `${formBaseUrlA}&${formUrlA_reviewer}=${satffDivision}%2F${satffDep}%2F${userNT_id}&${formUrlA_reviewee}=${firstManager_NT}`;
      } else if (
        firstManagerLevel === "manager-2" ||
        firstManagerLevel === "manager-3"
      ) {
        firstManagerFormUrl = `${formBaseUrlB}&${formUrlB_reviewer}=${satffDivision}%2F${satffDep}%2F${userNT_id}&${formUrlB_reviewee}=${firstManager_NT}`;
      }
      data[i][20] = firstManagerFormUrl || "";
    }

    //第2層主管邏輯
    if (secondManagerGrade !== "" && parseInt(secondManagerGrade) < 61) {
      if (
        secondManagerLevel === "manager-2" ||
        secondManagerLevel === "manager-3"
      ) {
        secondManagerFormUrl = `${formBaseUrlB}&${formUrlB_reviewer}=${satffDivision}%2F${satffDep}%2F${userNT_id}&${formUrlB_reviewee}=${secondManager_NT}`;
      }
      data[i][21] = secondManagerFormUrl || "";
    }

    // 3. 若都沒有表單，略過寄信
    if (!firstManagerFormUrl && !secondManagerFormUrl) {
      Logger.log(
        `SKIP: ${employeeId}:${userNT_id}: 兩層主管(職級G61以上或沒有資料)非屬被評對象，無表單可寄送。`,
      );
      continue;
    }

    // 4. 引用信件樣板&執行寄信
    let emailContent = emailTemplate_staff(
      userNT_id,
      firstManagerFormUrl,
      secondManagerFormUrl,
      firstManager_NT,
      secondManager_NT,
    );
    try {
      const result = sendEmailViaApi(
        staffEmail,
        "敬邀參與意見調查，以提升工作環境與管理效能(非主管職-下對上)",
        emailContent,
      );
      // 5. 確認郵件是否成功發送
      if (result && result.MessageId) {
        data[i][19] = "staff_sent"; //更新同仁狀態
        Logger.log(
          `成功寄信給 ${employeeId}:${userNT_id}。狀態變更為:${data[i][19]}。
第1層主管: ${firstManager_NT}/主管層級${firstManagerLevel}/職級${firstManagerGrade}。
主管表單1：${firstManagerFormUrl || "無"}。
第2層主管: ${secondManager_NT}/主管層級${secondManagerLevel}/職級${secondManagerGrade}。
主管表單2：${secondManagerFormUrl || "無"}。
        `,
        );
      } else {
        Logger.log(`無法成功寄信 ${employeeId}:${userNT_id}:${staffEmail}`);
        data[i][19] = staffStatus; // 捕捉到錯誤時，不更新狀態
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
