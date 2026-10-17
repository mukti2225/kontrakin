import test from "node:test";
import assert from "node:assert/strict";

test("Financial Engine - Invoice balance and payment allocation logic", () => {
  // Scenario: Invoice for Rp 2.500.000 rent + Rp 200.000 electricity
  const invoice = {
    id: "inv-101",
    subtotal: 2700000,
    discountTotal: 200000,
    taxTotal: 0,
    penaltyTotal: 0,
    total: 2500000,
    balanceDue: 2500000,
    status: "issued",
  };

  // Helper function simulating payment allocation
  const allocatePayment = (inv, paymentAmount) => {
    assert.ok(paymentAmount > 0, "Payment amount must be positive");
    assert.ok(inv.balanceDue > 0, "Invoice is already fully paid");

    const allocated = Math.min(inv.balanceDue, paymentAmount);
    const remainingCredit = paymentAmount - allocated;
    const newBalanceDue = inv.balanceDue - allocated;

    let newStatus = "partial";
    if (newBalanceDue === 0) {
      newStatus = "paid";
    }

    return {
      updatedInvoice: {
        ...inv,
        balanceDue: newBalanceDue,
        status: newStatus,
      },
      allocation: {
        invoiceId: inv.id,
        amount: allocated,
      },
      remainingCredit,
    };
  };

  // 1. Partial payment: Tenant pays Rp 1.000.000
  const step1 = allocatePayment(invoice, 1000000);
  assert.equal(step1.allocation.amount, 1000000);
  assert.equal(step1.remainingCredit, 0);
  assert.equal(step1.updatedInvoice.balanceDue, 1500000);
  assert.equal(step1.updatedInvoice.status, "partial");

  // 2. Second payment: Tenant pays Rp 1.500.000
  const step2 = allocatePayment(step1.updatedInvoice, 1500000);
  assert.equal(step2.allocation.amount, 1500000);
  assert.equal(step2.remainingCredit, 0);
  assert.equal(step2.updatedInvoice.balanceDue, 0);
  assert.equal(step2.updatedInvoice.status, "paid");

  // 3. Re-paying fully paid invoice must be prevented
  assert.throws(
    () => allocatePayment(step2.updatedInvoice, 500000),
    /already fully paid/
  );
});

test("Audit Logger - Sensitive credential masking", () => {
  const sanitize = (data) => {
    if (!data) return undefined;
    const str = JSON.stringify(data, (key, value) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes("password") ||
        lowerKey.includes("secret") ||
        lowerKey.includes("token") ||
        lowerKey.includes("credential")
      ) {
        return "[MASKED]";
      }
      return value;
    });
    return JSON.parse(str);
  };

  const payload = {
    userId: "usr-123",
    email: "owner@kontrakin.com",
    password: "SuperSecretPassword123!",
    apiSecret: "sec_live_9999",
    authToken: "bearer_xyz_token",
    profile: {
      fullName: "Budi Santoso",
      userPasswordHash: "$2b$10$xyz...",
    },
  };

  const masked = sanitize(payload);

  assert.equal(masked.userId, "usr-123");
  assert.equal(masked.email, "owner@kontrakin.com");
  assert.equal(masked.password, "[MASKED]");
  assert.equal(masked.apiSecret, "[MASKED]");
  assert.equal(masked.authToken, "[MASKED]");
  assert.equal(masked.profile.userPasswordHash, "[MASKED]");
  assert.equal(masked.profile.fullName, "Budi Santoso");
});

test("Financial Engine - Invoice Cancellation and Void Invariants", () => {
  const cancelInvoice = (inv, allocations = [], reason = "") => {
    if (inv.status === "cancelled") {
      throw new Error("Tagihan ini sudah dibatalkan sebelumnya");
    }
    const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
    if (totalAllocated > 0) {
      throw new Error("Tagihan tidak dapat dibatalkan karena sudah ada pembayaran yang dialokasikan");
    }

    return {
      ...inv,
      status: "cancelled",
      balanceDue: 0,
      notes: inv.notes ? `${inv.notes} | [Dibatalkan: ${reason}]` : `[Dibatalkan: ${reason}]`,
    };
  };

  // 1. Unpaid invoice can be cancelled
  const unpaidInv = {
    id: "inv-201",
    total: 1500000,
    balanceDue: 1500000,
    status: "issued",
    notes: "Tagihan Sewa November",
  };

  const cancelled = cancelInvoice(unpaidInv, [], "Salah input kamar");
  assert.equal(cancelled.status, "cancelled");
  assert.equal(cancelled.balanceDue, 0);
  assert.ok(cancelled.notes.includes("Salah input kamar"));

  // 2. Already cancelled invoice cannot be cancelled again
  assert.throws(
    () => cancelInvoice(cancelled, [], "Batal ulang"),
    /sudah dibatalkan sebelumnya/
  );

  // 3. Partially paid invoice cannot be cancelled silently
  const partiallyPaidInv = {
    id: "inv-202",
    total: 2000000,
    balanceDue: 1000000,
    status: "partial",
  };
  const existingAllocations = [{ id: "alloc-1", amount: 1000000 }];

  assert.throws(
    () => cancelInvoice(partiallyPaidInv, existingAllocations, "Mau dibatalkan"),
    /sudah ada pembayaran yang dialokasikan/
  );
});

