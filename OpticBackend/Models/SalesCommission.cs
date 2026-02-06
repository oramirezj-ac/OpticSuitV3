using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpticBackend.Models
{
    [Table("comisiones_ventas")]
    public class SalesCommission
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("venta_id")]
        public Guid VentaId { get; set; }

        [ForeignKey("VentaId")]
        public virtual Sale? Venta { get; set; }

        [Column("usuario_id")]
        public string UsuarioId { get; set; }

        // Note: UsuarioId is string in SQL 'text' referencing AspNetUsers String Id from identity? 
        // Or Guid? IdentityUser uses string by default but our AppUser might use Guid. 
        // User SQL says: REFERENCES public."AspNetUsers"("Id"). AspNetUsers Id is usually string/text.
        
        [ForeignKey("UsuarioId")]
        public virtual ApplicationUser? Usuario { get; set; }

        [Column("monto_comision")]
        public decimal MontoComision { get; set; }

        [Column("puntos_venta")]
        public decimal PuntosVenta { get; set; }

        [Column("fecha_registro")]
        public DateTime? FechaRegistro { get; set; } = DateTime.Now;
    }
}
