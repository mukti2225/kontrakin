import { getKamarList } from "./action";
import { getPenghuniAktif } from "../penghuni/action";
import { getProperti } from "../properti/actions";
import { KamarClient } from "./kamar-client";

export default async function KamarPage() {
  const [rooms, penghuniOptions, propertiList] = await Promise.all([
    getKamarList(),
    getPenghuniAktif(),
    getProperti(),
  ]);

  // Sederhanakan properti menjadi { id, nama } untuk dropdown
  const propertiOptions = propertiList.map((p) => ({ id: p.id, nama: p.nama }));

  return (
    <KamarClient
      initialRooms={rooms}
      penghuniOptions={penghuniOptions}
      propertiOptions={propertiOptions}
    />
  );
}
