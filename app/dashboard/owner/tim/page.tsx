import { getTeamMembers } from "./action";
import { TimClient } from "./tim-client";

export default async function OwnerTimPage() {
  const members = await getTeamMembers();
  return <TimClient initialMembers={members} />;
}
