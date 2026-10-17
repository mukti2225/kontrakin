"use server";

import { cookies } from "next/headers";
import { TenantActivationService } from "@/lib/services/tenant-activation-service";

export async function requestOtpAction(rawToken: string) {
  try {
    return await TenantActivationService.requestOtp(rawToken);
  } catch (err: any) {
    throw new Error(err.message || "Gagal mengirimkan kode OTP");
  }
}

export async function verifyOtpAndLoginAction(params: {
  rawToken: string;
  otpCode: string;
  password?: string;
}) {
  try {
    const result = await TenantActivationService.verifyOtpAndActivate(params);

    // Set Better-Auth session cookie
    const cookieStore = await cookies();
    cookieStore.set("better-auth.session_token", result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: result.sessionExpiresAt,
    });

    return {
      success: true,
      redirectUrl: "/dashboard/tenant",
      tenantName: result.tenantName,
    };
  } catch (err: any) {
    throw new Error(err.message || "Verifikasi kode OTP gagal");
  }
}
