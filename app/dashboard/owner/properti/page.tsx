import { PropertiClient } from "./properti-client";
import { getProperti } from "./actions";

export default async function PropertiPage() {
  const propertiList = await getProperti();

  return <PropertiClient data={propertiList} />;
}
