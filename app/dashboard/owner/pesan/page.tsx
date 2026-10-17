import { requireOrganization } from "@/lib/auth/get-current-user";
import { PesanClient } from "./pesan-client";
import { getCommunicationHistory, getTenantRecipients } from "./action";

export default async function PesanPage() {
  await requireOrganization();

  const [history, recipients] = await Promise.all([
    getCommunicationHistory(),
    getTenantRecipients(),
  ]);

  return <PesanClient initialHistory={history as any} recipients={recipients as any} />;
}
