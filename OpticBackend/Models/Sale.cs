using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpticBackend.Models
{
    [Table("ventas")]
    public class Sale
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("folio_fisico")]
        [MaxLength(20)]
        public string? FolioFisico { get; set; }

        [Column("fecha")]
        public DateTime? Fecha { get; set; } = DateTime.Now;

        [Column("consulta_id")]
        public Guid? ConsultaId { get; set; }

        [ForeignKey("ConsultaId")]
        public virtual Consultation? Consulta { get; set; }

        [Column("total_venta")]
        public decimal? TotalVenta { get; set; } = 0.00m;

        [Column("saldo_pendiente")]
        public decimal? SaldoPendiente { get; set; } = 0.00m;

        [Column("estado")]
        [MaxLength(20)]
        public string? Estado { get; set; } = "Activa";

        [Column("observaciones_generales")]
        public string? ObservacionesGenerales { get; set; }

        [Column("motivo_cancelacion")]
        public string? MotivoCancelacion { get; set; }

        [Column("usuario_id")]
        public string? UsuarioId { get; set; }

        [ForeignKey("UsuarioId")]
        public virtual ApplicationUser? Usuario { get; set; }

        // Navigations
        public virtual ICollection<SaleDetail>? Detalles { get; set; }
        public virtual ICollection<Payment>? Abonos { get; set; }
        public virtual ICollection<SalesCommission>? Comisiones { get; set; }
    }
}
