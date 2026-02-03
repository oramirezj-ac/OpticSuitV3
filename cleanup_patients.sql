DROP TABLE IF EXISTS public."Pacientes";
DROP TABLE IF EXISTS public_test."Pacientes";
DELETE FROM "__EFMigrationsHistory" WHERE "MigrationId" LIKE '%AddPatientsTable%';
