import { getStatusGabungTenant } from "./action";
import { GabungClient } from "./kontrak-client";

export default async function KontrakPage() {
  const status = await getStatusGabungTenant();
  return (
    <div className="p-6">
      <GabungClient statusAwal={status} />
    </div>
  );
}
