import { requireOrganization } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db/prisma";
import { LaporanClient } from "./laporan-client";
import { getPortfolioReport, getExecutiveSummaryAction } from "./action";

export default async function OwnerLaporanPage() {
  const { user, organization } = await requireOrganization();

  const [report, properties, executiveSummary] = await Promise.all([
    getPortfolioReport(),
    prisma.properti.findMany({
      where: {
        OR: [{ ownerId: user.id }, { organizationId: organization.id }],
      },
      select: { id: true, nama: true },
      orderBy: { nama: "asc" },
    }),
    getExecutiveSummaryAction(),
  ]);

  return (
    <LaporanClient
      initialReport={report}
      properties={properties}
      initialExecutiveSummary={executiveSummary}
    />
  );
}
