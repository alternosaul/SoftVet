-- FIX: Asignar datos existentes a tu usuario
-- Si ves datos en Supabase Table Editor pero NO en la app, ejecuta este script.
--
-- PASOS:
-- 1. Inicia sesión en la app
-- 2. Ve a Settings → Data y copia tu "User ID" (UUID)
-- 3. Reemplaza TODAS las apariciones de 'TU_USER_ID_AQUI' con ese UUID
-- 4. Ejecuta este script en Supabase SQL Editor

-- Asignar todos los datos a tu usuario (reemplaza TU_USER_ID_AQUI)
UPDATE clients SET user_id = 'TU_USER_ID_AQUI'::uuid;
UPDATE pets SET user_id = 'TU_USER_ID_AQUI'::uuid;
UPDATE appointments SET user_id = 'TU_USER_ID_AQUI'::uuid;
UPDATE settings SET user_id = 'TU_USER_ID_AQUI'::uuid;

-- Si ejecutaste la migración 002:
UPDATE inventory SET user_id = 'TU_USER_ID_AQUI'::uuid;
UPDATE sale_items SET user_id = 'TU_USER_ID_AQUI'::uuid;

-- Si ejecutaste la migración 003:
UPDATE medical_records SET user_id = 'TU_USER_ID_AQUI'::uuid;
UPDATE vaccines SET user_id = 'TU_USER_ID_AQUI'::uuid;
