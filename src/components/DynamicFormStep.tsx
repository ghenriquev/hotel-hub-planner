import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Building2, Phone, Star, Bed, Palmtree, Share2, Key, FileText, MapPin, Users, ClipboardList, Wifi, UtensilsCrossed, Car, Image, Megaphone } from 'lucide-react';
import { 
  TemplateStep, 
  TemplateSection, 
  TemplateField,
  TemplateOption,
  TemplateDepartment,
  TemplateCredentialType
} from '@/hooks/useManualFormTemplate';
import { HotelManualData } from '@/hooks/useHotelManualData';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2, Phone, Star, Bed, Palmtree, Share2, Key,
  FileText, MapPin, Users, ClipboardList, Wifi,
  UtensilsCrossed, Car, Image, Megaphone
};

interface DynamicFormStepProps {
  step: TemplateStep;
  data: Partial<HotelManualData>;
  onChange: (updates: Partial<HotelManualData>) => void;
}

// Helper to get nested value from object using dot notation
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
};

// Helper to set nested value in object using dot notation
const setNestedValue = (obj: any, path: string, value: any): any => {
  const parts = path.split('.');
  const result = { ...obj };
  let current = result;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    current[part] = current[part] ? { ...current[part] } : {};
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
  return result;
};

function DynamicField({ 
  field, 
  value, 
  onChange 
}: { 
  field: TemplateField; 
  value: any; 
  onChange: (val: any) => void;
}) {
  switch (field.type) {
    case 'checkbox':
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={field.key}
            checked={!!value}
            onCheckedChange={onChange}
          />
          <Label htmlFor={field.key} className="text-sm font-normal cursor-pointer">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
        </div>
      );
    
    case 'textarea':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.key}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Textarea
            id={field.key}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
          />
        </div>
      );
    
    case 'number':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.key}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={field.key}
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        </div>
      );
    
    default:
      return (
        <div className="space-y-2">
          <Label htmlFor={field.key}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={field.key}
            type={field.type === 'email' ? 'email' : 'text'}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        </div>
      );
  }
}

