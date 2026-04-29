using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Dapper;
using MySqlConnector;
using Npgsql;

namespace MigrationTool
{
    class Program
    {
        static readonly string MariaDbBaseConn = "Server=host.docker.internal;Port=3306;User ID=root;Password=omar;Allow User Variables=True;";
        static readonly string PostgresBaseConn = "Host=db;Port=5432;Username=postgres;Password=optic_pass;Database=opticsuit;";

        static async Task Main(string[] args)
        {
            Console.WriteLine("=================================================");
            Console.WriteLine(" RESTAURANDO VENTAS ELIMINADAS POR ERROR DE FOLIO");
            Console.WriteLine("=================================================");

            var configuraciones = new[]
            {
                new { MariaDB = "db_galileo_v2", Schema = "galileo" },
                new { MariaDB = "db_san_gabriel_v2", Schema = "sangabriel" }
            };

            foreach (var config in configuraciones)
            {
                Console.WriteLine($"\n[>>>] Restaurando en esquema: {config.Schema} desde {config.MariaDB}...");
                string mariaConnStr = $"{MariaDbBaseConn}Database={config.MariaDB};";
                string pgConnStr = $"{PostgresBaseConn}SearchPath={config.Schema};";

                try
                {
                    using var mariaConn = new MySqlConnection(mariaConnStr);
                    using var pgConn = new NpgsqlConnection(pgConnStr);

                    await mariaConn.OpenAsync();
                    await pgConn.OpenAsync();

                    // 1. Construir mapa de pacientes
                    var pgPacientes = await pgConn.QueryAsync<dynamic>("SELECT id, nombre, apellido_paterno FROM pacientes");
                    var pgPacMap = new Dictionary<string, Guid>();
                    foreach (var p in pgPacientes)
                    {
                        string key = $"{p.nombre?.ToString().Trim()}_{p.apellido_paterno?.ToString().Trim()}".ToLower();
                        pgPacMap[key] = p.id;
                    }

                    var mariaPacientes = await mariaConn.QueryAsync<dynamic>("SELECT id, nombre, apellido_paterno FROM pacientes");
                    var mariaToPgMap = new Dictionary<int, Guid>();
                    foreach (var mp in mariaPacientes)
                    {
                        string key = $"{mp.nombre?.ToString().Trim()}_{mp.apellido_paterno?.ToString().Trim()}".ToLower();
                        if (pgPacMap.TryGetValue(key, out Guid pgId))
                        {
                            mariaToPgMap[mp.id] = pgId;
                        }
                    }

                    // 2. Restaurar Ventas faltantes
                    var ventasV2 = await mariaConn.QueryAsync<dynamic>("SELECT * FROM ventas");
                    int restauradas = 0;

                    foreach (var v in ventasV2)
                    {
                        Guid pId = v.id_paciente != null && mariaToPgMap.ContainsKey(v.id_paciente) ? mariaToPgMap[v.id_paciente] : Guid.Empty;
                        if (pId == Guid.Empty) continue;

                        string folio = $"{v.numero_nota}{v.numero_nota_sufijo}";

                        // Buscar si la venta EXACTA (folio + paciente) existe
                        var existe = await pgConn.QueryFirstOrDefaultAsync<Guid?>(
                            "SELECT id FROM ventas WHERE folio_fisico = @Folio AND paciente_id = @Pid LIMIT 1",
                            new { Folio = folio, Pid = pId }
                        );

                        if (!existe.HasValue)
                        {
                            // RESTAURAR VENTA
                            Guid nuevaVentaId = Guid.NewGuid();
                            await pgConn.ExecuteAsync(@"INSERT INTO ventas (id, paciente_id, folio_fisico, fecha, total_venta, estado, observaciones_generales) 
                                VALUES (@Id, @Pid, @Fol, @Fech, @Tot, @Est, @Not)",
                                new { Id = nuevaVentaId, Pid = pId, Fol = folio, Fech = (DateTime)v.fecha_venta, Tot = (decimal)v.costo_total, Est = v.estado_pago?.ToString().ToLower(), Not = v.observaciones_venta?.ToString() ?? "" });
                            
                            // RESTAURAR ABONOS DE ESA VENTA
                            var abonos = await mariaConn.QueryAsync<dynamic>("SELECT * FROM abonos WHERE id_venta = @Id", new { Id = v.id_venta });
                            foreach (var a in abonos)
                            {
                                await pgConn.ExecuteAsync(@"INSERT INTO abonos (id, venta_id, monto, metodo_pago, fecha_pago) 
                                    VALUES (@Id, @Vid, @Mon, @Met, @Fech)",
                                    new { Id = Guid.NewGuid(), Vid = nuevaVentaId, Mon = (decimal)a.monto, Met = a.metodo_pago?.ToString() ?? "Efectivo", Fech = (DateTime)(a.fecha ?? DateTime.UtcNow) });
                            }
                            restauradas++;
                        }
                    }
                    Console.WriteLine($"   -> Ventas restauradas correctamente: {restauradas}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[ERROR] Falló la restauración en {config.Schema}: {ex.Message}");
                }
            }

            Console.WriteLine("\n=================================================");
            Console.WriteLine(" RESTAURACION COMPLETADA ");
            Console.WriteLine("=================================================");
        }
    }
}
