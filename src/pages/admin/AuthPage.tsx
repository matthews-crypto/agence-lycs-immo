
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, Building, User, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

const loginFormSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

const forgotPasswordFormSchema = z.object({
  email: z.string().email("Adresse email invalide"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;

export default function AdminAuthPage() {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated, error, checkAndUpdateSession } = useAdminAuthStore();
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetEmailSent, setIsResetEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      <form onSubmit={forgotPasswordForm.handleSubmit(onSubmitForgotPassword)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={forgotPasswordForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium text-gray-700">Adresse email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="votre@email.com"
                      className="pl-10 h-12 border-gray-300 focus:ring-[#aa1ca0] focus:border-[#aa1ca0] transition-all duration-200 bg-white"
                      {...field}
                      disabled={isLoading}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
        </div>
        
        <Button
          type="submit"
          className="w-full h-12 bg-[#aa1ca0] hover:bg-[#c71585] text-white font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
              Envoi en cours...
            </>
          ) : (
            <>
              Envoyer le lien de réinitialisation
              <ArrowRight className="h-5 w-5 ml-1" />
            </>
          )}
        </Button>
        
        <div className="text-center">
          <button
            type="button"
            className="text-[#aa1ca0] hover:text-[#c71585] font-medium transition-colors duration-200"
            onClick={() => setIsForgotPassword(false)}
          >
            Retour à la connexion
          </button>
        </div>
      </form>
    </Form>
  );

  const renderLoginForm = () => (
    <Form {...loginForm}>
      <form onSubmit={loginForm.handleSubmit(onSubmitLogin)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={loginForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium text-gray-700">Adresse email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="votre@email.com"
                      className="pl-10 h-12 border-gray-300 focus:ring-[#aa1ca0] focus:border-[#aa1ca0] transition-all duration-200 bg-white"
                      {...field}
                      disabled={isLoading}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
          
          <FormField
            control={loginForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium text-gray-700">Mot de passe</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 h-12 border-gray-300 focus:ring-[#aa1ca0] focus:border-[#aa1ca0] transition-all duration-200 bg-white"
                      {...field}
                      disabled={isLoading}
                    />
                    <button 
                      type="button" 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Masquer" : "Afficher"}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
        </div>
        
        <Button
          type="submit"
          className="w-full h-12 bg-[#aa1ca0] hover:bg-[#c71585] text-white font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
              Connexion en cours...
            </>
          ) : (
            <>
              Se connecter
              <ArrowRight className="h-5 w-5 ml-1" />
            </>
          )}
        </Button>
        
        <div className="text-center">
          <button
            type="button"
            className="text-[#aa1ca0] hover:text-[#c71585] font-medium transition-colors duration-200"
            onClick={() => setIsForgotPassword(true)}
          >
            Mot de passe oublié ?
          </button>
        </div>
      </form>
    </Form>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Section visuelle (gauche sur desktop, haut sur mobile) */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-[#aa1ca0] to-[#c71585] p-8 md:p-12 flex flex-col justify-center items-center text-white">
        <div className="max-w-md mx-auto text-center md:text-left w-full">
          <div className="mb-8 flex justify-center md:justify-start">
            <img 
              src="../../../public/logoLycsImmo.png" 
              alt="LYCS IMMO Logo" 
              className="h-16 md:h-20 object-contain filter brightness-0 invert"
            />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4 animate-fadeIn">
            Plateforme d'administration immobilière
          </h1>
          
          <p className="text-lg md:text-xl opacity-90 mb-8 animate-fadeIn delay-100">
            Gérez efficacement vos biens, clients et transactions immobilières avec notre interface intuitive.
          </p>
          
          <div className="hidden md:flex flex-col space-y-6 animate-fadeIn delay-200">
            <div className="flex items-center">
              <div className="bg-white/20 p-3 rounded-full mr-4">
                <Building className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Gestion complète</h3>
                <p className="opacity-80 text-sm">Propriétés, clients, contrats et documents</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="bg-white/20 p-3 rounded-full mr-4">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Espace administrateur</h3>
                <p className="opacity-80 text-sm">Contrôle total sur votre plateforme</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="bg-white/20 p-3 rounded-full mr-4">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Accès sécurisé</h3>
                <p className="opacity-80 text-sm">Protection avancée de vos données</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Section formulaire (droite sur desktop, bas sur mobile) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-gray-50">
        <div className="w-full max-w-md space-y-8 animate-fadeIn delay-100">
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {isForgotPassword ? "Réinitialisation du mot de passe" : "Connexion administrateur"}
            </h2>
            <p className="mt-2 text-gray-600">
              {isForgotPassword 
                ? "Entrez votre email pour recevoir un lien de réinitialisation"
                : "Accédez à votre tableau de bord pour gérer vos activités immobilières"
              }
            </p>
          </div>
          
          {error && !isForgotPassword && (
            <Alert variant="destructive" className="animate-shake">
              <AlertDescription className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {isResetEmailSent && isForgotPassword && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <AlertDescription className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Si cette adresse email existe, vous recevrez un lien de réinitialisation dans quelques minutes.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
            {isForgotPassword ? renderForgotPasswordForm() : renderLoginForm()}
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>
              © {new Date().getFullYear()} LYCS IMMO. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
