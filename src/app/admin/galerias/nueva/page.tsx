import { redirect } from "next/navigation";
import { getServerSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import AdminTopbar from "@/components/admin/AdminTopbar";
import NewGalleryForm from "@/components/admin/NewGalleryForm";

export default async function NewGalleryPage() {
  if (!supabaseConfigured()) redirect("/admin");
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  if (!isAdmin(user.email)) redirect("/admin");

  return (
    <>
      <AdminTopbar email={user.email ?? ""} />
      <main id="main" className="adm-main">
        <div className="wrap" style={{ maxWidth: 720 }}>
          <header className="adm-head">
            <div>
              <div className="label">Admin · Nueva galería</div>
              <h1 className="serif adm-title">Crear galería</h1>
            </div>
          </header>
          <NewGalleryForm />
        </div>
      </main>
    </>
  );
}
