using Microsoft.EntityFrameworkCore;
using OpticBackend.Data;
using OpticBackend.Models;
using OpticBackend.Services.Interfaces;

namespace OpticBackend.Services
{
    /// <summary>
    /// Servicio para detectar pacientes duplicados
    /// </summary>
    public class PatientDuplicationService : IPatientDuplicationService
    {
        private readonly ApplicationDbContext _context;

        public PatientDuplicationService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Busca pacientes duplicados basándose en nombre completo y/o teléfono
        /// </summary>
        public async Task<List<Patient>> FindDuplicatesAsync(
            string nombre,
            string? apellidoPaterno,
            string? apellidoMaterno,
            string? telefono,
            Guid? excludeId = null)
        {
            var query = _context.Pacientes.AsQueryable();

            // Excluir el paciente actual si se está editando
            if (excludeId.HasValue)
            {
                query = query.Where(p => p.Id != excludeId.Value);
            }

            // Normalizar valores para comparación case-insensitive
            var normalizedName = nombre.Trim().ToLower();
            var normalizedPaterno = apellidoPaterno?.Trim().ToLower();
            var normalizedMaterno = apellidoMaterno?.Trim().ToLower();
            var normalizedPhone = telefono?.Trim();

            // Buscar duplicados por:
            // 1. Nombre completo exacto (Nombre + Apellido Paterno + Apellido Materno)
            // 2. Teléfono (si se proporcionó y tiene longitud válida)
            var duplicates = await query.Where(p =>
                // Caso 1: Coincidencia de nombre completo
                (
                    p.Nombre.ToLower() == normalizedName &&
                    p.ApellidoPaterno != null && normalizedPaterno != null && p.ApellidoPaterno.ToLower() == normalizedPaterno &&
                    (
                        (p.ApellidoMaterno == null && normalizedMaterno == null) ||
                        (p.ApellidoMaterno != null && normalizedMaterno != null && p.ApellidoMaterno.ToLower() == normalizedMaterno)
                    )
                )
                ||
                // Caso 2: Coincidencia de teléfono (si tiene longitud válida)
                (normalizedPhone != null && normalizedPhone.Length > 5 && p.Telefono == normalizedPhone)
            )
            .OrderByDescending(p => p.FechaRegistro)
            .Take(10)
            .ToListAsync();

            return duplicates;
        }
    }
}
