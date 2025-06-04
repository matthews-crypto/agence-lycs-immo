import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAgencyAuthStore } from "@/stores/useAgencyAuthStore";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

type FormValues = z.infer<typeof formSchema>;

export default function AgencyAuthPage() {
  const navigate = useNavigate();
  const { agency } = useAgencyContext();
  const { login, isLoading, isAuthenticated, error } = useAgencyAuthStore();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    // Check if user is already authenticated
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session && agency?.slug) {
        console.log("Session found:", session);
        navigate(`/${agency.slug}/agency/services`);
      }
      if (error) {
        console.error("Session check error:", error);
      }
    };
    
    checkSession();
  }, [navigate, agency?.slug]);

  useEffect(() => {
    if (isAuthenticated && agency?.slug) {
      navigate(`/${agency.slug}/agency/services`);
    }
  }, [isAuthenticated, navigate, agency?.slug]);

  const onSubmit = async (values: FormValues) => {
    try {
      console.log("Attempting agency login with:", values.email);
      if (!agency?.slug) {
        throw new Error("Agency slug not found");
      }
      await login(values.email, values.password, agency.slug);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-50 px-4"
      style={{
        backgroundColor: agency?.primary_color || '#ffffff',
        color: agency?.secondary_color || '#000000'
      }}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            Connexion à {agency?.agency_name}
          </CardTitle>
          <CardDescription>
            Entrez vos identifiants pour accéder à votre espace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="agence@example.com"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Connexion en cours..." : "Se connecter"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}