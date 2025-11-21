import React, { useState } from "react";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export const pagePermissions = {
  public: true,
  loginRequired: false
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (accessCode !== "admin123") {
      setError("Código de acesso inválido");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Primeiro verifica se já está logado
      try {
        const userData = await User.me();
        if (userData.role === "admin") {
          navigate(createPageUrl("AdminDashboard"));
          return;
        }
      } catch (e) {
        // Não está logado, vamos fazer login com credenciais do admin
        await User.login("admin@localmart.com", "admin123");
      }

      navigate(createPageUrl("AdminDashboard"));
    } catch (error) {
      setError("Erro ao fazer login. Tente novamente.");
      console.error("Erro no login:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <KeyRound className="w-6 h-6 text-blue-600" />
            Acesso Administrativo
          </CardTitle>
          <CardDescription>
            Digite o código de acesso para continuar
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Digite o código de acesso"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Verificando..." : "Acessar Painel"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}