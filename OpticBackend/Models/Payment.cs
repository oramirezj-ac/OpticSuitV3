using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpticBackend.Models
{
    [Table("abonos")]
    public class Payment
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("venta_id")]
        public Guid? VentaId { get; set; }

        [ForeignKey("VentaId")]
        public virtual Sale? Venta { get; set; }

        [Column("monto")]
        public decimal Monto { get; set; }

        [Column("fecha_pago")]
        public DateTime? FechaPago { get; set; } = DateTime.Now;

        [Column("metodo_pago")]
        [MaxLength(50)]
        public string? MetodoPago { get; set; }

        [Column("usuario_id")]
        public string? UsuarioId { get; set; }

        [ForeignKey("UsuarioId")]
        public virtual ApplicationUser? Usuario { get; set; }
    }
}
