
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
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
import { toast } from "sonner";

const loginFormSchema = z.object({
  email: z.string(),
  password: z.string(),
});

const forgotPasswordFormSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;

export default function AdminAuthPage() {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated, error, checkAndUpdateSession } = useAdminAuthStore();
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetEmailSent, setIsResetEmailSent] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    checkAndUpdateSession();
  }, [checkAndUpdateSession]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const onSubmitLogin = async (values: LoginFormValues) => {
    try {
      await login(values.email, values.password);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const onSubmitForgotPassword = async (values: ForgotPasswordFormValues) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/admin/auth`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setIsResetEmailSent(true);
      toast.success("Si cette adresse email existe, vous recevrez un lien de réinitialisation.");
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("Une erreur est survenue");
    }
  };

  const renderForgotPasswordForm = () => (
    <Form {...forgotPasswordForm}>
      <form onSubmit={forgotPasswordForm.handleSubmit(onSubmitForgotPassword)} className="space-y-4">
        <FormField
          control={forgotPasswordForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="admin@example.com"
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
          Envoyer le lien de réinitialisation
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => setIsForgotPassword(false)}
        >
          Retour à la connexion
        </Button>
      </form>
    </Form>
  );

  const renderLoginForm = () => (
    <Form {...loginForm}>
      <form onSubmit={loginForm.handleSubmit(onSubmitLogin)} className="space-y-4">
        <FormField
          control={loginForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={loginForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
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
          {isLoading ? "Logging in..." : "Login"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => setIsForgotPassword(true)}
        >
          Mot de passe oublié ?
        </Button>
      </form>
    </Form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {isForgotPassword ? "Réinitialisation du mot de passe" : "Admin Login"}
          </CardTitle>
          <CardDescription>
            {isForgotPassword 
              ? "Entrez votre email pour recevoir un lien de réinitialisation"
              : "Enter your credentials to access the admin dashboard"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && !isForgotPassword && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {isResetEmailSent && isForgotPassword && (
            <Alert className="mb-4">
              <AlertDescription>
                Si cette adresse email existe, vous recevrez un lien de réinitialisation dans quelques minutes.
              </AlertDescription>
            </Alert>
          )}
          {isForgotPassword ? renderForgotPasswordForm() : renderLoginForm()}
        </CardContent>
      </Card>
    </div>
  );
}
