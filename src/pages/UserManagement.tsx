import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Users,
  Plus,
  Loader2,
  AlertCircle,
  Shield,
  User,
  KeyRound,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { z } from "zod";

interface UserWithRole {
  id: string;
  email: string;
  name: string | null;
  role: AppRole;
  created_at: string;
}

const newUserSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
});

export default function UserManagement() {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading, userId } = useUserRole();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("user");

  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const fetchUsers = async () => {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      toast.error('Erro ao carregar usuários');
      return;
    }

    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      toast.error('Erro ao carregar roles');
      return;
    }

    const usersWithRoles: UserWithRole[] = (profiles || []).map((profile: any) => {
      const userRole = roles?.find((r: any) => r.user_id === profile.id);
      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: (userRole?.role as AppRole) || 'user',
        created_at: profile.created_at,
      };
    });

    setUsers(usersWithRoles);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      newUserSchema.parse({ email: newEmail, password: newPassword, name: newName });

      // Create user via edge function (admin operation)
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { 
          email: newEmail, 
          password: newPassword, 
          name: newName,
          role: newRole 
        }
      });

      if (error) {
        toast.error(error.message || 'Erro ao criar usuário');
        setSaving(false);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        setSaving(false);
        return;
      }

      toast.success('Usuário criado com sucesso!');
      setShowAddForm(false);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      setNewRole("user");
      fetchUsers();
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        toast.error('Erro ao criar usuário');
      }
    }
    setSaving(false);
  };

  const handleChangeRole = async (targetUserId: string, newRole: AppRole) => {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', targetUserId);

    if (error) {
      toast.error('Erro ao alterar role');
      return;
    }

    toast.success('Role alterada com sucesso!');
    fetchUsers();
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUserId || !resetPasswordValue) return;
    
    if (resetPasswordValue.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setResettingPassword(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { 
          userId: resetPasswordUserId, 
          newPassword: resetPasswordValue 
        }
      });

      if (error) {
        toast.error(error.message || 'Erro ao resetar senha');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success('Senha resetada com sucesso!');
      setResetPasswordUserId(null);
      setResetPasswordValue("");
    } catch (err) {
      toast.error('Erro ao resetar senha');
    } finally {
      setResettingPassword(false);
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h2 className="font-display text-2xl text-foreground mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-4">
            Apenas administradores podem acessar esta página.
          </p>
          <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Logo />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl lg:text-3xl text-foreground">
                Gerenciar Usuários
              </h1>
              <p className="text-muted-foreground">Adicione e gerencie usuários do sistema</p>
            </div>
          </div>

          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        {/* Add User Form */}
        {showAddForm && (
          <div className="bg-card border border-border rounded-xl p-6 mb-8 animate-slide-up">
            <h3 className="font-semibold text-foreground mb-4">Adicionar Novo Usuário</h3>
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newName">Nome</Label>
                <Input
                  id="newName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nome do usuário"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newEmail">E-mail</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newRole">Tipo de Acesso</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Criar Usuário
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        <div className="space-y-4">
          {users.map((user, index) => (
            <div
              key={user.id}
              className="bg-card border border-border rounded-xl p-5 animate-slide-up"
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    user.role === 'admin' ? "bg-primary/20" : "bg-muted"
                  )}>
                    {user.role === 'admin' ? (
                      <Shield className="h-5 w-5 text-primary" />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{user.name || 'Sem nome'}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Select 
                    value={user.role} 
                    onValueChange={(v) => handleChangeRole(user.id, v as AppRole)}
                    disabled={user.id === userId}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>

                  {user.id !== userId && (
                    <AlertDialog open={resetPasswordUserId === user.id} onOpenChange={(open) => {
                      if (!open) {
                        setResetPasswordUserId(null);
                        setResetPasswordValue("");
                        setShowResetPassword(false);
                      }
                    }}>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setResetPasswordUserId(user.id)}
                          title="Resetar senha"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Resetar Senha</AlertDialogTitle>
                          <AlertDialogDescription>
                            Digite uma nova senha para <strong>{user.email}</strong>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-4">
                          <Label htmlFor="resetPassword">Nova Senha</Label>
                          <div className="relative">
                            <Input
                              id="resetPassword"
                              type={showResetPassword ? "text" : "password"}
                              value={resetPasswordValue}
                              onChange={(e) => setResetPasswordValue(e.target.value)}
                              placeholder="Mínimo 6 caracteres"
                              minLength={6}
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowResetPassword(!showResetPassword)}
                            >
                              {showResetPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleResetPassword}
                            disabled={resettingPassword || resetPasswordValue.length < 6}
                          >
                            {resettingPassword ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Resetar Senha
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {user.id !== userId && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
