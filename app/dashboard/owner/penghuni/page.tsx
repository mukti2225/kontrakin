import { getPenghuniList } from "./action";
import { PenghuniClient } from "./penghuni-client";

export default async function PenghuniPage() {
  const penghuni = await getPenghuniList();
  return <PenghuniClient initialPenghuni={penghuni} />;
}