test("Financial Engine - Overdue and Partial Payment Calculations", () => {
  const evaluateInvoiceStatus = (inv, referenceDate = new Date("2026-10-20T00:00:00Z")) => {
    const dueDate = new Date(inv.dueDate);
    const isOverdue = dueDate < referenceDate && inv.balanceDue > 0;
    const diffDays = isOverdue
      ? Math.max(1, Math.ceil((referenceDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
    const paidAmount = Math.max(0, inv.total - inv.balanceDue);
    const paidPct = inv.total > 0 ? Math.round((paidAmount / inv.total) * 100) : 0;

    let computedStatus = "issued";
    if (inv.status === "cancelled") {
      computedStatus = "cancelled";
    } else if (inv.balanceDue === 0) {
      computedStatus = "paid";
    } else if (paidAmount > 0) {
      computedStatus = "partial";
    } else if (isOverdue) {
      computedStatus = "overdue";
    }

    return {
      isOverdue,
      diffDays,
      paidAmount,
      paidPct,
      computedStatus,
    };
  };

  // Test overdue 5 days
  const overdueInv = {
    total: 2000000,
    balanceDue: 2000000,
    dueDate: "2026-10-15T00:00:00Z",
    status: "issued",
  };
  const eval1 = evaluateInvoiceStatus(overdueInv);
  assert.equal(eval1.isOverdue, true);
  assert.equal(eval1.diffDays, 5);
  assert.equal(eval1.paidPct, 0);
  assert.equal(eval1.computedStatus, "overdue");

  // Test partial payment
  const partialInv = {
    total: 2000000,
    balanceDue: 500000,
    dueDate: "2026-10-25T00:00:00Z",
    status: "partial",
  };
  const eval2 = evaluateInvoiceStatus(partialInv);
  assert.equal(eval2.isOverdue, false);
  assert.equal(eval2.paidAmount, 1500000);
  assert.equal(eval2.paidPct, 75);
  assert.equal(eval2.computedStatus, "partial");
});

test("Financial Engine - One payment to multiple invoices (FIFO auto-settlement)", () => {
  // Scenario: Tenant has two unpaid invoices:
  // INV-1: Due earlier, balance 1.000.000
  // INV-2: Due later, balance 2.000.000
  const invoices = [
    { id: "inv-1", balanceDue: 1000000, total: 1000000, dueDate: "2026-09-01", status: "overdue" },
    { id: "inv-2", balanceDue: 2000000, total: 2000000, dueDate: "2026-10-01", status: "issued" },
  ];

  const processFifoPayment = (invs, amount) => {
    let remaining = amount;
    const allocations = [];
    const updatedInvoices = invs.map((inv) => {
      if (remaining <= 0) return { ...inv };
      const alloc = Math.min(inv.balanceDue, remaining);
      const newBal = inv.balanceDue - alloc;
      allocations.push({ invoiceId: inv.id, amount: alloc });
      remaining -= alloc;
      return {
        ...inv,
        balanceDue: newBal,
        status: newBal === 0 ? "paid" : "partial",
      };
    });

    return {
      updatedInvoices,
      allocations,
      remainingCredit: remaining,
    };
  };

  // Tenant pays Rp 2.500.000
  const result = processFifoPayment(invoices, 2500000);
  assert.equal(result.allocations.length, 2);
  assert.equal(result.allocations[0].amount, 1000000); // Fully settles inv-1
  assert.equal(result.allocations[1].amount, 1500000); // Partially settles inv-2
  assert.equal(result.updatedInvoices[0].status, "paid");
  assert.equal(result.updatedInvoices[0].balanceDue, 0);
  assert.equal(result.updatedInvoices[1].status, "partial");
  assert.equal(result.updatedInvoices[1].balanceDue, 500000);
  assert.equal(result.remainingCredit, 0);
});

test("Financial Engine - Custom multi-invoice allocation and credit/overpayment retention", () => {
  const invoices = [
    { id: "inv-1", balanceDue: 1000000, total: 1000000, status: "issued" },
    { id: "inv-2", balanceDue: 1000000, total: 1000000, status: "issued" },
  ];

  const processCustomPayment = (invs, amount, customSplits) => {
    let remaining = amount;
    const allocations = [];
    const updatedInvoices = invs.map((inv) => {
      const splitAmount = customSplits[inv.id] || 0;
      if (splitAmount <= 0) return { ...inv };
      assert.ok(splitAmount <= inv.balanceDue, "Split amount cannot exceed invoice balance due");
      assert.ok(splitAmount <= remaining, "Split amount cannot exceed available payment");
      allocations.push({ invoiceId: inv.id, amount: splitAmount });
      remaining -= splitAmount;
      const newBal = inv.balanceDue - splitAmount;
      return {
        ...inv,
        balanceDue: newBal,
        status: newBal === 0 ? "paid" : "partial",
      };
    });

    return {
      updatedInvoices,
      allocations,
      remainingCredit: remaining,
    };
  };

  // Tenant pays Rp 2.500.000, owner custom allocates:
  // INV-1: 500.000 (leaves 500.000)
  // INV-2: 1.000.000 (fully paid)
  // Remaining 1.000.000 stays as unallocated credit!
  const result = processCustomPayment(invoices, 2500000, {
    "inv-1": 500000,
    "inv-2": 1000000,
  });

  assert.equal(result.allocations.length, 2);
  assert.equal(result.updatedInvoices[0].status, "partial");
  assert.equal(result.updatedInvoices[0].balanceDue, 500000);
  assert.equal(result.updatedInvoices[1].status, "paid");
  assert.equal(result.updatedInvoices[1].balanceDue, 0);
  assert.equal(result.remainingCredit, 1000000);
});

test("Financial Engine - Payment Refund and Reversal Invariants", () => {
  const payment = {
    id: "pay-501",
    amount: 2000000,
    status: "completed",
    allocations: [
      { invoiceId: "inv-1", amount: 1500000 },
      { invoiceId: "inv-2", amount: 500000 },
    ],
  };

  const invoices = [
    { id: "inv-1", total: 1500000, balanceDue: 0, status: "paid", dueDate: "2026-10-01" },
    { id: "inv-2", total: 1000000, balanceDue: 500000, status: "partial", dueDate: "2026-10-01" },
  ];

  const refundPayment = (p, invList, reason) => {
    assert.ok(p.status !== "refunded", "Payment already refunded");
    assert.ok(reason && reason.trim().length > 0, "Refund reason required");

    const restoredInvoices = invList.map((inv) => {
      const alloc = p.allocations.find((a) => a.invoiceId === inv.id);
      if (!alloc) return inv;
      const restoredBal = Math.min(inv.total, inv.balanceDue + alloc.amount);
      const isOverdue = new Date(inv.dueDate) < new Date("2026-10-20");
      const restoredStatus =
        restoredBal >= inv.total ? (isOverdue ? "overdue" : "issued") : "partial";

      return {
        ...inv,
        balanceDue: restoredBal,
        status: restoredStatus,
      };
    });

    const updatedPayment = {
      ...p,
      status: "refunded",
      notes: `[REFUNDED: ${reason}]`,
    };

    const cashbookReversal = {
      jenis: "pengeluaran",
      kategori: "Refund Pembayaran",
      jumlah: p.amount,
      keterangan: `Reversal / Refund Pembayaran Ref: ${p.id} - ${reason}`,
    };

    return {
      updatedPayment,
      restoredInvoices,
      cashbookReversal,
    };
  };

  const refundResult = refundPayment(payment, invoices, "Penghuni salah transfer rekening");
  assert.equal(refundResult.updatedPayment.status, "refunded");
  assert.equal(refundResult.cashbookReversal.jumlah, 2000000);
  assert.equal(refundResult.cashbookReversal.jenis, "pengeluaran");

  // Invoices balance due must be restored:
  // inv-1: balance restored from 0 to 1.500.000, status restored from paid to overdue
  assert.equal(refundResult.restoredInvoices[0].balanceDue, 1500000);
  assert.equal(refundResult.restoredInvoices[0].status, "overdue");

  // inv-2: balance restored from 500.000 to 1.000.000, status restored to overdue
  assert.equal(refundResult.restoredInvoices[1].balanceDue, 1000000);
  assert.equal(refundResult.restoredInvoices[1].status, "overdue");

  // Double refund must throw
  assert.throws(
    () => refundPayment(refundResult.updatedPayment, refundResult.restoredInvoices, "Double refund"),
    /already refunded/
  );
});

test("Expense Management - Metadata serialization and roundtrip parsing", () => {
  // Parsing helper replicating the tab logic
  function parseExpenseDescription(keterangan) {
    if (!keterangan) return { cleanDescription: "-" };
    let str = keterangan;
    let vendorName;
    let maintenanceTicketId;
    let maintenanceTitle;
    let receiptUrl;

    const vendorMatch = str.match(/\[Vendor:\s*([^\]]+)\]/i);
    if (vendorMatch) {
      vendorName = vendorMatch[1].trim();
      str = str.replace(vendorMatch[0], "").trim();
    }

    const ticketMatch = str.match(/\[Tiket:\s*([^\]]+)\]/i);
    if (ticketMatch) {
      const ticketPart = ticketMatch[1].trim();
      if (ticketPart.includes(" - ")) {
        const [idPart, titlePart] = ticketPart.split(" - ");
        maintenanceTicketId = idPart.trim();
        maintenanceTitle = titlePart.trim();
      } else {
        maintenanceTicketId = ticketPart;
      }
      str = str.replace(ticketMatch[0], "").trim();
    }

    const receiptMatch = str.match(/\[Bukti:\s*([^\]]+)\]/i);
    if (receiptMatch) {
      receiptUrl = receiptMatch[1].trim();
      str = str.replace(receiptMatch[0], "").trim();
    }

    return {
      vendorName,
      maintenanceTicketId,
      maintenanceTitle,
      receiptUrl,
      cleanDescription: str.replace(/^[-–—:\s]+/, "").trim() || "-",
    };
  }

  function formatExpenseDescription(cleanText, vendor, ticket, receipt) {
    const parts = [];
    if (vendor) parts.push(`[Vendor: ${vendor}]`);
    if (ticket) parts.push(`[Tiket: ${ticket}]`);
    if (receipt) parts.push(`[Bukti: ${receipt}]`);
    parts.push(cleanText.trim());
    return parts.join(" ");
  }

  // 1. Full tags test
  const rawDesc = formatExpenseDescription(
    "Penggantian pipa PVC & keran bocor kamar mandi",
    "CV Tirta Lancar Jaya",
    "#TIK-882 - Pipa Wastafel Bocor",
    "https://images.unsplash.com/photo-1554415707-9e4466bfe0d2"
  );
  const parsed = parseExpenseDescription(rawDesc);
  assert.equal(parsed.vendorName, "CV Tirta Lancar Jaya");
  assert.equal(parsed.maintenanceTicketId, "#TIK-882");
  assert.equal(parsed.maintenanceTitle, "Pipa Wastafel Bocor");
  assert.equal(parsed.receiptUrl, "https://images.unsplash.com/photo-1554415707-9e4466bfe0d2");
  assert.equal(parsed.cleanDescription, "Penggantian pipa PVC & keran bocor kamar mandi");

  // 2. Backward compatibility with plain text description
  const legacy = parseExpenseDescription("Beli token PLN darurat 200rb");
  assert.equal(legacy.vendorName, undefined);
  assert.equal(legacy.maintenanceTicketId, undefined);
  assert.equal(legacy.receiptUrl, undefined);
  assert.equal(legacy.cleanDescription, "Beli token PLN darurat 200rb");

  // 3. Null/empty safety
  const empty = parseExpenseDescription(null);
  assert.equal(empty.cleanDescription, "-");
});

