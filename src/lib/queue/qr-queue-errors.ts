/** Thai user-facing messages for P8 QR queue (admin + customer). */

export const QR_QUEUE_THAI: Record<string, string> = {
  SLOT_TAKEN: "ช่องนี้มีคิวอยู่แล้ว — ลองช่างอื่นหรือเริ่มตัดแบบสั้น",
  NO_BARBER_FREE: "ตอนนี้ไม่มีช่างว่าง",
  INVALID_BARBER: "ช่างที่เลือกไม่พร้อมรับคิว",
  BARBER_OFF: "ช่างที่เลือกวันนี้หยุดงาน",
  BARBER_NOT_FOUND: "ไม่พบช่าง",
  NOT_FOUND: "ไม่พบคิวนี้",
  INVALID_STATUS: "คิวนี้ไม่ได้อยู่ในสถานะรอ",
  NOT_CANCELLABLE: "ยกเลิกคิวนี้ไม่ได้",
  FORBIDDEN: "ไม่มีสิทธิ์ทำรายการนี้",
  UNAUTHORIZED: "ต้องล็อกอิน LINE ก่อน",
  ALREADY_WAITING: "คุณอยู่ในคิวรออยู่แล้ว",
  INVALID_ACTION: "คำสั่งไม่ถูกต้อง",
  SLOT_PAST: "เวลานี้ผ่านไปแล้ว",
  INVALID_TIME: "เวลาไม่ถูกต้อง",
  INVALID_RANGE: "ช่วงเวลาไม่ถูกต้อง",
};

export function thaiQrQueueError(
  code: string | undefined,
  fallback = "ทำรายการไม่สำเร็จ",
): string {
  if (code && QR_QUEUE_THAI[code]) return QR_QUEUE_THAI[code];
  return fallback;
}
