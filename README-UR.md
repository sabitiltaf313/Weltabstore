# WellTabs Store — Seller Wallet (ابتدائی محفوظ ڈھانچہ)

## اس پیکج میں کیا ہے؟
- `index.html`: Firebase Email/Password لاگ اِن، والیٹ، رقم نکلوانے کی درخواست، ادائیگیوں کی تاریخ اور ایڈمن ویو۔
- `firestore.rules`: والیٹ اور درخواستوں پر browser سے براہِ راست لکھنے کی پابندی۔
- `functions/index.js`: محفوظ callable functions، ہر کامیاب فروخت پر 200 روپے پلیٹ فارم کمیشن، seller wallet credit، withdrawal reserve، admin listing اور paid status۔

## اہم حد
یہ مکمل marketplace/payment gateway نہیں ہے۔ `recordSuccessfulSale` فی الحال صرف Admin claim والے صارف کو اجازت دیتا ہے۔ اسے صرف اس وقت کال کریں جب ادائیگی واقعی verify ہو چکی ہو۔ آن لائن gateway webhook جوڑنے سے پہلے اسے public checkout سے نہ بلائیں۔ اس نمونے میں فروخت کی رقم `saleAmount` روپے میں integer ہے؛ ٹیکس، ریفنڈ، delivery اور gateway fee کا حساب الگ شامل کرنا ہوگا۔

## سیٹ اپ
1. Firebase Console میں Authentication > Sign-in method > Email/Password فعال کریں۔
2. Project settings > Your apps سے Firebase Web config کاپی کرکے `index.html` میں `firebaseConfig` کی placeholder values بدلیں۔
3. Firestore Database بنائیں۔ Rules سیکشن میں `firestore.rules` کا مواد publish کریں۔ یہ قواعد دوسرے موجودہ collections کو بھی بند کرتے ہیں؛ اگر آپ کے موجودہ پروجیکٹ میں اور collections ہیں تو پہلے ان کے rules محفوظ طریقے سے merge کریں۔
4. کمپیوٹر پر Firebase CLI اور Node.js 20 انسٹال کریں، پھر پروجیکٹ فولڈر میں:
   - `npm install -g firebase-tools`
   - `firebase login`
   - `firebase init functions` (JavaScript اور Node 20 منتخب کریں؛ موجودہ `functions` فولڈر کے لیے overwrite نہ کریں، یا یہ پیکج ایک نئے فولڈر میں رکھیں)
   - `cd functions && npm install`
   - `cd .. && firebase deploy --only functions,firestore:rules`
5. `index.html` کو GitHub repository میں root پر رکھیں۔ GitHub Pages میں Settings > Pages سے main branch / root منتخب کریں۔ Firebase Authentication کے Authorized domains میں اپنا GitHub Pages domain شامل کریں۔
6. Admin claim لازمی ہے۔ اسے صرف Firebase Admin SDK کے محفوظ ماحول میں اپنے تصدیق شدہ UID کے لیے مقرر کریں؛ browser UI سے کبھی admin اختیار نہ دیں۔ مثال Node script: `await getAuth().setCustomUserClaims('USER_UID_HERE', {admin:true})`. یہ اسکرپٹ صرف محفوظ local/server ماحول میں چلائیں، repository میں شامل نہ کریں۔ Admin کو دوبارہ لاگ اِن کرنا یا ID token refresh کرنا ہوگا۔

## ادائیگی کا طریقہ
ایزی پیسہ/جاز کیش/بینک سے رقم باہر ادائیگی کرکے، اصل transaction reference کے بعد Admin پینل میں `ادائیگی مکمل نشان زد کریں` استعمال کریں۔ یہ function خود پیسے نہیں بھیجتا۔ صرف `paid` نشان اس وقت لگائیں جب رقم بھیج دی ہو۔

## نوٹ
یہ ایک ابتدائی implementation ہے، production launch سے پہلے security review، refund/chargeback، stock reservation، audit logs، payout rejection/refund flow، rate limiting اور payment provider integration ضروری ہیں۔