test("Expense Management - Room Leak Anomaly Detection & NOI Calculations", () => {
  // Sample transactions for a property in current month
  const transactions = [
    // Income
    { id: "t1", jenis: "pemasukan", jumlah: 3500000, kategori: "Sewa Kamar", kamarId: "k-101", tanggal: "2026-10-01" },
    { id: "t2", jenis: "pemasukan", jumlah: 3500000, kategori: "Sewa Kamar", kamarId: "k-102", tanggal: "2026-10-02" },
    { id: "t3", jenis: "pemasukan", jumlah: 3000000, kategori: "Sewa Kamar", kamarId: "k-103", tanggal: "2026-10-03" },
    // General Operational Expenses
    { id: "t4", jenis: "pengeluaran", jumlah: 500000, kategori: "Utilitas: Internet & Wifi", kamarId: null, tanggal: "2026-10-05" },
    { id: "t5", jenis: "pengeluaran", jumlah: 800000, kategori: "Operasional: Kebersihan & Sampah", kamarId: null, tanggal: "2026-10-05" },
    // Unit-specific Maintenance Expenses
    { id: "t6", jenis: "pengeluaran", jumlah: 250000, kategori: "Pemeliharaan: AC & Pendingin", kamarId: "k-101", tanggal: "2026-10-06" },
    { id: "t7", jenis: "pengeluaran", jumlah: 1800000, kategori: "Pemeliharaan: Bangunan & Sipil", kamarId: "k-102", tanggal: "2026-10-10" }, // Heavy repair
    { id: "t8", jenis: "pengeluaran", jumlah: 350000, kategori: "Pemeliharaan: Kelistrikan", kamarId: "k-102", tanggal: "2026-10-12" }, // Another repair
  ];

  const totalIncome = transactions
    .filter((t) => t.jenis === "pemasukan")
    .reduce((sum, t) => sum + t.jumlah, 0);

  const totalExpense = transactions
    .filter((t) => t.jenis === "pengeluaran")
    .reduce((sum, t) => sum + t.jumlah, 0);

  const noi = totalIncome - totalExpense;
  const expenseRatio = Math.round((totalExpense / totalIncome) * 100);

  assert.equal(totalIncome, 10000000);
  assert.equal(totalExpense, 3700000);
  assert.equal(noi, 6300000); // 63% Net Operating Income
  assert.equal(expenseRatio, 37); // 37% expense ratio

  // Room Leak Detection: Group expenses by unit
  const unitExpenseMap = {};
  transactions
    .filter((t) => t.jenis === "pengeluaran" && t.kamarId)
    .forEach((t) => {
      unitExpenseMap[t.kamarId] = (unitExpenseMap[t.kamarId] || 0) + t.jumlah;
    });

  assert.equal(unitExpenseMap["k-101"], 250000);
  assert.equal(unitExpenseMap["k-102"], 2150000);

  // Highest room expense identification
  const highestLeak = Object.entries(unitExpenseMap).sort((a, b) => b[1] - a[1])[0];
  assert.equal(highestLeak[0], "k-102");
  assert.equal(highestLeak[1], 2150000);

  // Warning trigger if single room repair exceeds 50% of monthly rent (Rp 3.500.000)
  const roomRent = 3500000;
  const leakPercentOfRent = Math.round((highestLeak[1] / roomRent) * 100);
  assert.equal(leakPercentOfRent, 61); // 61% of rent spent on repair -> should flag warning
  assert.ok(leakPercentOfRent > 50, "Room k-102 should be flagged for abnormal maintenance cost");
});

test("Maintenance Operations - SLA Engine Calculations", () => {
  function calculateTicketSLA(createdAtStr, prioritas, status, updatedAtStr, nowMs) {
    const limitHours = prioritas === "tinggi" ? 24 : prioritas === "sedang" ? 48 : 120;
    const createdDate = new Date(createdAtStr);
    const deadlineDate = new Date(createdDate.getTime() + limitHours * 3600 * 1000);
    const now = nowMs || Date.now();

    if (status === "selesai") {
      const completedDate = updatedAtStr ? new Date(updatedAtStr) : new Date();
      const diffToDeadline = completedDate.getTime() - deadlineDate.getTime();
      if (diffToDeadline <= 0) {
        return { status: "completed_ontrack", label: "Sesuai SLA", badgeVariant: "emerald" };
      } else {
        const lateHours = Math.ceil(diffToDeadline / (3600 * 1000));
        return { status: "completed_late", label: "Lewat Target", badgeVariant: "slate", lateHours };
      }
    }

    const diffMs = deadlineDate.getTime() - now;
    if (diffMs < 0) {
      const overdueHours = Math.ceil(Math.abs(diffMs) / (3600 * 1000));
      return { status: "breached", label: "SLA Terlewat", badgeVariant: "rose", overdueHours };
    } else if (diffMs < limitHours * 0.25 * 3600 * 1000) {
      const hoursLeft = Math.ceil(diffMs / (3600 * 1000));
      return { status: "warning", label: "Mendekati Tenggat", badgeVariant: "amber", hoursLeft };
    } else {
      const hoursLeft = Math.ceil(diffMs / (3600 * 1000));
      return { status: "ontrack", label: "On-Track", badgeVariant: "emerald", hoursLeft };
    }
  }

  const baseTime = new Date("2026-10-17T10:00:00Z").getTime();

  // 1. High Priority (24h) created 2 hours ago -> On track
  const t1 = calculateTicketSLA(
    "2026-10-17T08:00:00Z",
    "tinggi",
    "menunggu",
    null,
    baseTime
  );
  assert.equal(t1.status, "ontrack");
  assert.equal(t1.hoursLeft, 22);

  // 2. High Priority created 20 hours ago (4 hours remaining of 24h limit, < 25%) -> Warning
  const t2 = calculateTicketSLA(
    "2026-10-16T14:00:00Z",
    "tinggi",
    "diproses",
    null,
    baseTime
  );
  assert.equal(t2.status, "warning");
  assert.equal(t2.hoursLeft, 4);

  // 3. High Priority created 30 hours ago (6 hours overdue) -> Breached
  const t3 = calculateTicketSLA(
    "2026-10-16T04:00:00Z",
    "tinggi",
    "menunggu",
    null,
    baseTime
  );
  assert.equal(t3.status, "breached");
  assert.equal(t3.overdueHours, 6);

  // 4. Completed within SLA
  const t4 = calculateTicketSLA(
    "2026-10-16T08:00:00Z",
    "tinggi",
    "selesai",
    "2026-10-16T18:00:00Z", // completed in 10h
    baseTime
  );
  assert.equal(t4.status, "completed_ontrack");

  // 5. Completed late
  const t5 = calculateTicketSLA(
    "2026-10-15T08:00:00Z",
    "tinggi",
    "selesai",
    "2026-10-17T08:00:00Z", // completed in 48h (>24h limit)
    baseTime
  );
  assert.equal(t5.status, "completed_late");
  assert.equal(t5.lateHours, 24);
});

test("Maintenance Operations - Metadata and Transaction Integration", () => {
  function parseMaintenanceDescription(deskripsi) {
    let str = deskripsi || "";
    let estimatedCost;
    let assignedStaff;
    let reopenReason;

    const estMatch = str.match(/\[Estimasi:\s*Rp\s*([\d.,]+)\]/i);
    if (estMatch) {
      const num = parseInt(estMatch[1].replace(/[.,]/g, ""), 10);
      if (!isNaN(num)) estimatedCost = num;
      str = str.replace(estMatch[0], "").trim();
    }

    const picMatch = str.match(/\[PIC:\s*([^\]]+)\]/i);
    if (picMatch) {
      assignedStaff = picMatch[1].trim();
      str = str.replace(picMatch[0], "").trim();
    }

    const reopenMatch = str.match(/\[Reopen:\s*([^\]]+)\]/i);
    if (reopenMatch) {
      reopenReason = reopenMatch[1].trim();
      str = str.replace(reopenMatch[0], "").trim();
    }

    return {
      estimatedCost,
      assignedStaff,
      reopenReason,
      cleanDescription: str.trim() || "-",
    };
  }

  const raw =
    "[Estimasi: Rp 150.000] [PIC: Budi Santoso] [Reopen: Keran masih menetes (17/10/2026)] Keran wastafel patah saat diputar";
  const parsed = parseMaintenanceDescription(raw);
  assert.equal(parsed.estimatedCost, 150000);
  assert.equal(parsed.assignedStaff, "Budi Santoso");
  assert.equal(parsed.reopenReason, "Keran masih menetes (17/10/2026)");
  assert.equal(parsed.cleanDescription, "Keran wastafel patah saat diputar");
});

