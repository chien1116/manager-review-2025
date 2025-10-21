/**
 * 統一寄信服務
 * 支援 Google Apps Script 內建寄信和外部 API 寄信
 * 透過 環境檔 EMAIL_SERVICE_TYPE 設定切換寄信方式
 */

/**
 * 統一寄信介面
 * @param {string} destinationEmail - 收件人信箱
 * @param {string} subject - 信件主旨
 * @param {string} emailContent - 信件內容 (HTML)
 * @param {string} ccEmail - 副本信箱 (可選)
 * @returns {Object} 寄信結果
 */
function sendEmail(destinationEmail, subject, emailContent, ccEmail) {
  try {
    if (EMAIL_SERVICE_TYPE === "GAS") {
      return sendEmailViaGAS(destinationEmail, subject, emailContent, ccEmail);
    } else if (EMAIL_SERVICE_TYPE === "API") {
      return _sendEmailViaSesV2_Hardcoded(
        destinationEmail,
        subject,
        emailContent,
        ccEmail,
      );
    } else {
      throw new Error(`不支援的寄信服務類型: ${EMAIL_SERVICE_TYPE}`);
    }
  } catch (error) {
    Logger.log(`寄信失敗: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 使用 Google Apps Script 內建寄信功能
 * @param {string} destinationEmail - 收件人信箱
 * @param {string} subject - 信件主旨
 * @param {string} emailContent - 信件內容 (HTML)
 * @param {string} ccEmail - 副本信箱 (可選)
 * @returns {Object} 寄信結果
 */
function sendEmailViaGAS(destinationEmail, subject, emailContent, ccEmail) {
  try {
    // 準備寄信選項
    let options = {
      to: destinationEmail,
      subject: subject,
      htmlBody: emailContent,
      name: "TWM IT Group",
    };

    // 如果有副本信箱，加入 CC
    if (ccEmail) {
      options.cc = ccEmail;
    }

    // 使用 MailApp 寄信 (更適合寄信到外部信箱)
    MailApp.sendEmail({
      to: options.to,
      subject: options.subject,
      htmlBody: options.htmlBody,
      cc: options.cc,
      name: options.name,
    });

    Logger.log(`GAS 寄信成功: ${destinationEmail}`);
    return {
      success: true,
      messageId: `GAS_${Date.now()}`,
      service: "GAS",
    };
  } catch (error) {
    Logger.log(`GAS 寄信失敗: ${error.message}`);
    return {
      success: false,
      error: error.message,
      service: "GAS",
    };
  }
}

/**
 * 使用外部 API 寄信功能 (保留原有邏輯)
 * @param {string} destinationEmail - 收件人信箱
 * @param {string} subject - 信件主旨
 * @param {string} emailContent - 信件內容 (HTML)
 * @param {string} ccEmail - 副本信箱 (可選)
 * @returns {Object} 寄信結果
 */
function sendEmailViaApi(destinationEmail, subject, emailContent, ccEmail) {
  //準備 API URL、payload
  let apiUrl = emailApi;
  let payload = {
    Source: sourceEmail,
    Destination: [destinationEmail],

    Subject: subject,
    Content: emailContent,
  };

  if (ccEmail) {
    payload.Cc = [ccEmail];
  }

  //發送 API 請求，包含 x-api-key
  let options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-api-key": APIKey, //API
    },
    payload: JSON.stringify(payload),
  };

  try {
    let response = UrlFetchApp.fetch(apiUrl, options);
    let result = JSON.parse(response.getContentText());
    return {
      success: true,
      messageId: result.MessageId,
      service: "API",
      result: result,
    };
  } catch (error) {
    Logger.log(`Error sending email: ${error.message}`);
    return {
      success: false,
      error: error.message,
      service: "API",
    };
  }
}

/**@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ */
/**
 * 使用 AWS SES V2 API 發送郵件（優化版本：支援快取與重試）
 * @param {string} toEmail - 收件人
 * @param {string} subject - 主旨
 * @param {string} htmlBody - HTML 內容
 * @param {string|Array} ccList - 副本收件人
 * @param {number} retryCount - 重試次數（內部使用，請勿手動傳入）
 * @returns {Object} 發送結果
 */
function _sendEmailViaSesV2_Hardcoded(
  toEmail,
  subject,
  htmlBody,
  ccList,
  retryCount = 0,
) {
  const MAX_RETRIES = 2; // 最多重試 2 次
  const TIMEOUT_SECONDS = 15; // 超時時間 15 秒

  try {
    const bodyObj = {
      FromEmailAddress: sourceEmail,
      Destination: {
        ToAddresses: [toEmail],
        ...(ccList && ccList.length ? { CcAddresses: ccList } : {}),
      },
      Content: {
        Simple: {
          Subject: { Data: subject },
          Body: { Html: { Data: htmlBody } },
        },
      },
    };
    const body = JSON.stringify(bodyObj);

    // SigV4
    const amzDate = _getAmzDate(); // e.g. 20251008T021234Z
    const dateStamp = amzDate.substring(0, 8); // e.g. 20251008

    const canonicalHeaders =
      "content-type:application/json\n" +
      `host:${HOST}\n` +
      `x-amz-date:${amzDate}\n`;

    const payloadHash = _sha256Hex(body);
    const canonicalRequest = [
      "POST",
      CANONICAL_URI,
      "",
      canonicalHeaders,
      SIGNED_HEADERS,
      payloadHash,
    ].join("\n");

    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      _sha256Hex(canonicalRequest),
    ].join("\n");

    // ✅ 使用快取版本的簽名金鑰（效能優化：同一天內重複使用快取）
    const signingKey = _getSignatureKeyCached(
      API_Secret_Access_Key,
      dateStamp,
      REGION,
      SERVICE,
    );
    const signature = _hmacHex(signingKey, stringToSign);

    const authorizationHeader =
      `${algorithm} Credential=${API_Access_Key_ID}/${credentialScope}, ` +
      `SignedHeaders=${SIGNED_HEADERS}, Signature=${signature}`;

    const headers = {
      "content-type": "application/json",
      "x-amz-date": amzDate,
      Authorization: authorizationHeader,
    };

    const resp = UrlFetchApp.fetch(ENDPOINT, {
      method: "post",
      payload: body,
      headers,
      muteHttpExceptions: true,
      deadline: TIMEOUT_SECONDS, // 設定超時時間
    });

    const code = resp.getResponseCode();
    const text = resp.getContentText();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {}

    // ✅ 處理暫時性錯誤（5xx）或速率限制（429）自動重試
    if ((code >= 500 || code === 429) && retryCount < MAX_RETRIES) {
      const waitTime = 1000 * Math.pow(2, retryCount); // 指數退避：1s, 2s, 4s
      Logger.log(
        `SES 回應 ${code}，等待 ${waitTime}ms 後重試 (${
          retryCount + 1
        }/${MAX_RETRIES})`,
      );
      Utilities.sleep(waitTime);
      return _sendEmailViaSesV2_Hardcoded(
        toEmail,
        subject,
        htmlBody,
        ccList,
        retryCount + 1,
      );
    }

    if (code >= 200 && code < 300) {
      return {
        success: true,
        httpStatus: code,
        messageId:
          json && json.MessageId ? json.MessageId : `SES_${Date.now()}`,
        service: "SES",
        result: json || text,
      };
    } else {
      return {
        success: false,
        httpStatus: code,
        service: "SES",
        error: json || text,
      };
    }
  } catch (error) {
    // ✅ 網路錯誤自動重試
    if (retryCount < MAX_RETRIES && error.message.includes("exceeded")) {
      const waitTime = 1000 * Math.pow(2, retryCount);
      Logger.log(
        `網路錯誤，等待 ${waitTime}ms 後重試 (${
          retryCount + 1
        }/${MAX_RETRIES}): ${error.message}`,
      );
      Utilities.sleep(waitTime);
      return _sendEmailViaSesV2_Hardcoded(
        toEmail,
        subject,
        htmlBody,
        ccList,
        retryCount + 1,
      );
    }

    // 重試次數用盡或其他錯誤
    Logger.log(`發送失敗: ${error.message}`);
    return {
      success: false,
      service: "SES",
      error: error.message,
    };
  }
}

/***** 工具函式（✅ 改為全部使用 byte[] 版，避免多載錯誤）*****/
function _getAmzDate(d) {
  const t = d || new Date();
  const pad = (n) => (n < 10 ? "0" + n : "" + n);
  return (
    t.getUTCFullYear().toString() +
    pad(t.getUTCMonth() + 1) +
    pad(t.getUTCDate()) +
    "T" +
    pad(t.getUTCHours()) +
    pad(t.getUTCMinutes()) +
    pad(t.getUTCSeconds()) +
    "Z"
  );
}

function _sha256Hex(str) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    str,
    Utilities.Charset.UTF_8,
  );
  return _toHex(bytes);
}

// 把字串轉成 byte[]
function _strBytes(s) {
  return Utilities.newBlob(s).getBytes();
}

// ✅ 兩參數多載：valueBytes(byte[]), keyBytes(byte[])
function _hmac(keyBytes, dataString) {
  return Utilities.computeHmacSha256Signature(_strBytes(dataString), keyBytes);
}
function _hmacHex(keyBytes, dataString) {
  return _toHex(_hmac(keyBytes, dataString));
}

// ✅ 依 SigV4 規則用 byte[] 版一路推導（不要用 (String, byte[], Charset)）
function _getSignatureKey(secretKey, dateStamp, regionName, serviceName) {
  const kDate = Utilities.computeHmacSha256Signature(
    _strBytes(dateStamp),
    _strBytes("AWS4" + secretKey),
  );
  const kRegion = Utilities.computeHmacSha256Signature(
    _strBytes(regionName),
    kDate,
  );
  const kService = Utilities.computeHmacSha256Signature(
    _strBytes(serviceName),
    kRegion,
  );
  const kSigning = Utilities.computeHmacSha256Signature(
    _strBytes("aws4_request"),
    kService,
  );
  return kSigning; // byte[]
}

/**
 * ✅ 快取版本的簽名金鑰（效能優化）
 * 同一天內的簽名金鑰是固定的，使用快取可以避免重複計算
 * 大幅減少 HMAC-SHA256 計算次數，提升發送效率
 */
function _getSignatureKeyCached(secretKey, dateStamp, regionName, serviceName) {
  const cache = CacheService.getScriptCache();
  const cacheKey = `sigKey_${dateStamp}_${regionName}_${serviceName}`;

  // 嘗試從快取讀取
  const cachedHex = cache.get(cacheKey);
  if (cachedHex) {
    // Logger.log('簽名金鑰快取命中'); // 取消註解可查看快取效果
    return _hexToBytes(cachedHex);
  }

  // 快取未命中，計算新的簽名金鑰
  Logger.log("計算新的簽名金鑰（首次或快取過期）");
  const signingKey = _getSignatureKey(
    secretKey,
    dateStamp,
    regionName,
    serviceName,
  );

  // 存入快取（6 小時 = 21600 秒，Google Apps Script CacheService 上限）
  cache.put(cacheKey, _toHex(signingKey), 21600);

  return signingKey;
}

/**
 * 將 hex 字串轉換回 byte 陣列（用於從快取還原簽名金鑰）
 */
function _hexToBytes(hex) {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes;
}

function _toHex(byteArr) {
  return byteArr
    .map((b) => {
      const v = b < 0 ? b + 256 : b;
      return ("0" + v.toString(16)).slice(-2);
    })
    .join("");
}
