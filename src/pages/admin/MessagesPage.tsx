import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail } from "lucide-react";

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).slice(-2);
  }
  return color;
}

function AvatarInitials({ name, email }: { name?: string; email: string }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : email[0]?.toUpperCase() || "?";
  const bg = stringToColor(name || email);
  return (
    <div
      className="flex items-center justify-center rounded-full h-10 w-10 text-white font-bold text-lg mr-3 shadow"
      style={{ background: bg }}
      title={name || email}
    >
      {initials}
    </div>
  );
}

export default function MessagesPage() {
  const { data: messages, isLoading, error } = useQuery({
    queryKey: ["admin", "messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_message_admin")
        .select("id, created_at, email, nom_complet, message");
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto p-8 text-red-500">Erreur de chargement des messages.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7c1e0] via-[#f5e6fa] to-[#e8d3fc] font-sans">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-[#f472b6]/30 shadow-sm mb-8">
        <div className="container mx-auto flex items-center py-7 px-4">
          <Mail className="h-7 w-7 text-[#f472b6] mr-3" />
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#f472b6] via-[#e879f9] to-[#a21caf]">Messages de contact</h1>
        </div>
      </div>
      <main className="container mx-auto max-w-2xl px-2 md:px-4 pb-10">
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-2">
          {messages.length === 0 && (
            <Card className="shadow-none border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucun message pour le moment.
              </CardContent>
            </Card>
          )}
          {messages.map((msg) => (
            <Card key={msg.id} className="rounded-3xl bg-white/95 hover:shadow-xl transition-all border-l-4 border-[#f472b6]/70">
              <div className="flex items-center p-4 pb-2">
                <AvatarInitials name={msg.nom_complet} email={msg.email} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate text-lg text-[#a21caf]">{msg.nom_complet || msg.email}</span>
                    <span className="ml-2 px-2 py-0.5 rounded bg-[#f472b6]/10 text-[#f472b6] text-xs font-medium">{msg.email}</span>
                  </div>
                  <div className="text-xs text-[#a21caf] mt-0.5">
                    {new Date(msg.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
              </div>
              <CardContent className="pt-1 pb-3 px-6">
                <div className="whitespace-pre-line text-base leading-relaxed text-gray-800 dark:text-gray-100">
                  {msg.message}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