test("Vendor Operations - Work History, Expense Attribution & Safe Deletion Invariants", () => {
  const vendor = {
    id: "ven-1",
    name: "CV Tirta Lancar Jaya",
    category: "Plumbing & Pompa",
    phone: "081234567890",
    pemeliharaan: [
      { id: "tik-101", judul: "Pipa Bocor", status: "selesai" },
      { id: "tik-102", judul: "Pompa Mati", status: "selesai" },
      { id: "tik-103", judul: "Keran Patah", status: "diproses" }, // active
    ],
  };

  // 1. Completion Rate Calculation
  const totalTickets = vendor.pemeliharaan.length;
  const completedTickets = vendor.pemeliharaan.filter((t) => t.status === "selesai").length;
  const completionRate = Math.round((completedTickets / totalTickets) * 100);

  assert.equal(totalTickets, 3);
  assert.equal(completedTickets, 2);
  assert.equal(completionRate, 67); // 67% success rate

  // 2. Expense Attribution Mapping
  const cashbookExpenses = [
    {
      id: "tx-1",
      jumlah: 350000,
      keterangan: "[Tiket: #TIK-101] [Vendor: CV Tirta Lancar Jaya] Penggantian pipa PVC",
    },
    {
      id: "tx-2",
      jumlah: 750000,
      keterangan: "[Tiket: #TIK-102] Service dinamo pompa air",
    },
    {
      id: "tx-3",
      jumlah: 200000,
      keterangan: "[Vendor: CV Tirta Lancar Jaya] Pembelian keran cadangan",
    },
    {
      id: "tx-4",
      jumlah: 150000,
      keterangan: "[Vendor: Toko Listrik Terang] Beli saklar", // Different vendor
    },
  ];

  const vendorNameLower = vendor.name.toLowerCase().trim();
  const matchedExpenses = cashbookExpenses.filter((exp) => {
    const ket = exp.keterangan.toLowerCase();
    if (ket.includes(`[vendor: ${vendorNameLower}]`)) return true;
    if (ket.includes(vendorNameLower)) return true;
    return vendor.pemeliharaan.some((t) => ket.includes(t.id));
  });

  assert.equal(matchedExpenses.length, 3); // tx-1, tx-2, tx-3
  const totalPaid = matchedExpenses.reduce((sum, item) => sum + item.jumlah, 0);
  assert.equal(totalPaid, 1300000); // 350k + 750k + 200k = 1.300.000

  // 3. Safe Deletion Invariant
  function validateVendorDeletion(v) {
    const activeTickets = (v.pemeliharaan || []).filter(
      (t) => t.status === "menunggu" || t.status === "diproses"
    );
    if (activeTickets.length > 0) {
      throw new Error(
        `Vendor "${v.name}" cannot be deleted because it has ${activeTickets.length} active unresolved tickets.`
      );
    }
    return true;
  }

  // Deleting vendor with active ticket must throw
  assert.throws(() => validateVendorDeletion(vendor), /active unresolved tickets/);

  // Deleting vendor with only completed tickets must succeed
  const completedVendor = {
    ...vendor,
    pemeliharaan: vendor.pemeliharaan.map((t) => ({ ...t, status: "selesai" })),
  };
  assert.equal(validateVendorDeletion(completedVendor), true);
});

test("Communication Module - Template Rendering, Delivery Statuses & Retry Invariants", () => {
  // 1. Template Rendering Engine
  function renderTemplate(templateContent, variables) {
    let result = templateContent;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      result = result.replace(regex, value);
    }
    return result;
  }

  const rawTemplate =
    "Halo Kak *{{nama_penyewa}}*, tagihan Kamar *{{nomor_kamar}}* sebesar *{{total_tagihan}}* jatuh tempo pada *{{jatuh_tempo}}*.";
  const vars = {
    nama_penyewa: "Ahmad Dahlan",
    nomor_kamar: "102",
    total_tagihan: "Rp 1.500.000",
    jatuh_tempo: "25/10/2026",
  };

  const rendered = renderTemplate(rawTemplate, vars);
  assert.equal(
    rendered,
    "Halo Kak *Ahmad Dahlan*, tagihan Kamar *102* sebesar *Rp 1.500.000* jatuh tempo pada *25/10/2026*."
  );

  // 2. Phone Number Normalization
  function normalizeIndonesianPhone(phone) {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.slice(1);
    } else if (cleaned.startsWith("62")) {
      // already normalized
    } else if (cleaned.startsWith("+62")) {
      cleaned = cleaned.slice(1);
    } else if (cleaned.length >= 9) {
      cleaned = "62" + cleaned;
    }
    return cleaned;
  }

  assert.equal(normalizeIndonesianPhone("0812-3456-7890"), "6281234567890");
  assert.equal(normalizeIndonesianPhone("+62 812 3456 7890"), "6281234567890");
  assert.equal(normalizeIndonesianPhone("6281234567890"), "6281234567890");

  // 3. Delivery Status & Retry Eligibility
  const logs = [
    { id: "c1", recipientPhone: "62811", status: "delivered", sentAt: "2026-10-15T10:00:00Z" },
    { id: "c2", recipientPhone: "62812", status: "sent", sentAt: "2026-10-16T11:00:00Z" },
    { id: "c3", recipientPhone: "62813", status: "failed", sentAt: "2026-10-17T09:00:00Z" },
    { id: "c4", recipientPhone: "62814", status: "pending", sentAt: "2026-10-17T12:00:00Z" },
  ];

  const failedLogs = logs.filter((l) => l.status === "failed");
  assert.equal(failedLogs.length, 1);
  assert.equal(failedLogs[0].id, "c3");

  // Retry action test
  function retryMessage(log) {
    if (log.status !== "failed" && log.status !== "pending") {
      throw new Error("Only failed or pending messages can be retried");
    }
    return {
      ...log,
      status: "sent",
      retriedAt: new Date().toISOString(),
    };
  }

  const retried = retryMessage(failedLogs[0]);
  assert.equal(retried.status, "sent");
  assert.ok(retried.retriedAt);

  // Attempting to retry delivered message must throw
  assert.throws(() => retryMessage(logs[0]), /Only failed or pending/);

  // 4. Tenant Timeline Grouping
  const tenantLogs = [
    { tenantId: "t-1", message: "Reminder H-5", sentAt: "2026-10-01" },
    { tenantId: "t-2", message: "Reminder H-5", sentAt: "2026-10-01" },
    { tenantId: "t-1", message: "Kwitansi Pelunasan", sentAt: "2026-10-05" },
  ];

  const t1Timeline = tenantLogs.filter((l) => l.tenantId === "t-1");
  assert.equal(t1Timeline.length, 2);
  assert.equal(t1Timeline[0].message, "Reminder H-5");
  assert.equal(t1Timeline[1].message, "Kwitansi Pelunasan");
});

