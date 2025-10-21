/** A-1: 非主管 下對上 (同仁 > 評課主管 / 評部主管) */
/** B-1:   主管 下對上 (課主管 > 評部主管) */
function emailTemplate_staff(
  userNT_id,
  firstManagerFormUrl,
  secondManagerFormUrl,
  firstManager_NT,
  secondManager_NT,
) {
  return `
    <h3>親愛的同仁 ${userNT_id} 您好</h3>
    ${
      secondManagerFormUrl
        ? `
      <p>為持續強化管理效能與優化整體工作環境， IT現正辦理意見調查，期望廣泛蒐集同仁之寶貴建議與回饋。此次調查內容包含：</p>
    `
        : `<p>為持續強化管理效能與優化整體工作環境， IT現正辦理意見調查，期望廣泛蒐集同仁之寶貴建議與回饋。此次調查內容為：</p>`
    }

    ${
      firstManagerFormUrl
        ? `
      <p>1.直屬主管滿意度調查: <b>${firstManager_NT}</b> 表單:</p>
      <p><a href="${firstManagerFormUrl}">${firstManagerFormUrl}</a></p>
    `
        : ""
    }
    
    ${
      secondManagerFormUrl
        ? `
      <p>2.直屬主管滿意度調查: <b>${secondManager_NT}</b> 表單:</p>
      <p><a href="${secondManagerFormUrl}">${secondManagerFormUrl}</a></p>
    `
        : ""
    }

    <p>敬請您撥冗填寫相關問卷，您的意見將作為未來推動管理優化與營運改善之重要依據。</p>
    <p>填寫期間：即日起至2025/10/31</p><br>
    <p>感謝您的參與與支持，</p>
    <p>祝 工作順心</p>

    <hr>
    <p>此為系統自動發送郵件，請勿直接回覆。</p>`;
}

/** B-3: 主管 平行 (自評 / 評助理) */
function emailTemplate_manager_self(
  userNT_id,
  selfManagerFormUrl,
  paManagerFormUrl,
  pa_NT,
  selfDep,
) {
  return `
    <h3>親愛的同仁 ${userNT_id} 您好</h3>

    <p>為持續強化管理效能與優化整體工作環境， IT現正辦理意見調查，期望廣泛蒐集同仁之寶貴建議與回饋。此次調查內容包含：</p>

    ${
      selfManagerFormUrl
        ? `
      <p>課、部主管自評: <b>${userNT_id}</b> 表單:</p>
      <p><a href="${selfManagerFormUrl}">${selfManagerFormUrl}</a></p>
    `
        : ""
    }
    
    ${
      paManagerFormUrl
        ? `
      <p>助理滿意度調查: <b>${selfDep}</b> <b>${pa_NT}</b> 表單:。</p>
      <p><a href="${paManagerFormUrl}">${paManagerFormUrl}</a></p>
    `
        : ""
    }

    <p>敬請您撥冗填寫相關問卷，您的意見將作為未來推動管理優化與營運改善之重要依據。</p>
    <p>填寫期間：即日起至2025/10/31</p><br>
    <p>感謝您的參與與支持，</p>
    <p>祝 工作順心</p>

    <hr>
    <p>此為系統自動發送郵件，請勿直接回覆。</p>`;
}

// /** B-2: 主管 上對下 (部評課) */
// function emailTemplate_manager_multi(managerNT, formUrls, staff_NTs) {
//   const introText =
//     formUrls.length > 1 ? "此次調查內容包含：" : "此次調查內容為：";

//   return `
//     <h3>親愛的同仁 ${managerNT} 您好</h3>

//     <p>為持續強化管理效能與優化整體工作環境， IT現正辦理意見調查，期望廣泛蒐集同仁之寶貴建議與回饋。${introText}</p>

//     <p>課主管認同度調查:</p>
//     ${formUrls
//       .map(
//         (url, index) => `
//       <p>${staff_NTs[index]}：<a href="${url}">${url}</a></p>
//     `,
//       )
//       .join("")}

//     <p>敬請您撥冗填寫相關問卷，您的意見將作為未來推動管理優化與營運改善之重要依據。</p>
//     <p>填寫期間：即日起至2025/10/31</p><br>
//     <p>感謝您的參與與支持，</p>
//     <p>祝 工作順心</p>

//     <hr>
//     <p>此為系統自動發送郵件，請勿直接回覆。</p>`;
// }
