-- =============================================
-- 002_seed_data.sql
-- Seed data para la app Yayika
-- =============================================

-- Community Categories
INSERT INTO yayika_community_categories (name, icon, color, sort_order) VALUES
('Emprendimiento', 'rocket', '#9B72CF', 1),
('Bienestar', 'heart', '#F472B6', 2),
('Finanzas', 'wallet', '#D4A843', 3),
('Marketing', 'megaphone', '#2DD4BF', 4),
('Maternidad', 'baby', '#FB7185', 5),
('Crecimiento Personal', 'star', '#E8C96A', 6),
('Salud', 'fitness', '#6EE7B7', 7),
('Tecnología', 'laptop', '#94A3B8', 8)
ON CONFLICT DO NOTHING;

-- Weekly Challenges
INSERT INTO yayika_weekly_challenges (title, description, category, xp_reward, difficulty, is_active, week_start, week_end) VALUES
('Comparte tu progreso', 'Comparte 3 logros esta semana en la comunidad', 'social', 50, 'easy', true, CURRENT_DATE, CURRENT_DATE + 7),
('Ahorra 100 pesos', 'Registra todos tus gastos y ahorra al menos $100', 'finanzas', 100, 'medium', true, CURRENT_DATE, CURRENT_DATE + 7),
('Crea tu primer producto', 'Crea y publica tu primer producto digital', 'emprendimiento', 200, 'hard', true, CURRENT_DATE, CURRENT_DATE + 7),
('Medita 5 minutos diarios', 'Medita al menos 5 minutos cada día de la semana', 'bienestar', 75, 'easy', true, CURRENT_DATE, CURRENT_DATE + 7),
('Contacta 3 prospectos', 'Contacta a 3 posibles clientes o afiliadas', 'marketing', 150, 'medium', true, CURRENT_DATE, CURRENT_DATE + 7),
('Lee 30 minutos', 'Dedica 30 minutos a la lectura cada día', 'crecimiento', 60, 'easy', true, CURRENT_DATE, CURRENT_DATE + 7)
ON CONFLICT DO NOTHING;

-- Share Templates
INSERT INTO yayika_share_templates (name, template_data, is_active) VALUES
('Logro desbloqueado', '{"type": "achievement", "bg_color": "#9B72CF", "text_color": "#FFFFFF"}', true),
('Racha activa', '{"type": "streak", "bg_color": "#F472B6", "text_color": "#FFFFFF"}', true),
('Nivel alcanzado', '{"type": "level_up", "bg_color": "#D4A843", "text_color": "#FFFFFF"}', true),
('Reto completado', '{"type": "challenge", "bg_color": "#2DD4BF", "text_color": "#FFFFFF"}', true)
ON CONFLICT DO NOTHING;

-- Regions
INSERT INTO yayika_regions (code, name, currency) VALUES
('MX', 'México', 'MXN'),
('CO', 'Colombia', 'COP'),
('AR', 'Argentina', 'ARS'),
('CL', 'Chile', 'CLP'),
('PE', 'Perú', 'PEN')
ON CONFLICT DO NOTHING;

-- Products
INSERT INTO yayika_products (name, description, price, category, is_active) VALUES
('Kit Emprendedora Yayika', 'Guía completa para empezar tu negocio digital', 49.99, 'kits', true),
('Masterclass Marketing Digital', 'Aprende a vender en redes sociales', 29.99, 'cursos', true),
('Pack Finanzas Personales', 'Controla tu dinero y hazlo crecer', 19.99, 'cursos', true)
ON CONFLICT DO NOTHING;

-- Onboarding Days
INSERT INTO yayika_onboarding_days (day_number, title, description) VALUES
(1, 'Bienvenida', 'Conoce Yayika y configura tu perfil'),
(2, 'Tu negocio', 'Cuéntanos sobre tu emprendimiento'),
(3, 'Finanzas', 'Configura tus metas financieras'),
(4, 'Ciclo', 'Registra tu ciclo para recomendaciones personalizadas'),
(5, 'Comunidad', 'Únete a la comunidad de emprendedoras'),
(6, 'Retos', 'Descubre los retos semanales'),
(7, '¡Lista!', 'Ya estás lista para empezar')
ON CONFLICT DO NOTHING;
