import { getKamarList } from "./action";
import { getPenghuniAktif } from "../penghuni/action";
import { KamarClient } from "./kamar-client";

export default async function KamarPage() {
  const [rooms, penghuniOptions] = await Promise.all([getKamarList(), getPenghuniAktif()]);

  return <KamarClient initialRooms={rooms} penghuniOptions={penghuniOptions} />;
}