test("Tenant Portal - Kwitansi Generation, Maintenance Lifecycle & Lease Invariants", () => {
  // 1. Digital Kwitansi Generation & Settlement Invariant
  function generateDigitalKwitansi(invoice, tenant, room) {
    if (invoice.balanceDue > 0) {
      throw new Error("Kwitansi resmi hanya dapat diterbitkan untuk invoice yang telah lunas (balanceDue = 0)");
    }
    return {
      nomorKwitansi: `KWT/${invoice.invoiceNumber}`,
      penyewaNama: tenant.nama,
      kamarNomor: room.nomor,
      totalTerbayar: invoice.total,
      stempel: "LUNAS / VERIFIED",
      tanggalTerbit: new Date().toISOString(),
    };
  }

  const paidInvoice = {
    id: "inv-paid-1",
    invoiceNumber: "INV-2026-10-A01",
    total: 1800000,
    balanceDue: 0,
    status: "paid",
  };

  const unpaidInvoice = {
    id: "inv-unpaid-2",
    invoiceNumber: "INV-2026-10-A02",
    total: 1800000,
    balanceDue: 500000,
    status: "partial",
  };

  const kwt = generateDigitalKwitansi(paidInvoice, { nama: "Andi Pratama" }, { nomor: "A01" });
  assert.equal(kwt.nomorKwitansi, "KWT/INV-2026-10-A01");
  assert.equal(kwt.totalTerbayar, 1800000);
  assert.equal(kwt.stempel, "LUNAS / VERIFIED");

  // Attempting to generate official kwitansi for unpaid invoice must throw
  assert.throws(
    () => generateDigitalKwitansi(unpaidInvoice, { nama: "Andi Pratama" }, { nomor: "A02" }),
    /balanceDue = 0/
  );

  // 2. Maintenance Status Lifecycle Progression
  function transitionMaintenanceStatus(currentStatus, nextStatus) {
    const validTransitions = {
      menunggu: ["diproses", "selesai"],
      diproses: ["selesai", "menunggu"],
      selesai: ["menunggu"], // Reopen
    };

    if (!validTransitions[currentStatus]?.includes(nextStatus)) {
      throw new Error(`Invalid maintenance transition from ${currentStatus} to ${nextStatus}`);
    }
    return nextStatus;
  }

  assert.equal(transitionMaintenanceStatus("menunggu", "diproses"), "diproses");
  assert.equal(transitionMaintenanceStatus("diproses", "selesai"), "selesai");
  assert.equal(transitionMaintenanceStatus("selesai", "menunggu"), "menunggu");
  assert.throws(() => transitionMaintenanceStatus("menunggu", "invalid_status"), /Invalid maintenance transition/);

  // 3. Lease Agreement Invariants
  function validateLeaseAgreement(lease) {
    const start = new Date(lease.startDate).getTime();
    const end = new Date(lease.endDate).getTime();
    if (start >= end) {
      throw new Error("Tanggal mulai sewa harus lebih awal daripada tanggal akhir sewa");
    }
    if (lease.rentAmount <= 0) {
      throw new Error("Tarif sewa harus lebih dari 0");
    }
    if (lease.depositAmount < 0) {
      throw new Error("Deposit jaminan tidak boleh bernilai negatif");
    }
    if (lease.billingDay < 1 || lease.billingDay > 31) {
      throw new Error("Hari penagihan harus antara tanggal 1 - 31");
    }
    return true;
  }

  const validLease = {
    startDate: "2026-01-01T00:00:00Z",
    endDate: "2026-12-31T00:00:00Z",
    rentAmount: 1800000,
    depositAmount: 500000,
    billingDay: 5,
  };
  assert.ok(validateLeaseAgreement(validLease));

  assert.throws(
    () => validateLeaseAgreement({ ...validLease, endDate: "2025-12-31T00:00:00Z" }),
    /lebih awal daripada/
  );
  assert.throws(
    () => validateLeaseAgreement({ ...validLease, billingDay: 35 }),
    /antara tanggal 1 - 31/
  );
});

test("Superadmin Platform Console - Tiering, MRR, Feature Limits & Safe Support Invariants", () => {
  // 1. Subscription Tier & MRR Invariants
  function determinePlanTier(unitCount) {
    if (unitCount > 50) return { plan: "Business", price: 699000, limitUnits: 200, limitProperties: 999 };
    if (unitCount > 10) return { plan: "Pro", price: 299000, limitUnits: 50, limitProperties: 5 };
    return { plan: "Starter", price: 99000, limitUnits: 10, limitProperties: 1 };
  }

  assert.equal(determinePlanTier(5).plan, "Starter");
  assert.equal(determinePlanTier(10).plan, "Starter");
  assert.equal(determinePlanTier(11).plan, "Pro");
  assert.equal(determinePlanTier(50).plan, "Pro");
  assert.equal(determinePlanTier(51).plan, "Business");

  const orgs = [
    { id: "o1", units: 8, status: "active" },      // Starter: 99.000
    { id: "o2", units: 25, status: "active" },     // Pro: 299.000
    { id: "o3", units: 60, status: "active" },     // Business: 699.000
    { id: "o4", units: 15, status: "trial" },      // Trial: does not contribute to paid MRR
    { id: "o5", units: 30, status: "past_due" },   // Past due: does not contribute to collected MRR
  ];

  function calculateActiveMRR(orgList) {
    return orgList
      .filter((o) => o.status === "active")
      .reduce((sum, o) => sum + determinePlanTier(o.units).price, 0);
  }

  const mrr = calculateActiveMRR(orgs);
  assert.equal(mrr, 99000 + 299000 + 699000); // 1.097.000

  // 2. Feature Limit Over-Quota Validation
  function checkQuotaStatus(org) {
    const tier = determinePlanTier(org.units);
    const isExceeded = org.units > tier.limitUnits;
    return {
      tier: tier.plan,
      limitUnits: tier.limitUnits,
      isExceeded,
      pctUsed: Math.round((org.units / tier.limitUnits) * 100),
    };
  }

  const normalOrg = checkQuotaStatus({ units: 8 });
  assert.equal(normalOrg.isExceeded, false);
  assert.equal(normalOrg.pctUsed, 80);

  // 3. Safe Support Mode Invariant
  function generateSupportAccessAudit(adminUser, targetOrg) {
    if (adminUser.role !== "super-admin") {
      throw new Error("Unauthorized: Only super-admin may initiate technical support access");
    }
    return {
      action: "superadmin.support_mode_access",
      entityType: "organization",
      entityId: targetOrg.id,
      actorUserId: adminUser.id,
      mode: "read_only_support",
      timestamp: new Date().toISOString(),
    };
  }

  const admin = { id: "sa-1", role: "super-admin" };
  const owner = { id: "ow-1", role: "owner" };
  const targetOrg = { id: "org-kos-1", name: "Kost Berkah" };

  const auditEntry = generateSupportAccessAudit(admin, targetOrg);
  assert.equal(auditEntry.action, "superadmin.support_mode_access");
  assert.equal(auditEntry.mode, "read_only_support");

  // Attempting support mode as owner must throw
  assert.throws(() => generateSupportAccessAudit(owner, targetOrg), /Unauthorized/);
});

test("Team & Permission UX - RBAC Invariants, Lockout Protection & Restricted Features", () => {
  // 1. RBAC Evaluation Matrix
  const ROLE_PERMISSIONS = {
    owner: ["*"],
    admin: ["property.*", "unit.*", "tenant.*", "lease.*", "invoice.*", "payment.*", "maintenance.*", "vendor.*", "team.invite"],
    manager: ["property.view", "property.update", "unit.*", "tenant.*", "lease.*", "invoice.view", "invoice.create", "payment.view", "maintenance.*"],
    finance: ["property.view", "unit.view", "tenant.view", "lease.view", "invoice.*", "payment.*", "expense.*"],
    staff: ["property.view", "unit.view", "tenant.view", "lease.view", "maintenance.*"],
    viewer: ["property.view", "unit.view", "tenant.view"],
  };

  function checkPermission(role, permission) {
    const allowed = ROLE_PERMISSIONS[role] || [];
    if (allowed.includes("*")) return true;
    if (allowed.includes(permission)) return true;
    // Wildcard prefix matching
    const [domain] = permission.split(".");
    if (allowed.includes(`${domain}.*`)) return true;
    return false;
  }

  // Owner has full access
  assert.equal(checkPermission("owner", "invoice.delete"), true);
  assert.equal(checkPermission("owner", "team.manage"), true);

  // Admin has management capabilities
  assert.equal(checkPermission("admin", "team.invite"), true);
  assert.equal(checkPermission("admin", "property.create"), true);

  // Manager can view payment and create invoice, but cannot delete invoice or invite team
  assert.equal(checkPermission("manager", "invoice.create"), true);
  assert.equal(checkPermission("manager", "payment.view"), true);
  assert.equal(checkPermission("manager", "team.invite"), false);

  // Finance can manage expenses and payments, but cannot manage maintenance or team
  assert.equal(checkPermission("finance", "expense.create"), true);
  assert.equal(checkPermission("finance", "payment.refund"), true);
  assert.equal(checkPermission("finance", "maintenance.create"), false);
  assert.equal(checkPermission("finance", "team.invite"), false);

  // Staff can only manage maintenance, all financial and team modules restricted
  assert.equal(checkPermission("staff", "maintenance.create"), true);
  assert.equal(checkPermission("staff", "maintenance.update"), true);
  assert.equal(checkPermission("staff", "invoice.create"), false);
  assert.equal(checkPermission("staff", "payment.refund"), false);
  assert.equal(checkPermission("staff", "team.invite"), false);

  // 2. Sole Owner Lockout Protection Invariant
  function validateOwnerDemotion(orgMembers, targetMemberId, newRole) {
    const target = orgMembers.find((m) => m.id === targetMemberId);
    if (!target) throw new Error("Anggota tidak ditemukan");

    if (target.role === "owner" && newRole !== "owner") {
      const ownerCount = orgMembers.filter((m) => m.role === "owner").length;
      if (ownerCount <= 1) {
        throw new Error("Organisasi harus memiliki setidaknya satu Pemilik (Owner). Anda tidak dapat mengubah peran Owner terakhir.");
      }
    }
    return true;
  }

  const singleOwnerOrg = [
    { id: "m1", name: "Budi", role: "owner" },
    { id: "m2", name: "Siti", role: "staff" },
  ];

  // Attempting to demote sole owner must throw
  assert.throws(
    () => validateOwnerDemotion(singleOwnerOrg, "m1", "manager"),
    /Owner terakhir/
  );

  const multiOwnerOrg = [
    { id: "m1", name: "Budi", role: "owner" },
    { id: "m2", name: "Agus", role: "owner" },
    { id: "m3", name: "Siti", role: "staff" },
  ];

  // Demoting when multiple owners exist is allowed
  assert.ok(validateOwnerDemotion(multiOwnerOrg, "m1", "admin"));

  // 3. Prevent Self Removal Invariant
  function validateMemberRemoval(callerId, targetMember) {
    if (targetMember.role === "owner" && targetMember.userId === callerId) {
      throw new Error("Anda tidak dapat menghapus akun Anda sendiri sebagai Owner utama demi keamanan akun");
    }
    return true;
  }

  assert.throws(
    () => validateMemberRemoval("user-1", { userId: "user-1", role: "owner" }),
    /menghapus akun Anda sendiri/
  );
  assert.ok(validateMemberRemoval("user-1", { userId: "user-2", role: "staff" }));
});

