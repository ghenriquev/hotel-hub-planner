import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HotelManualData } from "@/hooks/useHotelManualData";
import { Users, Building } from "lucide-react";

interface Step2Props {
  data: Partial<HotelManualData>;
  onChange: (updates: Partial<HotelManualData>) => void;
}

const DEPARTMENTS = [
  { key: "reservas", label: "Reservas" },
  { key: "recepcao", label: "Recepção" },
  { key: "comercial", label: "Comercial" },
  { key: "financeiro", label: "Financeiro" },
  { key: "marketing", label: "Marketing" },
  { key: "gerencia", label: "Gerência" },
  { key: "eventos", label: "Eventos" },
  { key: "governanca", label: "Governança" },
];

export function Step2Contacts({ data, onChange }: Step2Props) {
  const departmentContacts = data.department_contacts || {};

  const updateDepartment = (key: string, field: string, value: string) => {
    const updated = {
      ...departmentContacts,
      [key]: {
        ...departmentContacts[key],
        [field]: value
      }
    };
    onChange({ department_contacts: updated });
  };

  return (
    <div className="space-y-8">
      {/* Contatos do Contratante */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Contatos do Contratante</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-foreground">Contratante Principal</h4>
            <div className="space-y-2">
              <Label htmlFor="contractor_name">Nome</Label>
              <Input
                id="contractor_name"
                placeholder="Nome do contratante"
                value={data.contractor_name || ""}
                onChange={(e) => onChange({ contractor_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractor_email">E-mail</Label>
              <Input
                id="contractor_email"
                type="email"
                placeholder="email@exemplo.com"
                value={data.contractor_email || ""}
                onChange={(e) => onChange({ contractor_email: e.target.value })}
              />
            </div>
          </div>
          
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-foreground">Testemunha</h4>
            <div className="space-y-2">
              <Label htmlFor="witness_name">Nome</Label>
              <Input
                id="witness_name"
                placeholder="Nome da testemunha"
                value={data.witness_name || ""}
                onChange={(e) => onChange({ witness_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="witness_email">E-mail</Label>
              <Input
                id="witness_email"
                type="email"
                placeholder="email@exemplo.com"
                value={data.witness_email || ""}
                onChange={(e) => onChange({ witness_email: e.target.value })}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contatos dos Departamentos */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Building className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Contatos dos Departamentos</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEPARTMENTS.map((dept) => (
            <div key={dept.key} className="p-4 bg-muted/30 rounded-lg space-y-3">
              <h4 className="font-medium text-foreground">{dept.label}</h4>
              <div className="grid grid-cols-1 gap-2">
                <Input
                  placeholder="Nome do responsável"
                  value={departmentContacts[dept.key]?.name || ""}
                  onChange={(e) => updateDepartment(dept.key, "name", e.target.value)}
                />
                <Input
                  type="email"
                  placeholder="E-mail"
                  value={departmentContacts[dept.key]?.email || ""}
                  onChange={(e) => updateDepartment(dept.key, "email", e.target.value)}
                />
                <Input
                  placeholder="Telefone"
                  value={departmentContacts[dept.key]?.phone || ""}
                  onChange={(e) => updateDepartment(dept.key, "phone", e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
