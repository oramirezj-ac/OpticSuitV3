using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpticBackend.Models
{
    [Table("consultas")]
    public class Consultation
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("paciente_id")]
        public Guid PacienteId { get; set; }

        // Navigation property
        [ForeignKey("PacienteId")]
        public virtual Patient? Paciente { get; set; }

        [Column("fecha")]
        public DateTime Fecha { get; set; } = DateTime.Now;

        [Column("motivo_consulta")]
        [MaxLength(50)]
        public string? MotivoConsulta { get; set; } = "Refractiva";

        [Column("observaciones")]
        public string? Observaciones { get; set; }

        [Column("costo_servicio")]
        public decimal? CostoServicio { get; set; } = 0.00m;

        [Column("estado_financiero")]
        [MaxLength(20)]
        public string? EstadoFinanciero { get; set; } = "pendiente";

        // JSONB column will be mapped as string for now, or handled via custom conversion if needed later.
        // EF Core 8+ supports primitive collections or custom mapping. 
        // For simplicity and PostgreSQL compat without extra heavy libs, we treat as string (JSON string) or use Npgsql types if configured.
        [Column("detalles_clinicos", TypeName = "jsonb")]
        public string? DetallesClinicos { get; set; } = "{}";

        [Column("usuario_id")]
        public string? UsuarioId { get; set; }
        
        // Navigation property for User if needed
        [ForeignKey("UsuarioId")]
        public virtual ApplicationUser? Usuario { get; set; }

        // Relation to Graduations
        public virtual ICollection<Graduation>? Graduaciones { get; set; }
    }
}
