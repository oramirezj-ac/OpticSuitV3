using Microsoft.EntityFrameworkCore;
using OpticBackend.Data;
using OpticBackend.Models;
using OpticBackend.Services.Interfaces;
using System.Text.RegularExpressions;

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

            var patternNombre = BuildAccentInsensitiveRegex(nombre.Trim());
            var patternPaterno = string.IsNullOrWhiteSpace(apellidoPaterno) ? null : BuildAccentInsensitiveRegex(apellidoPaterno.Trim());
            var patternMaterno = string.IsNullOrWhiteSpace(apellidoMaterno) ? null : BuildAccentInsensitiveRegex(apellidoMaterno.Trim());
            var normalizedPhone = telefono?.Trim();

            // Buscar duplicados por:
            // 1. Nombre completo similar (ignorando acentos y mayúsculas, y flexibilizando los apellidos)
            // 2. Teléfono (si se proporcionó y tiene longitud válida)
            var duplicates = await query.Where(p =>
                // Caso 1: Coincidencia de nombre completo similar
                (
                    Regex.IsMatch(p.Nombre, patternNombre, RegexOptions.IgnoreCase) &&
                    (
                        patternPaterno == null || 
                        p.ApellidoPaterno == null || p.ApellidoPaterno == "" ||
                        Regex.IsMatch(p.ApellidoPaterno, patternPaterno, RegexOptions.IgnoreCase)
                    ) &&
                    (
                        patternMaterno == null || 
                        p.ApellidoMaterno == null || p.ApellidoMaterno == "" ||
                        Regex.IsMatch(p.ApellidoMaterno, patternMaterno, RegexOptions.IgnoreCase)
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

        private string BuildAccentInsensitiveRegex(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;

            // Escape special regex characters in the input
            string escapedInput = Regex.Escape(input);
            
            // Remove backslashes before spaces so PostgreSQL doesn't get confused
            escapedInput = escapedInput.Replace("\\ ", " ");

            // Replace vowels (both accented and unaccented) with regex groups
            escapedInput = Regex.Replace(escapedInput, "[aáäAÁÄ]", "[aáäAÁÄ]");
            escapedInput = Regex.Replace(escapedInput, "[eéëEÉË]", "[eéëEÉË]");
            escapedInput = Regex.Replace(escapedInput, "[iíïIÍÏ]", "[iíïIÍÏ]");
            escapedInput = Regex.Replace(escapedInput, "[oóöOÓÖ]", "[oóöOÓÖ]");
            escapedInput = Regex.Replace(escapedInput, "[uúüUÚÜ]", "[uúüUÚÜ]");

            // Allow optional trailing/leading spaces gracefully
            return "^\\s*" + escapedInput + "\\s*$";
        }
    }
}
