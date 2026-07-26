"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { gabungDenganKode, type GabungInput } from "./action";

type StatusGabung = {
  id: string;
  status: string;
  owner: { name: string };
  kamar: { nomor: string } | null;
} | null;

interface GabungClientProps {
  statusAwal: StatusGabung;
}

export function GabungClient({ statusAwal }: GabungClientProps) {
  const [status, setStatus] = useState(statusAwal);
  const [form, setForm] = useState({
    kodeUndangan: "",
    noHp: "",
    tanggalMasuk: new Date().toISOString().slice(0, 10),
  });
  const [isPending, startTransition] = useTransition();

  if (status) {
    return (
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Properti Anda</CardTitle>
          <CardDescription>Terhubung dengan {status.owner.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">Kamar: {status.kamar ? <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{status.kamar.nomor}</Badge> : <span className="text-muted-foreground">Menunggu penempatan kamar oleh owner</span>}</p>
        </CardContent>
      </Card>
    );
  }

  function submit() {
    if (!form.kodeUndangan.trim() || !form.noHp.trim()) {
      toast.error("Lengkapi kode undangan dan no. HP");
      return;
    }

    startTransition(async () => {
      try {
        const penghuni = await gabungDenganKode(form as GabungInput);
        toast.success("Berhasil bergabung! Menunggu owner menempatkan Anda ke kamar.");
        // refresh status secara sederhana
        window.location.reload();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal bergabung");
      }
    });
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Gabung ke Properti</CardTitle>
        <CardDescription>Masukkan kode undangan yang diberikan owner Anda.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="kode">Kode Undangan</Label>
          <Input id="kode" placeholder="Contoh: 7F3K9QRT" value={form.kodeUndangan} onChange={(e) => setForm((f) => ({ ...f, kodeUndangan: e.target.value }))} className="uppercase tracking-widest" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="noHp">No. HP</Label>
          <Input id="noHp" placeholder="08xxxxxxxxxx" value={form.noHp} onChange={(e) => setForm((f) => ({ ...f, noHp: e.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tanggalMasuk">Tanggal Masuk</Label>
          <Input id="tanggalMasuk" type="date" value={form.tanggalMasuk} onChange={(e) => setForm((f) => ({ ...f, tanggalMasuk: e.target.value }))} />
        </div>
        <Button onClick={submit} disabled={isPending} className="w-full">
          {isPending ? "Memproses..." : "Gabung Sekarang"}
        </Button>
      </CardContent>
    </Card>
  );
}
