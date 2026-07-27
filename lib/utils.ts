import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TLSSocket } from "tls";
import type { NextApiRequest } from "next";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRequestProtocol(req: NextApiRequest): "http" | "https" {
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (typeof forwardedProto === "string" && forwardedProto.length > 0) {
    return forwardedProto.split(",")[0].trim() as "http" | "https";
  }
  if ((req.socket as TLSSocket).encrypted === true) {
    return "https";
  }
  return "http";
}

export function getRequestBaseUrl(req: NextApiRequest): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  const protocol = getRequestProtocol(req);
  const host = req.headers.host ?? "localhost";
  return `${protocol}://${host}`;
}
