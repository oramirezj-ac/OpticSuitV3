using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpticBackend.Models
{
    [Table("detalle_ventas")]
    public class SaleDetail
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("venta_id")]
        public Guid VentaId { get; set; }

        [ForeignKey("VentaId")]
        public virtual Sale? Venta { get; set; }

        [Column("paciente_id")]
        public Guid? PacienteId { get; set; }
        
        [ForeignKey("PacienteId")]
        public virtual Patient? Paciente { get; set; }

        [Column("graduacion_id")]
        public Guid? GraduacionId { get; set; }

        [ForeignKey("GraduacionId")]
        public virtual Graduation? Graduacion { get; set; }

        [Column("dp_od")]
        public decimal? DpOd { get; set; }

        [Column("dp_oi")]
        public decimal? DpOi { get; set; }

        // Optional: altura_oblea not in create sql but usually needed? 
        // User provided sql: altura_oblea numeric(4, 1)
        [Column("altura_oblea")]
        public decimal? AlturaOblea { get; set; }

        [Column("catalogo_id")]
        public Guid? CatalogoId { get; set; }
        
        // Assuming CatalogoPrecios model exists or will exist later. For now just ID.
        // [ForeignKey("CatalogoId")]
        // public virtual Product? Producto { get; set; }

        [Column("descripcion_manual")]
        public string? DescripcionManual { get; set; }

        [Column("precio_aplicado")]
        public decimal? PrecioAplicado { get; set; }
    }
}
