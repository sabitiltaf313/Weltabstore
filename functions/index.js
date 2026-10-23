
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const {
  getFirestore,
  FieldValue
} = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

function requireUser(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "براہِ کرم لاگ اِن کریں۔");
  }
  return request.auth.uid;
}

function requireAdmin(request) {
  requireUser(request);
  if (request.auth.token.admin !== true) {
    throw new HttpsError("permission-denied", "صرف ایڈمن یہ کام کر سکتا ہے۔");
  }
}

// 1. سیلر کی رقم نکلوانے کی درخواست
exports.requestWithdrawal = onCall(async (request) => {
  const uid = requireUser(request);
  const { amount, method, accountName, accountNumber } = request.data || {};

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new HttpsError("invalid-argument", "درست رقم درج کریں۔");
  }

  if (!["Easypaisa", "JazzCash", "Bank"].includes(method)) {
    throw new HttpsError("invalid-argument", "ادائیگی کا طریقہ درست نہیں۔");
  }

  if (
    typeof accountName !== "string" || !accountName.trim() ||
    typeof accountNumber !== "string" || !accountNumber.trim()
  ) {
    throw new HttpsError("invalid-argument", "ادائیگی کی تفصیل مکمل کریں۔");
  }

  const userRef = db.collection("users").doc(uid);
  const withdrawalRef = db.collection("withdrawalRequests").doc();

  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);

    if (!userSnap.exists) {
      throw new HttpsError("failed-precondition", "سیلر کا والٹ موجود نہیں۔");
    }

    const balance = userSnap.get("balance") || 0;

    if (!Number.isSafeInteger(balance) || balance < amount) {
      throw new HttpsError("failed-precondition", "والٹ میں رقم ناکافی ہے۔");
    }

    tx.update(userRef, {
      balance: balance - amount
    });

    tx.set(withdrawalRef, {
      sellerUid: uid,
      amount,
      method,
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
      status: "pending",
      createdAt: FieldValue.serverTimestamp()
    });
  });

  return { success: true, requestId: withdrawalRef.id };
});

// 2. ایڈمن تصدیق شدہ ادائیگی مکمل کرتا ہے
exports.completeWithdrawal = onCall(async (request) => {
  requireAdmin(request);

  const { requestId } = request.data || {};

  if (typeof requestId !== "string" || !requestId.trim()) {
    throw new HttpsError("invalid-argument", "درخواست کی ID درکار ہے۔");
  }

  const ref = db.collection("withdrawalRequests").doc(requestId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);

    if (!snap.exists) {
      throw new HttpsError("not-found", "درخواست نہیں ملی۔");
    }

    if (snap.get("status") !== "pending") {
      throw new HttpsError("failed-precondition", "یہ درخواست پہلے ہی نمٹائی جا چکی ہے۔");
    }

    tx.update(ref, {
      status: "paid",
      paidAt: FieldValue.serverTimestamp(),
      paidBy: request.auth.uid
    });
  });

  return { success: true };
});

// 3. حقیقی مکمل شدہ آرڈر پر صرف ایک بار Rs. 200 کریڈٹ
exports.creditSuccessfulSale = onCall(async (request) => {
  requireAdmin(request);

  const { sellerUid, orderId } = request.data || {};

  if (
    typeof sellerUid !== "string" || !sellerUid.trim() ||
    typeof orderId !== "string" || !orderId.trim()
  ) {
    throw new HttpsError("invalid-argument", "Seller UID اور Order ID درکار ہیں۔");
  }

  const orderRef = db.collection("orders").doc(orderId);
  const userRef = db.collection("users").doc(sellerUid);
  const creditRef = db.collection("saleCredits").doc(orderId);

  await db.runTransaction(async (tx) => {
    const orderSnap = await tx.get(orderRef);
    const userSnap = await tx.get(userRef);
    const creditSnap = await tx.get(creditRef);

    if (!orderSnap.exists) {
      throw new HttpsError("not-found", "آرڈر نہیں ملا۔");
    }

    if (!userSnap.exists) {
      throw new HttpsError("not-found", "سیلر کا اکاؤنٹ نہیں ملا۔");
    }

    if (creditSnap.exists) {
      throw new HttpsError("already-exists", "اس آرڈر کا کمیشن پہلے دیا جا چکا ہے۔");
    }

    const order = orderSnap.data();

    // آپ کے آرڈر ڈیٹا میں یہ فیلڈز موجود ہونی چاہییں۔
    if (
      order.sellerUid !== sellerUid ||
      !["completed", "delivered"].includes(order.status)
    ) {
      throw new HttpsError(
        "failed-precondition",
        "آرڈر مکمل نہیں یا اس کا سیلر UID میچ نہیں کرتا۔"
      );
    }

    const balance = userSnap.get("balance") || 0;

    if (!Number.isSafeInteger(balance) || balance < 0) {
      throw new HttpsError("failed-precondition", "والٹ کا بیلنس درست نہیں۔");
    }

    tx.update(userRef, { balance: balance + 200 });

    tx.create(creditRef, {
      orderId,
      sellerUid,
      amount: 200,
      createdAt: FieldValue.serverTimestamp(),
      creditedBy: request.auth.uid
    });
  });

  return { success: true, amount: 200 };
});
