import { HotelManualData } from '@/hooks/useHotelManualData';
import { TemplateStep, TemplateSection, TemplateField } from '@/hooks/useManualFormTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Building2, Users, Sparkles, Bed, UtensilsCrossed, Key } from 'lucide-react';

interface ManualResponsesViewerProps {
  data: HotelManualData;
  steps: TemplateStep[];
}

const STEP_ICONS: Record<number, React.ReactNode> = {
  1: <Building2 className="h-5 w-5" />,
  2: <Users className="h-5 w-5" />,
  3: <Sparkles className="h-5 w-5" />,
  4: <Bed className="h-5 w-5" />,
  5: <UtensilsCrossed className="h-5 w-5" />,
  6: <Building2 className="h-5 w-5" />,
  7: <Key className="h-5 w-5" />,
};

function getFieldValue(data: HotelManualData, fieldKey: string): any {
  // Check direct properties
  if (fieldKey in data) {
    return (data as any)[fieldKey];
  }
  
  // Check nested JSON fields
  const jsonFields = ['department_contacts', 'differentials', 'internet_info', 'policies', 
                      'accommodations', 'gastronomy', 'leisure', 'parking', 'site_info', 
                      'ads_marketing', 'access_credentials'];
  
  for (const jsonField of jsonFields) {
    const jsonData = (data as any)[jsonField];
    if (jsonData && typeof jsonData === 'object' && fieldKey in jsonData) {
      return jsonData[fieldKey];
    }
  }
  
  return undefined;
}

function renderFieldValue(value: any, type: string): React.ReactNode {
  if (value === undefined || value === null || value === '') {
    return <span className="text-muted-foreground italic">Não preenchido</span>;
  }
  
  if (type === 'checkbox') {
    return value ? (
      <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Sim
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-muted text-muted-foreground">
        <XCircle className="h-3 w-3 mr-1" />
        Não
      </Badge>
    );
  }
  
  if (typeof value === 'object') {
    return <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>;
  }
  
  return <span className="text-foreground">{String(value)}</span>;
}

function renderSection(section: TemplateSection, data: HotelManualData) {
  if (section.type === 'department_contacts' && section.departments) {
    const contacts = data.department_contacts || {};
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {section.departments.map((dept) => {
          const deptData = (contacts as any)[dept.key] || {};
          return (
            <div key={dept.key} className="bg-muted/30 rounded-lg p-3">
              <h4 className="font-medium text-sm mb-2">{dept.label}</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nome:</span>
                  <span>{deptData.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{deptData.email || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefone:</span>
                  <span>{deptData.phone || '-'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (section.type === 'checkbox_group' && section.options && section.field_key) {
    const fieldData = (data as any)[section.field_key] || {};
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {section.options.map((option) => {
          const isEnabled = fieldData[option.key]?.enabled;
          return (
            <div key={option.key} className={`
              flex items-center gap-2 p-2 rounded-lg text-sm
              ${isEnabled ? 'bg-green-500/10 text-green-700' : 'bg-muted/30 text-muted-foreground'}
            `}>
              {isEnabled ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4 opacity-50" />}
              {option.label}
            </div>
          );
        })}
      </div>
    );
  }

  if (section.type === 'accommodations_list') {
    const accommodations = data.accommodations || [];
    if (accommodations.length === 0) {
      return <p className="text-muted-foreground italic">Nenhuma acomodação cadastrada</p>;
    }
    return (
      <div className="space-y-3">
        {accommodations.map((acc: any, index: number) => (
          <div key={index} className="bg-muted/30 rounded-lg p-3">
            <h4 className="font-medium text-sm mb-2">{acc.name || `Acomodação ${index + 1}`}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(acc).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span>{String(value) || '-'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (section.type === 'access_credentials' && section.credential_types) {
    const credentials = data.access_credentials || {};
    return (
      <div className="space-y-3">
        {section.credential_types.map((cred) => {
          const credData = (credentials as any)[cred.key] || {};
          const hasData = Object.values(credData).some(v => v);
          return (
            <div key={cred.key} className={`
              bg-muted/30 rounded-lg p-3
              ${!hasData ? 'opacity-50' : ''}
            `}>
              <h4 className="font-medium text-sm mb-2">{cred.label}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                {cred.fields.map((field) => (
                  <div key={field} className="flex justify-between">
                    <span className="text-muted-foreground capitalize">{field}:</span>
                    <span>{field === 'password' ? '••••••••' : (credData[field] || '-')}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Default: render fields
  if (section.fields) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {section.fields.map((field) => {
          const value = getFieldValue(data, field.key);
          return (
            <div key={field.key} className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </label>
              <div className="text-sm">
                {renderFieldValue(value, field.type)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}

export function ManualResponsesViewer({ data, steps }: ManualResponsesViewerProps) {
  return (
    <div className="space-y-6">
      {steps.map((step) => (
        <Card key={step.id} className="overflow-hidden">
          <CardHeader className="bg-muted/30 py-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {STEP_ICONS[step.id] || <Building2 className="h-5 w-5" />}
              </div>
              <div>
                <span className="text-foreground">{step.title}</span>
                <p className="text-sm font-normal text-muted-foreground">{step.subtitle}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {step.sections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <h3 className="font-medium text-sm text-foreground mb-3 flex items-center gap-2">
                  {section.title}
                </h3>
                {renderSection(section, data)}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
