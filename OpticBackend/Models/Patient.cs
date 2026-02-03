using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpticBackend.Models
{
    [Table("pacientes")]
    public class Patient
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("nombre")]
        public string Nombre { get; set; } = string.Empty;

        [Column("apellido_paterno")]
        public string? ApellidoPaterno { get; set; }

        [Column("apellido_materno")]
        public string? ApellidoMaterno { get; set; }

        [Column("fecha_nacimiento")]
        public DateOnly? FechaNacimiento { get; set; } // Modern EF Core 8+ mapping for Date

        [Column("telefono")]
        public string? Telefono { get; set; }

        // New columns to be added via Migration
        [Column("email")]
        public string? Email { get; set; }

        [Column("direccion")]
        public string? Direccion { get; set; }

        [Column("ocupacion")]
        public string? Ocupacion { get; set; }

        [Column("notas")]
        public string? Notas { get; set; }

        // Existing columns
        [Column("activo")]
        public bool EstaActivo { get; set; } = true;

        [Column("fecha_creacion")]
        public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

        [Column("metadata", TypeName = "jsonb")]
        public string? Metadata { get; set; } // Simple mapping for now
    }
}
