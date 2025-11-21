import React, { useState, useEffect, useRef } from "react";
import { User } from "@/api/entities-local";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function LoginDialog({ open, onOpenChange, onSuccess }) {
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const googleButtonRefLogin = useRef(null);
  const googleButtonRefRegister = useRef(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await User.login(email, password);
      setEmail("");
      setPassword("");
      setSuccess("Login realizado com sucesso!");
      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
      }, 500);
    } catch (err) {
      setError(err.message || "Erro ao fazer login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!fullName.trim()) {
        setError("Nome completo é obrigatório");
        setLoading(false);
        return;
      }

      await User.register(email, password, fullName, phone, 'customer');
      setEmail("");
      setPassword("");
      setFullName("");
      setPhone("");
      setSuccess("Conta criada com sucesso! Você já está logado.");
      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      setError(err.message || "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Inicializar Google Sign-In quando o componente montar
  useEffect(() => {
    if (open && typeof window.google !== 'undefined' && window.google.accounts) {
      const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      if (!GOOGLE_CLIENT_ID) return;

      const callback = async (response) => {
        try {
          setLoading(true);
          setError("");
          await User.loginWithGoogle(response.credential);
          setSuccess("Login com Google realizado com sucesso!");
          setTimeout(() => {
            onSuccess?.();
            onOpenChange(false);
          }, 500);
        } catch (err) {
          setError(err.message || "Erro ao fazer login com Google. Tente novamente.");
          setLoading(false);
        }
      };

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback,
      });

      // Renderizar botão na aba de login
      if (googleButtonRefLogin.current) {
        window.google.accounts.id.renderButton(googleButtonRefLogin.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with',
        });
      }

      // Renderizar botão na aba de registro
      if (googleButtonRefRegister.current) {
        window.google.accounts.id.renderButton(googleButtonRefRegister.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signup_with',
        });
      }
    }
  }, [open, onSuccess, onOpenChange]);

  const handleGoogleLogin = () => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (!GOOGLE_CLIENT_ID) {
      setError("Google Client ID não configurado. Configure VITE_GOOGLE_CLIENT_ID no .env");
      return;
    }

    if (typeof window.google === 'undefined' || !window.google.accounts) {
      setError("Google Identity Services não está disponível. Verifique sua conexão.");
      return;
    }

    // O botão do Google já está renderizado e vai disparar o callback automaticamente
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setPhone("");
    setError("");
    setSuccess("");
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetForm();
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Entrar ou Criar Conta</DialogTitle>
          <DialogDescription>
            Acesse sua conta ou crie uma nova
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="register">Criar Conta</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou continue com
                </span>
              </div>
            </div>

            <div ref={googleButtonRefLogin} className="w-full flex justify-center"></div>
            {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <p className="text-xs text-center text-yellow-600">
                Configure VITE_GOOGLE_CLIENT_ID no .env para habilitar login com Google
              </p>
            )}
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700 text-sm">
                  Criando uma conta de <strong>Cliente</strong>. Para vender produtos, cadastre sua loja após criar a conta.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="register-name">Nome Completo</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-phone">Telefone (opcional)</Label>
                <Input
                  id="register-phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => {
                    const numbers = e.target.value.replace(/\D/g, '');
                    if (numbers.length <= 11) {
                      const formatted = numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                      setPhone(formatted);
                    }
                  }}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Senha</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  A senha deve ter pelo menos 8 caracteres
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Criando conta..." : "Criar Conta"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou continue com
                </span>
              </div>
            </div>

            <div ref={googleButtonRefRegister} className="w-full flex justify-center"></div>
            {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <p className="text-xs text-center text-yellow-600">
                Configure VITE_GOOGLE_CLIENT_ID no .env para habilitar login com Google
              </p>
            )}

            <p className="text-xs text-center text-gray-500">
              Ao criar uma conta, você concorda com nossos termos de uso e política de privacidade.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

