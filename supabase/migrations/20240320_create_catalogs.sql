-- Tabela de Catálogos
CREATE TABLE public.catalogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Tintas
CREATE TABLE public.paints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  catalog_id UUID REFERENCES public.catalogs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  hex TEXT NOT NULL,
  rgb TEXT,
  cmyk TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paints ENABLE ROW LEVEL SECURITY;

-- Políticas para Catálogos
CREATE POLICY "Public read access for catalogs" ON public.catalogs FOR SELECT USING (true);
CREATE POLICY "Users can manage their own catalogs" ON public.catalogs 
  FOR ALL TO authenticated USING (auth.uid() = company_id);

-- Políticas para Tintas
CREATE POLICY "Public read access for paints" ON public.paints FOR SELECT USING (true);
CREATE POLICY "Users can manage their own paints" ON public.paints 
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.catalogs 
      WHERE catalogs.id = paints.catalog_id AND catalogs.company_id = auth.uid()
    )
  );