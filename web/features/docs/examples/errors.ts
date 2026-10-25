import { InvalidColorError, validateColorValue } from "chromaforge";

export function readHexColor(value: string) {
  try {
    return validateColorValue("hex", value);
  } catch (error: unknown) {
    if (error instanceof InvalidColorError) {
      return { valid: false as const, issues: error.issues };
    }
    throw error;
  }
}
