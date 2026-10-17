import { getPenghuniList, getAvailableKamarOptions } from "./action";
import { PenghuniClient } from "./penghuni-client";

export default async function PenghuniPage() {
  const [penghuni, availableKamar] = await Promise.all([
    getPenghuniList(),
    getAvailableKamarOptions(),
  ]);

  return <PenghuniClient initialPenghuni={penghuni} availableKamar={availableKamar} />;
}

