export const DEFAULT_CHROMAFORGE_API_ORIGIN = "https://color-api-9qdz.onrender.com";

export type ApiOriginConfiguration =
  | { available: true; origin: string; source: "default" | "configured" }
  | { available: false; origin: ""; message: string };

export function resolveApiOrigin(setting: string | undefined): ApiOriginConfiguration {
  if (setting === undefined) {
    return { available: true, origin: DEFAULT_CHROMAFORGE_API_ORIGIN, source: "default" };
  }
  if (setting.trim() === "") {
    return { available: false, origin: "", message: "No API origin is configured for this website build." };
  }

  try {
    const url = new URL(setting);
    if ((url.protocol !== "https:" && url.protocol !== "http:")
      || url.username !== ""
      || url.password !== ""
      || url.pathname !== "/"
      || url.search !== ""
      || url.hash !== "") {
      return { available: false, origin: "", message: "The configured API address must be one HTTP(S) origin without a path or credentials." };
    }
    return { available: true, origin: url.origin, source: "configured" };
  } catch {
    return { available: false, origin: "", message: "The configured API address is not a valid HTTP(S) origin." };
  }
}

export const apiOriginConfiguration = resolveApiOrigin(process.env.NEXT_PUBLIC_CHROMAFORGE_API_ORIGIN);
