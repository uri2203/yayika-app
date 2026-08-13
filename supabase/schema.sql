-- ========================================
-- Yayika App - Supabase Schema
-- ========================================

-- Tabla de tokens push para notificaciones
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para push_tokens
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_platform ON push_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_tokens(is_active);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  image_url TEXT,
  category TEXT,
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para products
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Tabla de cursos
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  instructor TEXT,
  duration_hours DECIMAL(5,2),
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  image_url TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para courses
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);

-- Habilitar RLS en todas las tablas
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para push_tokens (solo usuario autenticado)
CREATE POLICY "Users can view own push tokens" ON push_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push tokens" ON push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push tokens" ON push_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push tokens" ON push_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para products (lectura pública, escritura solo admin)
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (is_active = true);

-- Políticas RLS para courses (lectura pública, escritura solo admin)
CREATE POLICY "Anyone can view active courses" ON courses
  FOR SELECT USING (is_active = true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_push_tokens_updated_at BEFORE UPDATE ON push_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Datos de ejemplo (opcional - para testing)
-- ========================================

-- Productos de ejemplo
INSERT INTO products (name, description, price, category, stock) VALUES
  ('Kit Esencial Yayika', 'Kit completo para empezar tu negocio', 49.99, 'kits', 100),
  ('Guía de Emprendimiento', 'Paso a paso para lanzar tu negocio', 19.99, 'guías', 200),
  ('Pack de Marketing Digital', 'Herramientas y estrategias', 29.99, 'marketing', 150);

-- Cursos de ejemplo
INSERT INTO courses (title, description, instructor, duration_hours, price, category) VALUES
  ('Emprendimiento 101', 'Fundamentos para empezar tu negocio', 'Laura', 8.5, 39.99, 'negocios'),
  ('Marketing para Redes Sociales', 'Estrategias efectivas en Instagram y TikTok', 'Experto Digital', 6.0, 29.99, 'marketing'),
  ('Finanzas Personales', 'Administra tu dinero y crece tu patrimonio', 'Asesor Financiero', 4.5, 24.99, 'finanzas');
