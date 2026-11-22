import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireBusinessAccess } from "./access";
import type { EstimationInput } from "./workspace.server";

const estimationSchema = z.object({
  modelId: z.string().uuid(),
  color: z.string().min(1).max(60),
  storageGb: z.number().int().positive(),
  imei: z.string().max(30).optional().nullable(),
  ruleIds: z.array(z.string().uuid()).max(200),
  notes: z.string().max(1000).optional().nullable(),
});

/** Creates (or returns) the shop workspace attached to the signed-in user. */
export const ensureWorkspace = createServerFn({ method: "POST" })
  .middleware([requireBusinessAccess])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ensureWorkspaceFor } = await import("./workspace.server");
    const claims = context.claims as Record<string, unknown>;
    const metadata = (claims.user_metadata as Record<string, unknown>) ?? {};
    // Previews can read already-provisioned workspaces using the caller's
    // JWT and existing tenant RLS policies without a service-role secret.
    // Never use that user-scoped client to provision shops or assign roles.
    const hasAdminKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    return ensureWorkspaceFor(
      hasAdminKey ? supabaseAdmin : context.supabase,
      context.userId,
      (claims.email as string) ?? null,
      metadata,
      { allowProvisioning: hasAdminKey },
    );
  });

/** Authoritative price computation + persistence of an estimation. */
export const createEstimation = createServerFn({ method: "POST" })
  .middleware([requireBusinessAccess])
  .inputValidator((data: EstimationInput) => estimationSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { saveEstimation } = await import("./workspace.server");
    return saveEstimation(context.supabase, supabaseAdmin, context.userId, data);
  });
