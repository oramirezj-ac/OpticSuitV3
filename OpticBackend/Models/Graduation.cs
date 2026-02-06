using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpticBackend.Models
{
    [Table("graduaciones")]
    public class Graduation
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("consulta_id")]
        public Guid ConsultaId { get; set; }

        [ForeignKey("ConsultaId")]
        public virtual Consultation? Consulta { get; set; }

        [Column("tipo_graduacion")]
        [MaxLength(30)]
        public string? TipoGraduacion { get; set; } // 'Final', 'AutoRef', 'Lensometria', etc.

        // Ojo Derecho
        [Column("od_esfera")]
        public decimal? OdEsfera { get; set; }
        
        [Column("od_cilindro")]
        public decimal? OdCilindro { get; set; }
        
        [Column("od_eje")]
        public int? OdEje { get; set; }
        
        [Column("od_adicion")]
        public decimal? OdAdicion { get; set; }

        // Ojo Izquierdo
        [Column("oi_esfera")]
        public decimal? OiEsfera { get; set; }
        
        [Column("oi_cilindro")]
        public decimal? OiCilindro { get; set; }
        
        [Column("oi_eje")]
        public int? OiEje { get; set; }
        
        [Column("oi_adicion")]
        public decimal? OiAdicion { get; set; }

        [Column("detalles_montaje", TypeName = "jsonb")]
        public string? DetallesMontaje { get; set; } = "{}";
    }
}
