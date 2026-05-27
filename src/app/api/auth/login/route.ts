import { createSession, ensureDefaultAdmin, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  await ensureDefaultAdmin();

  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.redirect(
      new URL("/login?error=Credenciais%20invalidas", request.url),
    );
  }

  await createSession(user.id);
  return NextResponse.redirect(new URL("/", request.url));
}
