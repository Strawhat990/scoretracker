import { supabase } from "./supabase";

const DEVICE_ID_KEY = "mba-tracker:device-id";
const PROFILE_ID_KEY = "mba-tracker:profile-id";

function uuid(): string {
  // crypto.randomUUID is available in all modern browsers.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for older environments.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Ensures this browser has a stable device id, and that the device
 * has a corresponding row in Supabase pointing at a profile. If this
 * is the very first load, a brand-new profile is created for it.
 * Returns { deviceId, profileId }.
 */
export async function ensureDevice(): Promise<{
  deviceId: string;
  profileId: string;
}> {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  let profileId = localStorage.getItem(PROFILE_ID_KEY);

  if (!deviceId) {
    deviceId = uuid();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  // Check if this device is already registered server-side.
  const { data: existing } = await supabase
    .from("devices")
    .select("profile_id")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (existing) {
    profileId = existing.profile_id;
    localStorage.setItem(PROFILE_ID_KEY, profileId!);
    await supabase
      .from("devices")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("device_id", deviceId);
    return { deviceId, profileId: profileId! };
  }

  // Brand-new device: create a profile and register the device against it.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({})
    .select("id")
    .single();

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? "Failed to create profile");
  }

  profileId = profile.id;

  const { error: deviceError } = await supabase.from("devices").insert({
    device_id: deviceId,
    profile_id: profileId,
  });

  if (deviceError) {
    throw new Error(deviceError.message);
  }

  localStorage.setItem(PROFILE_ID_KEY, profileId!);
  return { deviceId, profileId: profileId! };
}

/** Generates a 6-digit code that links to this device's current profile. */
export async function createSyncCode(profileId: string): Promise<string> {
  const { data, error } = await supabase.rpc("create_sync_code", {
    p_profile_id: profileId,
  });
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create sync code");
  }
  return data as string;
}

/**
 * Redeems a 6-digit code on this device, re-pointing it at the
 * profile the code belongs to. Returns the new profile id, or null
 * if the code was invalid/expired/already used.
 */
export async function redeemSyncCode(
  code: string,
  deviceId: string
): Promise<string | null> {
  const { data, error } = await supabase.rpc("redeem_sync_code", {
    p_code: code,
    p_device_id: deviceId,
  });
  if (error) {
    throw new Error(error.message);
  }
  const profileId = data as string | null;
  if (profileId) {
    localStorage.setItem(PROFILE_ID_KEY, profileId);
  }
  return profileId;
}
