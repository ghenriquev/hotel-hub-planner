import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

const signupSchema = loginSchema.extend({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
});

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Validate login
        loginSchema.parse({ email, password });
        
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Credenciais inválidas. Verifique seu e-mail e senha.");
          } else {
            toast.error(error.message);
          }
          setLoading(false);
          return;
        }

        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      } else {
        // Validate signup
        signupSchema.parse({ email, password, name });
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name,
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Este e-mail já está cadastrado. Tente fazer login.");
          } else {
            toast.error(error.message);
          }
          setLoading(false);
          return;
        }

        toast.success("Cadastro realizado! Você já pode fazer login.");
        setIsLogin(true);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        toast.error("Erro inesperado. Tente novamente.");
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-primary blur-3xl" />
          <div className="absolute bottom-32 right-20 w-48 h-48 rounded-full bg-gold blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-16">
          <h1 className="font-display text-4xl lg:text-5xl text-primary-foreground mb-6 leading-tight">
            Plano Estratégico de<br />
            <span className="text-gold">Vendas Diretas</span>
          </h1>
          <p className="text-primary-foreground/70 text-lg max-w-md">
            HUB interno para consultores da Reprotel. Gerencie análises estratégicas e 
            acompanhe o progresso dos hotéis parceiros.
          </p>
          
          <div className="mt-12 flex gap-8">
            <div className="text-center">
              <div className="text-3xl font-display text-gold">11</div>
              <div className="text-sm text-primary-foreground/60">Agentes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display text-gold">AI</div>
              <div className="text-sm text-primary-foreground/60">Powered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display text-gold">Pro</div>
              <div className="text-sm text-primary-foreground/60">Resultados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-10">
            <Logo size="lg" className="justify-center mb-6" />
            <h2 className="font-display text-2xl text-foreground mb-2">
              {isLogin ? "Acesso ao HUB" : "Criar Conta"}
            </h2>
            <p className="text-muted-foreground">
              {isLogin ? "Entre com suas credenciais" : "Cadastre-se para acessar"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="premium"
              size="xl"
              className="w-full"
              disabled={loading}
            >
              {loading ? (isLogin ? "Entrando..." : "Cadastrando...") : (isLogin ? "Entrar" : "Cadastrar")}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Acesso exclusivo para consultores Reprotel
          </p>
        </div>
      </div>
    </div>
  );
}