test("Onboarding & First-Run Experience - Workflow Steps, Progress & Empty State Invariants", () => {
  // 1. Five-step onboarding calculation function mirroring OnboardingWizard
  function computeOnboardingProgress({ propertiCount, totalKamar, penghuniCount, activeLeaseCount, totalInvoicesCount }) {
    const steps = [
      { id: "step-property", stepNumber: 1, done: propertiCount > 0 },
      { id: "step-rooms", stepNumber: 2, done: totalKamar > 0 },
      { id: "step-tenants", stepNumber: 3, done: penghuniCount > 0 },
      { id: "step-lease", stepNumber: 4, done: activeLeaseCount > 0 },
      { id: "step-invoice", stepNumber: 5, done: totalInvoicesCount > 0 },
    ];

    const completedCount = steps.filter((s) => s.done).length;
    const totalCount = steps.length;
    const progressPct = Math.round((completedCount / totalCount) * 100);
    const isIncomplete = completedCount < totalCount;

    return { steps, completedCount, totalCount, progressPct, isIncomplete };
  }

  // A. Brand new user: 0 resources
  const state0 = computeOnboardingProgress({
    propertiCount: 0,
    totalKamar: 0,
    penghuniCount: 0,
    activeLeaseCount: 0,
    totalInvoicesCount: 0,
  });
  assert.equal(state0.completedCount, 0);
  assert.equal(state0.totalCount, 5);
  assert.equal(state0.progressPct, 0);
  assert.equal(state0.isIncomplete, true);

  // B. Partial progress: Property & Rooms created
  const state2 = computeOnboardingProgress({
    propertiCount: 1,
    totalKamar: 4,
    penghuniCount: 0,
    activeLeaseCount: 0,
    totalInvoicesCount: 0,
  });
  assert.equal(state2.completedCount, 2);
  assert.equal(state2.progressPct, 40);
  assert.equal(state2.isIncomplete, true);
  assert.equal(state2.steps[0].done, true);
  assert.equal(state2.steps[1].done, true);
  assert.equal(state2.steps[2].done, false);

  // C. Full end-to-end workflow completed
  const stateFull = computeOnboardingProgress({
    propertiCount: 2,
    totalKamar: 12,
    penghuniCount: 8,
    activeLeaseCount: 8,
    totalInvoicesCount: 16,
  });
  assert.equal(stateFull.completedCount, 5);
  assert.equal(stateFull.progressPct, 100);
  assert.equal(stateFull.isIncomplete, false);
  assert.ok(stateFull.steps.every((s) => s.done === true));
});

