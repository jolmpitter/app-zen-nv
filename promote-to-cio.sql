-- Execute este SQL diretamente no Supabase Dashboard
-- Isso vai transformar o gerente atual em CIO

UPDATE "User" 
SET role = 'cio' 
WHERE email = 'gerente@polodash.com.br';

-- Verificar se funcionou
SELECT id, email, name, role, status 
FROM "User" 
WHERE email = 'gerente@polodash.com.br';
