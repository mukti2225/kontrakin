import { getLeaseList } from "./action";
import { getKamarList } from "../kamar/action";
import { getPenghuniList } from "../penghuni/action";
import { getProperti } from "../properti/actions";
import { KontrakClient } from "./kontrak-client";

export default async function KontrakPage() {
  const [leases, kamars, penghunis, propertis] = await Promise.all([
    getLeaseList(),
    getKamarList(),
    getPenghuniList(),
    getProperti(),
  ]);

  return (
    <KontrakClient
      initialLeases={leases}
      kamars={kamars}
      penghunis={penghunis}
      propertis={propertis}
    />
  );
}

