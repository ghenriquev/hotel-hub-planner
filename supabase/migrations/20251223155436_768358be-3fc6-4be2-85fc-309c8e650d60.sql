-- Habilitar extensão unaccent para remover acentos
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Adicionar coluna slug única na tabela hotels
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Criar índice para busca rápida por slug
CREATE INDEX IF NOT EXISTS idx_hotels_slug ON hotels(slug);

-- Criar função para gerar slugs
CREATE OR REPLACE FUNCTION generate_hotel_slug(hotel_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        unaccent(hotel_name),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar função de trigger para gerar slug automaticamente
CREATE OR REPLACE FUNCTION trigger_generate_hotel_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Gerar slug base a partir do nome
  base_slug := generate_hotel_slug(NEW.name);
  new_slug := base_slug;
  
  -- Se slug já foi definido manualmente, não alterar
  IF NEW.slug IS NOT NULL AND TG_OP = 'UPDATE' AND OLD.slug IS NOT NULL THEN
    -- Só regerar se o nome mudou
    IF OLD.name = NEW.name THEN
      RETURN NEW;
    END IF;
  END IF;
  
  -- Verificar se slug já existe e adicionar sufixo se necessário
  WHILE EXISTS (SELECT 1 FROM hotels WHERE slug = new_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := new_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para gerar slug automaticamente
DROP TRIGGER IF EXISTS generate_hotel_slug_trigger ON hotels;
CREATE TRIGGER generate_hotel_slug_trigger
BEFORE INSERT OR UPDATE ON hotels
FOR EACH ROW
EXECUTE FUNCTION trigger_generate_hotel_slug();

-- Atualizar slugs dos hotéis existentes
UPDATE hotels SET slug = generate_hotel_slug(name) WHERE slug IS NULL;

-- Adicionar políticas RLS para acesso público (anon)
CREATE POLICY "Public can view hotels by slug"
ON hotels FOR SELECT
TO anon
USING (true);

CREATE POLICY "Public can view agent results"
ON agent_results FOR SELECT
TO anon
USING (true);

CREATE POLICY "Public can view hotel materials"
ON hotel_materials FOR SELECT
TO anon
USING (true);