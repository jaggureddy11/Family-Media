import { BrowserContext } from "@playwright/test";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { Role } from "@prisma/client";

/**
 * Directly provisions a valid 12-month session cookie for Mom (or admin)
 * by calling the dev test-session endpoint on the active web server.
 */
export async function setupSessionCookie(
  context: BrowserContext,
  role: Role = Role.FAMILY,
  userId: string = "mom-1"
): Promise<string> {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001";
  const res = await context.request.post(`${baseUrl}/api/auth/test-session`, {
    data: { userId, role },
  });

  const data = await res.json();
  if (!data.cookieValue) {
    throw new Error("Failed to obtain test session cookie: " + JSON.stringify(data));
  }

  await context.addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value: data.cookieValue,
      url: baseUrl,
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  return data.cookieValue;
}
