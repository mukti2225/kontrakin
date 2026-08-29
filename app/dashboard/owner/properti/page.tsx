import PropertiKamarClient from "./properti-kamar-client";
import { getProperti } from "./actions";
import { getKamarList } from "../kamar/action";
import { getPenghuniAktif } from "../penghuni/action";

export default async function PropertiPage() {
  const [propertiList, kamarList, penghuniOptions] = await Promise.all([getProperti(), getKamarList(), getPenghuniAktif()]);

  return <PropertiKamarClient propertiData={propertiList} kamarData={kamarList} penghuniOptions={penghuniOptions} />;
}
