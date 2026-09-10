export const TRIAL_FORM_FIELDS = [
  "shopName",
  "contactName",
  "contactValue",
  "barberCount",
] as const;

export type TrialFormField = (typeof TRIAL_FORM_FIELDS)[number];

export interface TrialFormValues {
  shopName: string;
  contactName: string;
  contactValue: string;
  barberCount: string;
}

const FIELD_ORDER: TrialFormField[] = [
  "shopName",
  "contactName",
  "contactValue",
  "barberCount",
];

export function getTrialFormFieldErrors(
  values: TrialFormValues,
): Partial<Record<TrialFormField, true>> {
  const errors: Partial<Record<TrialFormField, true>> = {};
  if (!values.shopName.trim()) errors.shopName = true;
  if (!values.contactName.trim()) errors.contactName = true;
  if (!values.contactValue.trim()) errors.contactValue = true;
  const count = values.barberCount.trim();
  if (count) {
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1 || n > 100) errors.barberCount = true;
  }
  return errors;
}

export function firstInvalidTrialField(
  errors: Partial<Record<TrialFormField, true>>,
): TrialFormField | null {
  return FIELD_ORDER.find((field) => errors[field]) ?? null;
}
