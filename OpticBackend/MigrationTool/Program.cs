using System;
using System.Threading.Tasks;
using Dapper;
using Npgsql;

namespace MigrationTool
{
    class Program
    {
        static readonly string PostgresBaseConn = "Host=db;Port=5432;Username=postgres;Password=optic_pass;Database=opticsuit;";

        static async Task Main(string[] args)
        {
            Console.WriteLine("=================================================");
            Console.WriteLine(" INICIANDO LIMPIEZA DE NOTAS CON ERRORES ORTOGRAFICOS");
            Console.WriteLine("=================================================");

            string[] esquemas = new[] { "galileo", "sangabriel" };

            foreach (var esquema in esquemas)
            {
                Console.WriteLine($"\n[>>>] Limpiando notas duplicadas en: {esquema}...");
                string pgConnStr = $"{PostgresBaseConn}SearchPath={esquema};";

                try
                {
                    using var pgConn = new NpgsqlConnection(pgConnStr);
                    await pgConn.OpenAsync();

                    // Lógica robusta de limpieza de clones ortográficos
                    var sqlLimpieza = @"
                        -- 1. Identificar ventas clonadas y sus pacientes
                        CREATE TEMP TABLE clones AS
                        SELECT id as venta_id, paciente_id
                        FROM (
                            SELECT id, paciente_id, ROW_NUMBER() OVER (PARTITION BY folio_fisico, fecha::date ORDER BY id ASC) as rn
                            FROM ventas
                            WHERE folio_fisico IS NOT NULL AND folio_fisico != ''
                        ) t WHERE t.rn > 1;

                        -- 2. Borrar abonos y ventas clonadas
                        DELETE FROM abonos WHERE venta_id IN (SELECT venta_id FROM clones);
                        DELETE FROM ventas WHERE id IN (SELECT venta_id FROM clones);

                        -- 3. Identificar pacientes que se quedaron sin ventas (fantasmas por error ortográfico)
                        CREATE TEMP TABLE pacientes_fantasma AS
                        SELECT c.paciente_id
                        FROM clones c
                        LEFT JOIN ventas v ON c.paciente_id = v.paciente_id
                        WHERE v.id IS NULL;

                        -- 4. Borrar historial clínico de los fantasmas (graduaciones y consultas)
                        DELETE FROM graduaciones WHERE consulta_id IN (
                            SELECT id FROM consultas WHERE paciente_id IN (SELECT paciente_id FROM pacientes_fantasma)
                        ) AND id NOT IN (SELECT graduacion_id FROM detalle_ventas WHERE graduacion_id IS NOT NULL);

                        DELETE FROM consultas WHERE paciente_id IN (SELECT paciente_id FROM pacientes_fantasma)
                        AND id NOT IN (SELECT consulta_id FROM ventas WHERE consulta_id IS NOT NULL);

                        -- 5. Borrar al paciente fantasma
                        DELETE FROM pacientes WHERE id IN (SELECT paciente_id FROM pacientes_fantasma)
                        AND id NOT IN (SELECT paciente_id FROM detalle_ventas WHERE paciente_id IS NOT NULL);

                        -- Devolver contadores
                        SELECT 
                            (SELECT count(*) FROM clones) as VentasBorradas,
                            (SELECT count(*) FROM pacientes_fantasma) as PacientesBorrados;

                        DROP TABLE clones;
                        DROP TABLE pacientes_fantasma;
                    ";

                    var result = await pgConn.QuerySingleAsync<dynamic>(sqlLimpieza);
                    Console.WriteLine($"   -> Notas duplicadas borradas: {result.ventasborradas}");
                    Console.WriteLine($"   -> Pacientes fantasma borrados: {result.pacientesborrados}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[ERROR] Falló la limpieza en {esquema}: {ex.Message}");
                }
            }

            Console.WriteLine("\n=================================================");
            Console.WriteLine(" LIMPIEZA COMPLETADA - VERIFICA TUS VENTAS ");
            Console.WriteLine("=================================================");
        }
    }
}
