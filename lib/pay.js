import { Invoice, Payment, LedgerEntry, AdmitCard, ExamNotice, Student } from "@/lib/models";
import { HttpError, bad } from "@/lib/http";
import { netPaidMap, obligation, lockInvoice, nextNo, nextNos, round2 } from "@/lib/finance";
import { audit } from "@/lib/audit";
import { getSettings } from "@/lib/settings";

// সক্রিয় পেমেন্ট মাধ্যম (শিক্ষার্থীর জন্য) — ক্যাশ এখানে নেই, সেটা অফিসে রেকর্ড হয়
export async function activeMethods() {
  const st = await getSettings(true);
  return (st.paymentMethods || []).filter((m) => m.active !== false);
}

// একটি ইনভয়েসের বিপরীতে পেমেন্ট + লেজার এন্ট্রি (ট্রানজ্যাকশনের ভেতরে ডাকতে হবে)। বকেয়ার বেশি নেওয়া যায় না, ইনভয়েস লক হয়।
export async function recordPayment(session, { invoiceId, amount, method, methodLabel, date, reference, note, channel, trxId, senderNumber, receiverNumber, submission, user }) {
  const inv = await Invoice.findById(invoiceId).session(session);
  if (!inv || inv.status === "void") throw new HttpError(404, "ইনভয়েস পাওয়া যায়নি");
  await lockInvoice(inv._id, session);
  const net = (await netPaidMap([inv._id], session))[String(inv._id)] || 0;
  const due = round2(obligation(inv) - net);
  if (amount > due + 0.001) throw bad(`বকেয়া মাত্র ${due} টাকা — এর বেশি নেওয়া যাবে না`);
  const receiptNo = await nextNo("R", session);
  const [pay] = await Payment.create([{ receiptNo, type: "payment", invoice: inv._id, student: inv.student, amount, method, methodLabel, date, reference, note, channel, trxId, senderNumber, receiverNumber, submission, createdBy: user.id, createdByName: user.name }], { session });
  await LedgerEntry.create([{ type: "income", account: method, category: "fee", title: `বেতন/ফি আদায় — ${inv.title} (${receiptNo})`, amount, date, reference: receiptNo, source: "payment", sourceKey: `payment:${pay._id}`, createdByName: user.name }], { session });
  await audit(user, "payment", "payment", pay._id, { receiptNo, amount, invoice: inv.invoiceNo, method, channel }, session);
  const newDue = round2(due - amount);
  if (inv.examNotice && newDue <= 0.001) await ensureAdmitCard(session, inv);
  return { pay, inv, due: newDue };
}

// পরীক্ষার ফি পুরো পরিশোধ হলে অ্যাডমিট কার্ড তৈরি (একবারই — ডুপ্লিকেট অসম্ভব)
export async function ensureAdmitCard(session, inv) {
  const exam = await ExamNotice.findById(inv.examNotice).session(session);
  const stu = await Student.findById(inv.student).select("roll class section").session(session);
  if (!exam || !stu) return null;
  const ex = await AdmitCard.findOne({ exam: exam._id, student: stu._id }).session(session);
  if (ex) return ex;
  const [admitNo] = await nextNos("ADM", 1, session);
  const [c] = await AdmitCard.create([{ admitNo, exam: exam._id, student: stu._id, invoice: inv._id, roll: stu.roll, class: stu.class, section: stu.section }], { session });
  return c;
}

// অ্যাডমিট কার্ড এখন ছাপার যোগ্য কি? ফি না থাকলে হ্যাঁ; থাকলে ইনভয়েস পুরো পরিশোধিত (বাতিল/রিফান্ড হলে না)
export async function admitEligible(card, exam) {
  if (!exam || exam.status !== "published") return false;
  if (!exam.fee || exam.fee <= 0) return true;
  if (!card.invoice) return false;
  const inv = await Invoice.findById(card.invoice).lean();
  if (!inv || inv.status === "void") return false;
  const net = (await netPaidMap([inv._id]))[String(inv._id)] || 0;
  return round2(obligation(inv) - net) <= 0.001;
}
