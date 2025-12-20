import { useState } from 'react';
import { 
  Building2, Phone, Star, Bed, Palmtree, Share2, Key,
  ChevronDown, ChevronRight, Plus, Trash2, GripVertical,
  Save, FileText, MapPin, Users, ClipboardList, Wifi,
  UtensilsCrossed, Car, Image, Megaphone
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useManualFormTemplate, TemplateStep, TemplateSection, TemplateField, TemplateOption } from '@/hooks/useManualFormTemplate';
import { SaveIndicator } from '@/components/SaveIndicator';
import { Skeleton } from '@/components/ui/skeleton';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2, Phone, Star, Bed, Palmtree, Share2, Key,
  FileText, MapPin, Users, ClipboardList, Wifi,
  UtensilsCrossed, Car, Image, Megaphone
};

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'textarea', label: 'Texto Longo' },
  { value: 'email', label: 'E-mail' },
  { value: 'number', label: 'Número' },
  { value: 'checkbox', label: 'Checkbox' }
];

const AVAILABLE_ICONS = Object.keys(iconMap);

export default function SettingsManualTemplate() {
  const { template, loading, saving, updateSteps } = useManualFormTemplate();
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [localSteps, setLocalSteps] = useState<TemplateStep[]>([]);

  // Initialize local steps when template loads
  useState(() => {
    if (template?.steps) {
      setLocalSteps(template.steps);
    }
  });

  // Update local steps when template changes
  if (template?.steps && localSteps.length === 0) {
    setLocalSteps(template.steps);
  }

  const toggleStep = (stepId: number) => {
    setExpandedSteps(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId) 
        : [...prev, stepId]
    );
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionKey)
        ? prev.filter(k => k !== sectionKey)
        : [...prev, sectionKey]
    );
  };

  const updateStep = (stepIndex: number, updates: Partial<TemplateStep>) => {
    const newSteps = [...localSteps];
    newSteps[stepIndex] = { ...newSteps[stepIndex], ...updates };
    setLocalSteps(newSteps);
    setHasChanges(true);
  };

  const updateSection = (stepIndex: number, sectionIndex: number, updates: Partial<TemplateSection>) => {
    const newSteps = [...localSteps];
    newSteps[stepIndex].sections[sectionIndex] = { 
      ...newSteps[stepIndex].sections[sectionIndex], 
      ...updates 
    };
    setLocalSteps(newSteps);
    setHasChanges(true);
  };

  const updateField = (stepIndex: number, sectionIndex: number, fieldIndex: number, updates: Partial<TemplateField>) => {
    const newSteps = [...localSteps];
    const section = newSteps[stepIndex].sections[sectionIndex];
    if (section.fields) {
      section.fields[fieldIndex] = { ...section.fields[fieldIndex], ...updates };
      setLocalSteps(newSteps);
      setHasChanges(true);
    }
  };

  const addField = (stepIndex: number, sectionIndex: number) => {
    const newSteps = [...localSteps];
    const section = newSteps[stepIndex].sections[sectionIndex];
    if (!section.fields) section.fields = [];
    section.fields.push({
      key: `new_field_${Date.now()}`,
      label: 'Novo Campo',
      type: 'text',
      required: false,
      placeholder: ''
    });
    setLocalSteps(newSteps);
    setHasChanges(true);
  };

  const removeField = (stepIndex: number, sectionIndex: number, fieldIndex: number) => {
    const newSteps = [...localSteps];
    const section = newSteps[stepIndex].sections[sectionIndex];
    if (section.fields) {
      section.fields.splice(fieldIndex, 1);
      setLocalSteps(newSteps);
      setHasChanges(true);
    }
  };

  const updateOption = (stepIndex: number, sectionIndex: number, optionIndex: number, updates: Partial<TemplateOption>) => {
    const newSteps = [...localSteps];
    const section = newSteps[stepIndex].sections[sectionIndex];
    if (section.options) {
      section.options[optionIndex] = { ...section.options[optionIndex], ...updates };
      setLocalSteps(newSteps);
      setHasChanges(true);
    }
  };

  const addOption = (stepIndex: number, sectionIndex: number) => {
    const newSteps = [...localSteps];
    const section = newSteps[stepIndex].sections[sectionIndex];
    if (!section.options) section.options = [];
    section.options.push({
      key: `new_option_${Date.now()}`,
      label: 'Nova Opção'
    });
    setLocalSteps(newSteps);
    setHasChanges(true);
  };

  const removeOption = (stepIndex: number, sectionIndex: number, optionIndex: number) => {
    const newSteps = [...localSteps];
    const section = newSteps[stepIndex].sections[sectionIndex];
    if (section.options) {
      section.options.splice(optionIndex, 1);
      setLocalSteps(newSteps);
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    await updateSteps(localSteps);
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum template encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Editor de Template do Manual
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure a estrutura do formulário do Manual de Funcionamento
          </p>
        </div>
        <div className="flex items-center gap-4">
          <SaveIndicator status={saving ? 'saving' : hasChanges ? 'idle' : 'saved'} />
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Alterações
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {localSteps.map((step, stepIndex) => (
          <Card key={step.id} className="border-border">
            <Collapsible 
              open={expandedSteps.includes(step.id)}
              onOpenChange={() => toggleStep(step.id)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                          {step.id}
                        </span>
                        {step.title}
                      </CardTitle>
                      <CardDescription>{step.subtitle}</CardDescription>
                    </div>
                    {expandedSteps.includes(step.id) ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-6">
                  {/* Step Title/Subtitle */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-2">
                      <Label>Título da Etapa</Label>
                      <Input 
                        value={step.title}
                        onChange={(e) => updateStep(stepIndex, { title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subtítulo</Label>
                      <Input 
                        value={step.subtitle}
                        onChange={(e) => updateStep(stepIndex, { subtitle: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Sections */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Seções
                    </h4>
                    
                    {step.sections.map((section, sectionIndex) => {
                      const sectionKey = `${step.id}-${sectionIndex}`;
                      const IconComponent = iconMap[section.icon] || Building2;
                      
                      return (
                        <Card key={sectionKey} className="border-dashed">
                          <Collapsible
                            open={expandedSections.includes(sectionKey)}
                            onOpenChange={() => toggleSection(sectionKey)}
                          >
                            <CollapsibleTrigger asChild>
                              <CardHeader className="py-3 cursor-pointer hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-3">
                                  <IconComponent className="h-4 w-4 text-primary" />
                                  <span className="font-medium flex-1">{section.title}</span>
                                  {section.type && (
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                      {section.type}
                                    </span>
                                  )}
                                  {expandedSections.includes(sectionKey) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent>
                              <CardContent className="pt-0 space-y-4">
                                {/* Section Properties */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Título da Seção</Label>
                                    <Input 
                                      value={section.title}
                                      onChange={(e) => updateSection(stepIndex, sectionIndex, { title: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Ícone</Label>
                                    <Select
                                      value={section.icon}
                                      onValueChange={(value) => updateSection(stepIndex, sectionIndex, { icon: value })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {AVAILABLE_ICONS.map(icon => (
                                          <SelectItem key={icon} value={icon}>
                                            {icon}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* Fields (for regular sections) */}
                                {section.fields && (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-sm font-medium">Campos</Label>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => addField(stepIndex, sectionIndex)}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Adicionar Campo
                                      </Button>
                                    </div>
                                    
                                    {section.fields.map((field, fieldIndex) => (
                                      <div 
                                        key={field.key} 
                                        className="grid grid-cols-12 gap-2 items-start p-3 bg-muted/20 rounded-lg"
                                      >
                                        <div className="col-span-3 space-y-1">
                                          <Label className="text-xs">Chave</Label>
                                          <Input 
                                            value={field.key}
                                            onChange={(e) => updateField(stepIndex, sectionIndex, fieldIndex, { key: e.target.value })}
                                            className="h-8 text-sm"
                                          />
                                        </div>
                                        <div className="col-span-3 space-y-1">
                                          <Label className="text-xs">Label</Label>
                                          <Input 
                                            value={field.label}
                                            onChange={(e) => updateField(stepIndex, sectionIndex, fieldIndex, { label: e.target.value })}
                                            className="h-8 text-sm"
                                          />
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                          <Label className="text-xs">Tipo</Label>
                                          <Select
                                            value={field.type}
                                            onValueChange={(value: any) => updateField(stepIndex, sectionIndex, fieldIndex, { type: value })}
                                          >
                                            <SelectTrigger className="h-8 text-sm">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {FIELD_TYPES.map(type => (
                                                <SelectItem key={type.value} value={type.value}>
                                                  {type.label}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                          <Label className="text-xs">Placeholder</Label>
                                          <Input 
                                            value={field.placeholder || ''}
                                            onChange={(e) => updateField(stepIndex, sectionIndex, fieldIndex, { placeholder: e.target.value })}
                                            className="h-8 text-sm"
                                          />
                                        </div>
                                        <div className="col-span-1 flex items-end justify-center pb-1">
                                          <div className="flex items-center gap-1">
                                            <Switch
                                              checked={field.required}
                                              onCheckedChange={(checked) => updateField(stepIndex, sectionIndex, fieldIndex, { required: checked })}
                                            />
                                            <span className="text-xs">Req.</span>
                                          </div>
                                        </div>
                                        <div className="col-span-1 flex items-end justify-end pb-1">
                                          <Button 
                                            variant="ghost" 
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => removeField(stepIndex, sectionIndex, fieldIndex)}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Options (for checkbox_group sections) */}
                                {section.options && (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-sm font-medium">Opções</Label>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => addOption(stepIndex, sectionIndex)}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Adicionar Opção
                                      </Button>
                                    </div>
                                    
                                    {section.options.map((option, optionIndex) => (
                                      <div 
                                        key={option.key} 
                                        className="grid grid-cols-12 gap-2 items-center p-2 bg-muted/20 rounded-lg"
                                      >
                                        <div className="col-span-5">
                                          <Input 
                                            value={option.key}
                                            onChange={(e) => updateOption(stepIndex, sectionIndex, optionIndex, { key: e.target.value })}
                                            placeholder="Chave"
                                            className="h-8 text-sm"
                                          />
                                        </div>
                                        <div className="col-span-6">
                                          <Input 
                                            value={option.label}
                                            onChange={(e) => updateOption(stepIndex, sectionIndex, optionIndex, { label: e.target.value })}
                                            placeholder="Label"
                                            className="h-8 text-sm"
                                          />
                                        </div>
                                        <div className="col-span-1">
                                          <Button 
                                            variant="ghost" 
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => removeOption(stepIndex, sectionIndex, optionIndex)}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Departments (for department_contacts sections) */}
                                {section.departments && (
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">Departamentos</Label>
                                    <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                      {section.departments.map(d => d.label).join(', ')}
                                    </div>
                                  </div>
                                )}

                                {/* Credential Types (for access_credentials sections) */}
                                {section.credential_types && (
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">Tipos de Credenciais</Label>
                                    <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                      {section.credential_types.map(c => c.label).join(', ')}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </CollapsibleContent>
                          </Collapsible>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  );
}
