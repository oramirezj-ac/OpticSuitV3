DROP TABLE IF EXISTS public."Pacientes";
DROP TABLE IF EXISTS sandbox."Pacientes";
DELETE FROM "__EFMigrationsHistory" WHERE "MigrationId" LIKE '%AddPatientsTable%';
