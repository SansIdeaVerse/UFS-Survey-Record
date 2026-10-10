// Form validation helpers for the entry form.

export interface FieldError {
  field: "name" | "households";
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: FieldError[];
}

export const NAME_MAX = 100;
export const HOUSEHOLD_MIN = 1;
export const HOUSEHOLD_MAX = 999;

/** Validate the entry form fields. */
export function validateEntry(input: {
  name: string;
  households: number | null;
}): ValidationResult {
  const errors: FieldError[] = [];
  const trimmed = input.name.trim();

  if (trimmed.length < 1) {
    errors.push({ field: "name", message: "Name is required." });
  } else if (trimmed.length > NAME_MAX) {
    errors.push({
      field: "name",
      message: `Name must be ${NAME_MAX} characters or fewer.`,
    });
  }

  if (
    input.households == null ||
    Number.isNaN(input.households) ||
    !Number.isInteger(input.households)
  ) {
    errors.push({
      field: "households",
      message: "Enter a whole number.",
    });
  } else if (input.households < HOUSEHOLD_MIN) {
    errors.push({
      field: "households",
      message: `Minimum is ${HOUSEHOLD_MIN}.`,
    });
  } else if (input.households > HOUSEHOLD_MAX) {
    errors.push({
      field: "households",
      message: `Maximum is ${HOUSEHOLD_MAX}.`,
    });
  }

  return { valid: errors.length === 0, errors };
}