test("Import / Migration Engine - Multi-format CSV Parsing, Column Mapping, Validation, Duplicate Protection & Audit Invariants", () => {
  // 1. RFC-4180 CSV Parser test with quotes, escaped commas, and semicolons
  const parseCSV = (text) => {
    const lines = [];
    const rawLines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    for (const rawLine of rawLines) {
      const row = [];
      let insideQuote = false;
      let currentCell = "";
      for (let i = 0; i < rawLine.length; i++) {
        const char = rawLine[i];
        if (char === '"' || char === "'") {
          insideQuote = !insideQuote;
        } else if ((char === "," || char === "\t" || char === ";") && !insideQuote) {
          row.push(currentCell.trim().replace(/^["']|["']$/g, ""));
          currentCell = "";
        } else {
          currentCell += char;
        }
      }
      row.push(currentCell.trim().replace(/^["']|["']$/g, ""));
      if (row.some((cell) => cell.length > 0)) {
        lines.push(row);
      }
    }
    return lines;
  };

  const sampleCSV = `
Nama,No WhatsApp,Email,Catatan
"Santoso, Budi",081234567890,budi@mail.com,"Penyewa Paviliun A, Lantai 1"
Siti Aminah,085712345678,siti@mail.com,Mahasiswi
Rian Hidayat,082198765432,,
`;

  const parsed = parseCSV(sampleCSV);
  assert.equal(parsed.length, 4); // 1 header + 3 rows
  assert.deepEqual(parsed[0], ["Nama", "No WhatsApp", "Email", "Catatan"]);
  assert.equal(parsed[1][0], "Santoso, Budi"); // Escaped comma preserved inside quotes
  assert.equal(parsed[1][1], "081234567890");
  assert.equal(parsed[1][3], "Penyewa Paviliun A, Lantai 1");

  // 2. Column Mapping heuristic resolver test
  const resolveColumnMapping = (detectedHeaders) => {
    const autoMap = { nama: "", noHp: "", email: "", noKtp: "", tanggalMasuk: "", catatan: "" };
    detectedHeaders.forEach((h) => {
      const lower = h.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!autoMap.nama && (lower.includes("nama") || lower.includes("name") || lower.includes("penyewa") || lower.includes("tenant"))) {
        autoMap.nama = h;
      } else if (!autoMap.noHp && (lower.includes("hp") || lower.includes("wa") || lower.includes("whatsapp") || lower.includes("telepon") || lower.includes("phone") || lower.includes("kontak"))) {
        autoMap.noHp = h;
      } else if (!autoMap.email && (lower.includes("email") || lower.includes("mail") || lower.includes("surel"))) {
        autoMap.email = h;
      } else if (!autoMap.noKtp && (lower.includes("ktp") || lower.includes("nik") || lower.includes("identitas") || lower.includes("noktp"))) {
        autoMap.noKtp = h;
      } else if (!autoMap.tanggalMasuk && (lower.includes("tanggal") || lower.includes("tgl") || lower.includes("masuk") || lower.includes("mulai") || lower.includes("start"))) {
        autoMap.tanggalMasuk = h;
      } else if (!autoMap.catatan && (lower.includes("catatan") || lower.includes("note") || lower.includes("keterangan") || lower.includes("deskripsi"))) {
        autoMap.catatan = h;
      }
    });
    return autoMap;
  };

  const detectedHeaders = ["Client Name", "Kontak WA", "Surel Pribadi", "NIK KTP", "Tgl Masuk", "Keterangan Tambahan"];
  const mapping = resolveColumnMapping(detectedHeaders);
  assert.equal(mapping.nama, "Client Name");
  assert.equal(mapping.noHp, "Kontak WA");
  assert.equal(mapping.email, "Surel Pribadi");
  assert.equal(mapping.noKtp, "NIK KTP");
  assert.equal(mapping.tanggalMasuk, "Tgl Masuk");
  assert.equal(mapping.catatan, "Keterangan Tambahan");

  // 3. Batch Validation & Duplicate Collision Detection Logic
  const normalizeIndonesianPhone = (phone) => {
    let clean = phone.replace(/\D/g, "");
    if (clean.startsWith("62")) clean = "0" + clean.slice(2);
    else if (!clean.startsWith("0")) clean = "0" + clean;
    return clean;
  };

  const validateAndFilterBatch = ({ rows, existingDbPhones }) => {
    const seenPhones = new Set();
    const validCandidates = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNumber = r.rowNumber ?? (i + 1);
      const cleanNama = r.nama?.trim() || "";
      const cleanNoHp = r.noHp?.trim() || "";

      if (!cleanNama) {
        errors.push({ rowNumber, nama: cleanNama, noHp: cleanNoHp, reason: "Nama penyewa wajib diisi" });
        continue;
      }

      if (!cleanNoHp) {
        errors.push({ rowNumber, nama: cleanNama, noHp: cleanNoHp, reason: "Nomor WhatsApp/HP wajib diisi" });
        continue;
      }

      const digits = cleanNoHp.replace(/\D/g, "");
      if (digits.length < 9 || digits.length > 15) {
        errors.push({ rowNumber, nama: cleanNama, noHp: cleanNoHp, reason: "Format nomor HP tidak valid (harus 9-15 digit)" });
        continue;
      }

      const normalizedPhone = normalizeIndonesianPhone(cleanNoHp);
      if (seenPhones.has(normalizedPhone)) {
        errors.push({ rowNumber, nama: cleanNama, noHp: cleanNoHp, reason: "Nomor HP duplikat dalam file impor ini" });
        continue;
      }

      seenPhones.add(normalizedPhone);
      validCandidates.push({ rowNumber, row: r, normalizedPhone });
    }

    const rowsToInsert = [];
    for (const cand of validCandidates) {
      if (existingDbPhones.has(cand.normalizedPhone)) {
        errors.push({
          rowNumber: cand.rowNumber,
          nama: cand.row.nama,
          noHp: cand.row.noHp,
          reason: `Nomor HP sudah terdaftar untuk penyewa '${existingDbPhones.get(cand.normalizedPhone)}'`,
        });
      } else {
        rowsToInsert.push(cand);
      }
    }

    return { rowsToInsert, errors };
  };

  const mockDbExisting = new Map([
    ["081111111111", "Joko Susilo (Penyewa Lama)"],
  ]);

  const rawBatch = [
    { rowNumber: 2, nama: "Budi Santoso", noHp: "081234567890" }, // VALID
    { rowNumber: 3, nama: "", noHp: "081299998888" },             // ERROR: Missing name
    { rowNumber: 4, nama: "Andi", noHp: "" },                     // ERROR: Missing phone
    { rowNumber: 5, nama: "Candra", noHp: "123" },                // ERROR: Invalid length
    { rowNumber: 6, nama: "Budi Duplikat", noHp: "081234567890" },// ERROR: Duplicate in file
    { rowNumber: 7, nama: "Joko Baru", noHp: "081111111111" },    // ERROR: Duplicate in DB
    { rowNumber: 8, nama: "Maya Indah", noHp: "+62 878-1234-5678" }, // VALID with formatting
  ];

  const result = validateAndFilterBatch({ rows: rawBatch, existingDbPhones: mockDbExisting });

  // Invariants
  assert.equal(result.rowsToInsert.length, 2);
  assert.equal(result.rowsToInsert[0].row.nama, "Budi Santoso");
  assert.equal(result.rowsToInsert[1].row.nama, "Maya Indah");
  assert.equal(result.rowsToInsert[1].normalizedPhone, "087812345678");

  assert.equal(result.errors.length, 5);
  assert.equal(result.errors[0].reason, "Nama penyewa wajib diisi");
  assert.equal(result.errors[1].reason, "Nomor WhatsApp/HP wajib diisi");
  assert.equal(result.errors[2].reason, "Format nomor HP tidak valid (harus 9-15 digit)");
  assert.equal(result.errors[3].reason, "Nomor HP duplikat dalam file impor ini");
  assert.ok(result.errors[4].reason.includes("Nomor HP sudah terdaftar"));

  // 4. Failed Rows CSV Structure Generation
  const failedExportHeaders = ["Baris", "Nama Lengkap", "No WhatsApp", "Alasan Gagal"];
  const failedExportRows = result.errors.map((e) => [e.rowNumber, e.nama, e.noHp, e.reason]);
  assert.equal(failedExportRows.length, 5);
  assert.equal(failedExportRows[0][3], "Nama penyewa wajib diisi");
  assert.equal(failedExportRows[4][1], "Joko Baru");
});

test("Table Usability Engine - Pagination Slicing, Column Visibility Filters & Bulk Selection Invariants", () => {
  // 1. Pagination Math & Boundary Clamping
  function calculatePagination(totalItems, currentPage, pageSize) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    return {
      totalPages,
      safePage,
      startIndex,
      endIndex,
      displayFrom: totalItems === 0 ? 0 : startIndex + 1,
      displayTo: endIndex,
    };
  }

  // Case A: 45 items, page 1 of 10
  const p1 = calculatePagination(45, 1, 10);
  assert.equal(p1.totalPages, 5);
  assert.equal(p1.safePage, 1);
  assert.equal(p1.displayFrom, 1);
  assert.equal(p1.displayTo, 10);

  // Case B: 45 items, last page (page 5)
  const p5 = calculatePagination(45, 5, 10);
  assert.equal(p5.safePage, 5);
  assert.equal(p5.displayFrom, 41);
  assert.equal(p5.displayTo, 45);

  // Case C: Page out of bounds (e.g. user was on page 5, but filter reduced items to 12)
  const pClamped = calculatePagination(12, 5, 10);
  assert.equal(pClamped.totalPages, 2);
  assert.equal(pClamped.safePage, 2); // clamped to max page 2
  assert.equal(pClamped.displayFrom, 11);
  assert.equal(pClamped.displayTo, 12);

  // Case D: Empty results
  const pEmpty = calculatePagination(0, 1, 10);
  assert.equal(pEmpty.totalPages, 1);
  assert.equal(pEmpty.displayFrom, 0);
  assert.equal(pEmpty.displayTo, 0);

  // 2. Column Visibility Toggle Invariants
  const columnDefs = [
    { id: "nomor", label: "Nomor", alwaysVisible: true },
    { id: "penyewa", label: "Penyewa", alwaysVisible: false },
    { id: "jaminan", label: "Jaminan", alwaysVisible: false },
  ];

  let visibleCols = { nomor: true, penyewa: true, jaminan: true };

  function toggleColumn(colId) {
    const def = columnDefs.find((c) => c.id === colId);
    if (!def || def.alwaysVisible) return visibleCols; // Protection: never hide mandatory identifier
    return { ...visibleCols, [colId]: !visibleCols[colId] };
  }

  // Hide jaminan
  visibleCols = toggleColumn("jaminan");
  assert.equal(visibleCols.jaminan, false);
  assert.equal(visibleCols.penyewa, true);

  // Attempt to hide protected column (nomor) - must remain true
  visibleCols = toggleColumn("nomor");
  assert.equal(visibleCols.nomor, true);

  // 3. Bulk Selection Invariants
  const mockDataset = Array.from({ length: 25 }, (_, i) => ({
    id: `item-${i + 1}`,
    name: `Data ${i + 1}`,
  }));

  const selectedSet = new Set();

  // Toggle single item
  selectedSet.add("item-1");
  assert.equal(selectedSet.size, 1);
  assert.ok(selectedSet.has("item-1"));

  // Toggle page items (page 1: 10 items)
  const page1Items = mockDataset.slice(0, 10);
  page1Items.forEach((item) => selectedSet.add(item.id));
  assert.equal(selectedSet.size, 10);

  // Select all 25 items across all pages
  mockDataset.forEach((item) => selectedSet.add(item.id));
  assert.equal(selectedSet.size, 25);

  // Export selection verification
  const exportedRows = mockDataset.filter((item) => selectedSet.has(item.id));
  assert.equal(exportedRows.length, 25);

  // Deselect / Clear all
  selectedSet.clear();
  assert.equal(selectedSet.size, 0);
});

test("Form UX Engine - Validation, Dirty State Detection, Duplicate Submit Prevention & Currency/Phone Parsing Invariants", () => {
  // 1. Currency Parsing & Formatting (Zero Float, pure integer rupiah)
  function parseCurrencyInput(rawInput) {
    if (typeof rawInput === "number") return Math.max(0, Math.floor(rawInput));
    const cleanDigits = String(rawInput).replace(/\D/g, "");
    return cleanDigits ? parseInt(cleanDigits, 10) : 0;
  }

  assert.equal(parseCurrencyInput("Rp 1.500.000"), 1500000);
  assert.equal(parseCurrencyInput("850.000"), 850000);
  assert.equal(parseCurrencyInput("Rp 0"), 0);
  assert.equal(parseCurrencyInput(""), 0);
  assert.equal(parseCurrencyInput("abc"), 0);

  // 2. Indonesian Phone Number Normalization
  function normalizeIndoPhone(input) {
    let digits = String(input).replace(/\D/g, "");
    if (digits.startsWith("62")) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = digits.slice(1);
    return digits ? `62${digits}` : "";
  }

  assert.equal(normalizeIndoPhone("081234567890"), "6281234567890");
  assert.equal(normalizeIndoPhone("+62 812-3456-7890"), "6281234567890");
  assert.equal(normalizeIndoPhone("81234567890"), "6281234567890");
  assert.equal(normalizeIndoPhone("6281234567890"), "6281234567890");

  // 3. Dirty Form State & Baseline Snapshot Invariants
  const baselineForm = {
    nomor: "A-01",
    lantai: "1",
    tipe: "Standard",
    hargaBulanan: "850000",
    status: "kosong",
  };
  const baselineSnapshot = JSON.stringify(baselineForm);

  // Unmodified form -> not dirty
  const currentFormUnchanged = { ...baselineForm };
  assert.equal(JSON.stringify(currentFormUnchanged) === baselineSnapshot, true);

  // Modified field -> dirty
  const currentFormModified = { ...baselineForm, hargaBulanan: "900000" };
  assert.equal(JSON.stringify(currentFormModified) !== baselineSnapshot, true);

  // Restored field -> reverts back to clean
  const currentFormRestored = { ...currentFormModified, hargaBulanan: "850000" };
  assert.equal(JSON.stringify(currentFormRestored) === baselineSnapshot, true);

  // 4. Duplicate Submit Prevention Invariant
  let isPending = false;
  let submitCount = 0;

  function handleSubmit(actionFn) {
    if (isPending) return false; // Guard: reject double-click
    isPending = true;
    try {
      actionFn();
      return true;
    } finally {
      isPending = false;
    }
  }

  // First submit succeeds
  const res1 = handleSubmit(() => {
    submitCount++;
  });
  assert.equal(res1, true);
  assert.equal(submitCount, 1);

  // Re-submission while already pending is safely rejected
  isPending = true;
  const resBlocked = handleSubmit(() => {
    submitCount++;
  });
  assert.equal(resBlocked, false);
  assert.equal(submitCount, 1); // Not incremented
});

test("Modal, Drawer & Detail Interaction Rules - Contextual Drawer Sizing, Destructive Confirmation & Close Invariants", () => {
  // 1. Surface Classification Invariant: Modal vs Drawer vs Page
  const UI_SURFACE_RULES = {
    CONFIRMATION: "modal",
    SMALL_ACTION: "modal",
    CONTEXTUAL_INSPECTION_360: "drawer",
    QUICK_EDIT: "drawer",
    COMPLEX_WORKFLOW: "page",
  };

  function resolveSurface(actionType) {
    const surface = UI_SURFACE_RULES[actionType];
    if (!surface) throw new Error(`Unknown action type: ${actionType}`);
    return surface;
  }

  assert.equal(resolveSurface("CONFIRMATION"), "modal");
  assert.equal(resolveSurface("CONTEXTUAL_INSPECTION_360"), "drawer");
  assert.equal(resolveSurface("COMPLEX_WORKFLOW"), "page");

  // 2. Destructive Dialog Safety Invariants
  function createDestructivePrompt({ title, entityName, onConfirm }) {
    if (!title || typeof title !== "string") {
      throw new Error("Destructive dialog must have an explicit descriptive title");
    }
    if (!entityName) {
      throw new Error("Destructive dialog must specify the target entity to avoid accidental deletion");
    }
    let pending = false;
    let executionCount = 0;

    return {
      title,
      entityName,
      warningText: "Tindakan ini bersifat permanen dan tidak dapat dibatalkan.",
      async confirm() {
        if (pending) return false;
        pending = true;
        try {
          executionCount++;
          await onConfirm();
          return true;
        } finally {
          pending = false;
        }
      },
      isPending: () => pending,
      getExecutionCount: () => executionCount,
    };
  }

  // Missing entity throws error
  assert.throws(() => createDestructivePrompt({ title: "Hapus", entityName: "" }), /specify the target entity/);

  let deleted = false;
  const prompt = createDestructivePrompt({
    title: "Hapus Penyewa Secara Permanen?",
    entityName: "Budi Santoso (Kamar 101)",
    onConfirm: async () => {
      deleted = true;
    },
  });

  assert.ok(prompt.warningText.includes("permanen"));
  assert.equal(prompt.isPending(), false);

  prompt.confirm();
  assert.equal(deleted, true);
  assert.equal(prompt.getExecutionCount(), 1);

  // 3. Responsive Contextual Drawer Layout Rules
  function getDrawerLayoutConfig({ viewportWidth }) {
    const isMobile = viewportWidth < 640;
    return {
      side: "right",
      widthClass: isMobile ? "w-full" : "sm:max-w-xl",
      scrollBehavior: "overflow-y-auto",
      hasBackdrop: true,
      hasExplicitCloseButton: true,
      trapFocus: true,
    };
  }

  const mobileDrawer = getDrawerLayoutConfig({ viewportWidth: 375 });
  assert.equal(mobileDrawer.widthClass, "w-full");
  assert.equal(mobileDrawer.scrollBehavior, "overflow-y-auto");
  assert.equal(mobileDrawer.hasExplicitCloseButton, true);

  const desktopDrawer = getDrawerLayoutConfig({ viewportWidth: 1280 });
  assert.equal(desktopDrawer.widthClass, "sm:max-w-xl");
  assert.equal(desktopDrawer.scrollBehavior, "overflow-y-auto");
});

test("Empty, Loading, Error & Success States - Skeleton Layout, Non-Generic Errors, Retry Engine & Notification Invariants", () => {
  // 1. Non-Generic Error Message Sanitizer Invariant
  function sanitizeErrorMessage(context, error, fallback = "Terjadi kegagalan validasi atau server tidak merespon.") {
    let detailMessage = fallback;
    if (error instanceof Error && error.message) {
      detailMessage = error.message;
    } else if (typeof error === "string" && error.length > 0) {
      detailMessage = error;
    }

    if (
      detailMessage.toLowerCase().includes("something went wrong") ||
      detailMessage.toLowerCase().includes("an error occurred")
    ) {
      detailMessage = `${context}: Silakan periksa kembali kelengkapan formulir atau koneksi server.`;
    }

    return {
      title: `Gagal ${context}`,
      description: detailMessage,
    };
  }

  // Generic message is blocked and replaced with specific operational instruction
  const blocked1 = sanitizeErrorMessage("Menyimpan Kamar", new Error("Something went wrong"));
  assert.ok(!blocked1.description.includes("Something went wrong"));
  assert.ok(blocked1.description.includes("Menyimpan Kamar: Silakan periksa kembali"));

  const blocked2 = sanitizeErrorMessage("Memproses Pembayaran", "An error occurred on the server");
  assert.ok(!blocked2.description.includes("An error occurred"));
  assert.ok(blocked2.description.includes("Memproses Pembayaran: Silakan periksa kembali"));

  // Specific domain errors are preserved verbatim
  const preserved = sanitizeErrorMessage("Menyimpan Kontrak", new Error("Unit kamar 102 sudah terisi oleh penyewa aktif"));
  assert.equal(preserved.description, "Unit kamar 102 sudah terisi oleh penyewa aktif");

  // 2. Retry Engine State Transition Invariant
  function createRetryController(asyncOperation) {
    let retrying = false;
    let attempts = 0;

    return {
      async triggerRetry() {
        if (retrying) return false;
        retrying = true;
        try {
          attempts++;
          await asyncOperation();
          return true;
        } finally {
          retrying = false;
        }
      },
      isRetrying: () => retrying,
      getAttempts: () => attempts,
    };
  }

  let opCount = 0;
  const retryController = createRetryController(async () => {
    opCount++;
  });

  assert.equal(retryController.isRetrying(), false);
  retryController.triggerRetry();
  assert.equal(opCount, 1);
  assert.equal(retryController.getAttempts(), 1);

  // 3. Success Toast Subject + Verb + Outcome Convention
  function formatSuccessNotification(entity, action, details) {
    return {
      message: `${entity} berhasil ${action}.`,
      description: details,
    };
  }

  const toast1 = formatSuccessNotification("Kamar 105", "diperbarui", "Tarif Rp 1.500.000/bln");
  assert.equal(toast1.message, "Kamar 105 berhasil diperbarui.");
  assert.equal(toast1.description, "Tarif Rp 1.500.000/bln");

  const toast2 = formatSuccessNotification("Kontrak sewa", "diperpanjang", "Hingga 31 Des 2027");
  assert.equal(toast2.message, "Kontrak sewa berhasil diperpanjang.");

  // 4. Skeleton Dimensions & Grid Invariants
  function calculateSkeletonGrid(count, columns) {
    if (count <= 0) throw new Error("Skeleton count must be positive");
    return {
      cardCount: count,
      columnsClass: columns || "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    };
  }

  const grid = calculateSkeletonGrid(6);
  assert.equal(grid.cardCount, 6);
  assert.ok(grid.columnsClass.includes("lg:grid-cols-4"));
});















