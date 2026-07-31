import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Pengaturan</h2>
      </div>

      <p className="text-muted-foreground">Kelola pengaturan akun Anda dan preferensi sistem di sini.</p>

      <Tabs defaultValue="profil" className="space-y-4 mt-6">
        {/* Navigasi Tab */}
        <TabsList>
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="keamanan">Keamanan</TabsTrigger>
          <TabsTrigger value="preferensi">Preferensi</TabsTrigger>
        </TabsList>

        {/* Konten Tab Profil */}
        <TabsContent value="profil">
          <Card>
            <CardHeader>
              <CardTitle>Profil Pengguna</CardTitle>
              <CardDescription>Perbarui informasi pribadi Anda. Perubahan akan langsung terlihat di aplikasi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input id="name" defaultValue="Budi Pemilik Kos" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue="budi@kontrakin.com" disabled />
                <p className="text-[0.8rem] text-muted-foreground">Email tidak dapat diubah karena terhubung dengan akun utama.</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Simpan Perubahan</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Konten Tab Keamanan */}
        <TabsContent value="keamanan">
          <Card>
            <CardHeader>
              <CardTitle>Kata Sandi</CardTitle>
              <CardDescription>Ubah kata sandi Anda untuk menjaga keamanan akun.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="current">Kata Sandi Saat Ini</Label>
                <Input id="current" type="password" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new">Kata Sandi Baru</Label>
                <Input id="new" type="password" />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline">Perbarui Kata Sandi</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
