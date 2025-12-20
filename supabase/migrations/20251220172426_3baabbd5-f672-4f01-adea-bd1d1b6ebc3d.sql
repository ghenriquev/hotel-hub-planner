-- Criar tabela para armazenar o template do formulário do manual
CREATE TABLE public.manual_form_template (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT 'Template Padrão',
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.manual_form_template ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Anyone can read active templates"
ON public.manual_form_template
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage templates"
ON public.manual_form_template
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_manual_form_template_updated_at
BEFORE UPDATE ON public.manual_form_template
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir template inicial com a estrutura atual do formulário
INSERT INTO public.manual_form_template (name, steps, is_active)
VALUES (
  'Template Padrão',
  '[
    {
      "id": 1,
      "title": "Dados Cadastrais",
      "subtitle": "Informações básicas e legais do estabelecimento",
      "sections": [
        {
          "title": "Dados Cadastrais",
          "icon": "Building2",
          "fields": [
            {"key": "foundation_year", "label": "Ano de Fundação", "type": "text", "required": false, "placeholder": "Ex: 1995"},
            {"key": "room_count", "label": "Número de UHs (Unidades Habitacionais)", "type": "text", "required": false, "placeholder": "Ex: 120"},
            {"key": "main_structure", "label": "Estrutura Principal", "type": "textarea", "required": false, "placeholder": "Descreva a estrutura principal do hotel..."}
          ]
        },
        {
          "title": "Dados Legais",
          "icon": "FileText",
          "fields": [
            {"key": "legal_name", "label": "Razão Social", "type": "text", "required": false, "placeholder": "Nome legal da empresa"},
            {"key": "cnpj", "label": "CNPJ", "type": "text", "required": false, "placeholder": "00.000.000/0000-00"}
          ]
        },
        {
          "title": "Endereço",
          "icon": "MapPin",
          "fields": [
            {"key": "address", "label": "Endereço", "type": "text", "required": false, "placeholder": "Rua, número"},
            {"key": "neighborhood", "label": "Bairro", "type": "text", "required": false, "placeholder": ""},
            {"key": "city", "label": "Cidade", "type": "text", "required": false, "placeholder": ""},
            {"key": "state", "label": "Estado", "type": "text", "required": false, "placeholder": ""},
            {"key": "zip_code", "label": "CEP", "type": "text", "required": false, "placeholder": "00000-000"}
          ]
        },
        {
          "title": "Contratante e Testemunha",
          "icon": "Users",
          "fields": [
            {"key": "contractor_name", "label": "Nome do Contratante", "type": "text", "required": false, "placeholder": ""},
            {"key": "contractor_email", "label": "E-mail do Contratante", "type": "email", "required": false, "placeholder": ""},
            {"key": "witness_name", "label": "Nome da Testemunha", "type": "text", "required": false, "placeholder": ""},
            {"key": "witness_email", "label": "E-mail da Testemunha", "type": "email", "required": false, "placeholder": ""}
          ]
        }
      ]
    },
    {
      "id": 2,
      "title": "Contatos",
      "subtitle": "Informações de contato por departamento",
      "sections": [
        {
          "title": "Contatos por Departamento",
          "icon": "Phone",
          "type": "department_contacts",
          "departments": [
            {"key": "reservas", "label": "Central de Reservas"},
            {"key": "recepcao", "label": "Recepção"},
            {"key": "governanca", "label": "Governança"},
            {"key": "eventos", "label": "Eventos"},
            {"key": "comercial", "label": "Comercial"},
            {"key": "financeiro", "label": "Financeiro"},
            {"key": "marketing", "label": "Marketing"},
            {"key": "rh", "label": "Recursos Humanos"},
            {"key": "ti", "label": "TI"},
            {"key": "gerencia", "label": "Gerência Geral"},
            {"key": "proprietario", "label": "Proprietário"}
          ]
        }
      ]
    },
    {
      "id": 3,
      "title": "Diferenciais",
      "subtitle": "Características especiais e políticas do hotel",
      "sections": [
        {
          "title": "Diferenciais do Hotel",
          "icon": "Star",
          "type": "checkbox_group",
          "field_key": "differentials",
          "options": [
            {"key": "pets", "label": "Aceita Pets"},
            {"key": "pool", "label": "Piscina"},
            {"key": "spa", "label": "SPA"},
            {"key": "gym", "label": "Academia"},
            {"key": "restaurant", "label": "Restaurante"},
            {"key": "room_service", "label": "Room Service"},
            {"key": "bar", "label": "Bar"},
            {"key": "events", "label": "Espaço para Eventos"},
            {"key": "beach", "label": "Acesso à Praia"},
            {"key": "kids_area", "label": "Área Kids"},
            {"key": "business_center", "label": "Business Center"},
            {"key": "concierge", "label": "Concierge"},
            {"key": "transfer", "label": "Transfer"},
            {"key": "laundry", "label": "Lavanderia"},
            {"key": "all_inclusive", "label": "All Inclusive"}
          ]
        },
        {
          "title": "Políticas",
          "icon": "ClipboardList",
          "type": "checkbox_group",
          "field_key": "policies",
          "options": [
            {"key": "smoking", "label": "Permite Fumar"},
            {"key": "parties", "label": "Permite Festas"},
            {"key": "visitors", "label": "Visitantes Permitidos"},
            {"key": "early_checkin", "label": "Early Check-in Disponível"},
            {"key": "late_checkout", "label": "Late Check-out Disponível"},
            {"key": "24h_reception", "label": "Recepção 24h"}
          ]
        },
        {
          "title": "Internet",
          "icon": "Wifi",
          "fields": [
            {"key": "internet_info.has_wifi", "label": "Possui Wi-Fi", "type": "checkbox", "required": false},
            {"key": "internet_info.is_free", "label": "Wi-Fi Gratuito", "type": "checkbox", "required": false},
            {"key": "internet_info.coverage", "label": "Cobertura", "type": "text", "required": false, "placeholder": "Ex: Todo o hotel"},
            {"key": "internet_info.speed", "label": "Velocidade", "type": "text", "required": false, "placeholder": "Ex: 100 Mbps"}
          ]
        }
      ]
    },
    {
      "id": 4,
      "title": "Acomodações",
      "subtitle": "Tipos de quartos e apartamentos",
      "sections": [
        {
          "title": "Tipos de Acomodações",
          "icon": "Bed",
          "type": "accommodations_list",
          "accommodation_fields": [
            {"key": "name", "label": "Nome da Categoria", "type": "text", "required": true},
            {"key": "quantity", "label": "Quantidade", "type": "number", "required": false},
            {"key": "max_guests", "label": "Máximo de Hóspedes", "type": "number", "required": false},
            {"key": "size", "label": "Tamanho (m²)", "type": "text", "required": false},
            {"key": "bed_type", "label": "Tipo de Cama", "type": "text", "required": false},
            {"key": "amenities", "label": "Comodidades", "type": "textarea", "required": false},
            {"key": "description", "label": "Descrição", "type": "textarea", "required": false}
          ]
        }
      ]
    },
    {
      "id": 5,
      "title": "Lazer e Estrutura",
      "subtitle": "Áreas de lazer, gastronomia e estacionamento",
      "sections": [
        {
          "title": "Áreas de Lazer",
          "icon": "Palmtree",
          "fields": [
            {"key": "leisure.pool_info", "label": "Informações da Piscina", "type": "textarea", "required": false, "placeholder": "Descreva as piscinas..."},
            {"key": "leisure.spa_info", "label": "Informações do SPA", "type": "textarea", "required": false, "placeholder": "Descreva o SPA..."},
            {"key": "leisure.gym_info", "label": "Informações da Academia", "type": "textarea", "required": false, "placeholder": "Descreva a academia..."},
            {"key": "leisure.kids_info", "label": "Área Kids", "type": "textarea", "required": false, "placeholder": "Descreva a área infantil..."},
            {"key": "leisure.other_leisure", "label": "Outras Áreas de Lazer", "type": "textarea", "required": false, "placeholder": "Descreva outras áreas..."}
          ]
        },
        {
          "title": "Gastronomia",
          "icon": "UtensilsCrossed",
          "fields": [
            {"key": "gastronomy.restaurant_info", "label": "Restaurantes", "type": "textarea", "required": false, "placeholder": "Descreva os restaurantes..."},
            {"key": "gastronomy.bar_info", "label": "Bares", "type": "textarea", "required": false, "placeholder": "Descreva os bares..."},
            {"key": "gastronomy.breakfast_info", "label": "Café da Manhã", "type": "textarea", "required": false, "placeholder": "Horários, tipo (buffet, à la carte)..."},
            {"key": "gastronomy.room_service_info", "label": "Room Service", "type": "textarea", "required": false, "placeholder": "Horários e cardápio..."}
          ]
        },
        {
          "title": "Estacionamento",
          "icon": "Car",
          "fields": [
            {"key": "parking.has_parking", "label": "Possui Estacionamento", "type": "checkbox", "required": false},
            {"key": "parking.is_free", "label": "Estacionamento Gratuito", "type": "checkbox", "required": false},
            {"key": "parking.is_covered", "label": "Estacionamento Coberto", "type": "checkbox", "required": false},
            {"key": "parking.valet", "label": "Serviço de Manobrista", "type": "checkbox", "required": false},
            {"key": "parking.capacity", "label": "Capacidade", "type": "text", "required": false, "placeholder": "Ex: 50 vagas"},
            {"key": "parking.price", "label": "Valor (se cobrado)", "type": "text", "required": false, "placeholder": "Ex: R$ 30/dia"}
          ]
        }
      ]
    },
    {
      "id": 6,
      "title": "Marketing",
      "subtitle": "Redes sociais e materiais de divulgação",
      "sections": [
        {
          "title": "Redes Sociais",
          "icon": "Share2",
          "fields": [
            {"key": "other_social_media", "label": "Outras Redes Sociais", "type": "textarea", "required": false, "placeholder": "Links de outras redes sociais..."}
          ]
        },
        {
          "title": "Materiais de Mídia",
          "icon": "Image",
          "fields": [
            {"key": "site_info.has_logo", "label": "Possui Logo em Alta Resolução", "type": "checkbox", "required": false},
            {"key": "site_info.has_photos", "label": "Possui Fotos Profissionais", "type": "checkbox", "required": false},
            {"key": "site_info.has_videos", "label": "Possui Vídeos Institucionais", "type": "checkbox", "required": false},
            {"key": "site_info.brand_colors", "label": "Cores da Marca", "type": "text", "required": false, "placeholder": "Ex: Azul marinho, dourado"},
            {"key": "site_info.tagline", "label": "Tagline/Slogan", "type": "text", "required": false, "placeholder": ""}
          ]
        },
        {
          "title": "Publicidade",
          "icon": "Megaphone",
          "fields": [
            {"key": "ads_marketing.google_ads", "label": "Utiliza Google Ads", "type": "checkbox", "required": false},
            {"key": "ads_marketing.meta_ads", "label": "Utiliza Meta Ads (Facebook/Instagram)", "type": "checkbox", "required": false},
            {"key": "ads_marketing.other_platforms", "label": "Outras Plataformas", "type": "textarea", "required": false, "placeholder": "Liste outras plataformas de anúncio..."}
          ]
        }
      ]
    },
    {
      "id": 7,
      "title": "Acessos",
      "subtitle": "Credenciais e informações de acesso aos sistemas",
      "sections": [
        {
          "title": "Credenciais de Acesso",
          "icon": "Key",
          "type": "access_credentials",
          "credential_types": [
            {"key": "pms", "label": "Sistema PMS", "fields": ["url", "username", "password", "notes"]},
            {"key": "channel_manager", "label": "Channel Manager", "fields": ["url", "username", "password", "notes"]},
            {"key": "booking_engine", "label": "Motor de Reservas", "fields": ["url", "username", "password", "notes"]},
            {"key": "google_analytics", "label": "Google Analytics", "fields": ["url", "username", "password", "notes"]},
            {"key": "social_media", "label": "Redes Sociais", "fields": ["url", "username", "password", "notes"]},
            {"key": "website_admin", "label": "Admin do Site", "fields": ["url", "username", "password", "notes"]},
            {"key": "other", "label": "Outros Sistemas", "fields": ["url", "username", "password", "notes"]}
          ]
        }
      ]
    }
  ]'::jsonb,
  true
);