function DepartmentContactsSection({
  departments,
  data,
  onChange
}: {
  departments: TemplateDepartment[];
  data: Partial<HotelManualData>;
  onChange: (updates: Partial<HotelManualData>) => void;
}) {
  const contacts = (data.department_contacts || {}) as Record<string, { name?: string; email?: string; phone?: string }>;

  const updateContact = (deptKey: string, field: string, value: string) => {
    const updated = {
      ...contacts,
      [deptKey]: {
        ...contacts[deptKey],
        [field]: value
      }
    };
    onChange({ department_contacts: updated });
  };

  return (
    <div className="space-y-4">
      {departments.map((dept) => (
        <Card key={dept.key} className="border-dashed">
          <CardHeader className="py-3">
            <CardTitle className="text-base font-medium">{dept.label}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={contacts[dept.key]?.name || ''}
                onChange={(e) => updateContact(dept.key, 'name', e.target.value)}
                placeholder="Nome do responsável"
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={contacts[dept.key]?.email || ''}
                onChange={(e) => updateContact(dept.key, 'email', e.target.value)}
                placeholder="email@hotel.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={contacts[dept.key]?.phone || ''}
                onChange={(e) => updateContact(dept.key, 'phone', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CheckboxGroupSection({
  options,
  fieldKey,
  data,
  onChange
}: {
  options: TemplateOption[];
  fieldKey: string;
  data: Partial<HotelManualData>;
  onChange: (updates: Partial<HotelManualData>) => void;
}) {
  const currentValues = (getNestedValue(data, fieldKey) || {}) as Record<string, boolean>;

  const toggleOption = (optionKey: string) => {
    const updated = {
      ...currentValues,
      [optionKey]: !currentValues[optionKey]
    };
    onChange(setNestedValue({}, fieldKey, updated));
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {options.map((option) => (
        <div key={option.key} className="flex items-center space-x-2">
          <Checkbox
            id={`${fieldKey}-${option.key}`}
            checked={!!currentValues[option.key]}
            onCheckedChange={() => toggleOption(option.key)}
          />
          <Label 
            htmlFor={`${fieldKey}-${option.key}`} 
            className="text-sm font-normal cursor-pointer"
          >
            {option.label}
          </Label>
        </div>
      ))}
    </div>
  );
}

function AccommodationsListSection({
  data,
  onChange
}: {
  data: Partial<HotelManualData>;
  onChange: (updates: Partial<HotelManualData>) => void;
}) {
  const accommodations = (data.accommodations || []) as Array<Record<string, string>>;

  const addAccommodation = () => {
    onChange({ accommodations: [...accommodations, { name: '' }] });
  };

  const updateAccommodation = (index: number, field: string, value: string) => {
    const updated = [...accommodations];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ accommodations: updated });
  };

  const removeAccommodation = (index: number) => {
    const updated = accommodations.filter((_, i) => i !== index);
    onChange({ accommodations: updated });
  };

  return (
    <div className="space-y-4">
      {accommodations.map((acc, index) => (
        <Card key={index} className="border-dashed">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">
              Acomodação {index + 1}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => removeAccommodation(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome da Categoria</Label>
              <Input
                value={acc.name || ''}
                onChange={(e) => updateAccommodation(index, 'name', e.target.value)}
                placeholder="Ex: Standard, Luxo, Suíte Master"
              />
            </div>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                value={acc.quantity || ''}
                onChange={(e) => updateAccommodation(index, 'quantity', e.target.value)}
                placeholder="Número de unidades"
              />
            </div>
            <div className="space-y-2">
              <Label>Máximo de Hóspedes</Label>
              <Input
                type="number"
                value={acc.max_guests || ''}
                onChange={(e) => updateAccommodation(index, 'max_guests', e.target.value)}
                placeholder="Capacidade"
              />
            </div>
            <div className="space-y-2">
              <Label>Tamanho (m²)</Label>
              <Input
                value={acc.size || ''}
                onChange={(e) => updateAccommodation(index, 'size', e.target.value)}
                placeholder="Ex: 25"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Descrição</Label>
              <Textarea
                value={acc.description || ''}
                onChange={(e) => updateAccommodation(index, 'description', e.target.value)}
                placeholder="Descreva as comodidades e características..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      ))}
      
      <Button variant="outline" onClick={addAccommodation} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Acomodação
      </Button>
    </div>
  );
}

function AccessCredentialsSection({
  credentialTypes,
  data,
  onChange
}: {
  credentialTypes: TemplateCredentialType[];
  data: Partial<HotelManualData>;
  onChange: (updates: Partial<HotelManualData>) => void;
}) {
  const credentials = (data.access_credentials || {}) as Record<string, { url?: string; username?: string; password?: string; notes?: string }>;

  const updateCredential = (typeKey: string, field: string, value: string) => {
    const updated = {
      ...credentials,
      [typeKey]: {
        ...credentials[typeKey],
        [field]: value
      }
    };
    onChange({ access_credentials: updated });
  };

  return (
    <div className="space-y-4">
      {credentialTypes.map((type) => (
        <Card key={type.key} className="border-dashed">
          <CardHeader className="py-3">
            <CardTitle className="text-base font-medium">{type.label}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={credentials[type.key]?.url || ''}
                onChange={(e) => updateCredential(type.key, 'url', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Usuário</Label>
              <Input
                value={credentials[type.key]?.username || ''}
                onChange={(e) => updateCredential(type.key, 'username', e.target.value)}
                placeholder="Usuário de acesso"
              />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input
                type="password"
                value={credentials[type.key]?.password || ''}
                onChange={(e) => updateCredential(type.key, 'password', e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input
                value={credentials[type.key]?.notes || ''}
                onChange={(e) => updateCredential(type.key, 'notes', e.target.value)}
                placeholder="Notas adicionais"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DynamicSection({
  section,
  data,
  onChange
}: {
  section: TemplateSection;
  data: Partial<HotelManualData>;
  onChange: (updates: Partial<HotelManualData>) => void;
}) {
  const IconComponent = iconMap[section.icon] || Building2;

  // Render section content based on type
  const renderContent = () => {
    switch (section.type) {
      case 'department_contacts':
        return section.departments ? (
          <DepartmentContactsSection 
            departments={section.departments} 
            data={data} 
            onChange={onChange} 
          />
        ) : null;
      
      case 'checkbox_group':
        return section.options && section.field_key ? (
          <CheckboxGroupSection 
            options={section.options} 
            fieldKey={section.field_key}
            data={data} 
            onChange={onChange} 
          />
        ) : null;
      
      case 'accommodations_list':
        return <AccommodationsListSection data={data} onChange={onChange} />;
      
      case 'access_credentials':
        return section.credential_types ? (
          <AccessCredentialsSection 
            credentialTypes={section.credential_types} 
            data={data} 
            onChange={onChange} 
          />
        ) : null;
      
      default:
        // Regular fields
        if (!section.fields) return null;
        
        // Check if all fields are checkboxes - render in grid
        const allCheckboxes = section.fields.every(f => f.type === 'checkbox');
        
        if (allCheckboxes) {
          return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {section.fields.map((field) => (
                <DynamicField
                  key={field.key}
                  field={field}
                  value={getNestedValue(data, field.key)}
                  onChange={(val) => onChange(setNestedValue({}, field.key, val))}
                />
              ))}
            </div>
          );
        }
        
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields.map((field) => (
              <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                <DynamicField
                  field={field}
                  value={getNestedValue(data, field.key)}
                  onChange={(val) => onChange(setNestedValue({}, field.key, val))}
                />
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <IconComponent className="h-5 w-5 text-primary" />
          {section.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}

export function DynamicFormStep({ step, data, onChange }: DynamicFormStepProps) {
  return (
    <div className="space-y-6">
      {step.sections.map((section, index) => (
        <DynamicSection
          key={`${step.id}-${index}`}
          section={section}
          data={data}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
