using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpticBackend.Models
{
    [Table("configuracion_sistema")]
    public class ConfiguracionSistema
    {
        [Key]
        [Column("id")] // <--- Esto le dice que busque "id" en minúscula
        public Guid Id { get; set; }

        [Required]
        [Column("nombre_optica")]
        public string NombreOptica { get; set; } = "Óptica Galileo";

        [Column("eslogan")]
        public string? Eslogan { get; set; }

        [Column("logo_url")]
        public string? LogoUrl { get; set; }

        [Column("color_primario")]
        public string ColorPrimario { get; set; } = "#007bff";

        [Column("color_secundario")]
        public string ColorSecundario { get; set; } = "#6c757d";

        [Column("color_acento")]
        public string ColorAcento { get; set; } = "#28a745";

        [Column("color_texto_base")]
        public string ColorTextoBase { get; set; } = "#212529";

        [Column("direccion")]
        public string? Direccion { get; set; }

        [Column("telefono")]
        public string? Telefono { get; set; }

        [Column("email_contacto")]
        public string? EmailContacto { get; set; }

        [Column("ultima_actualizacion")]
        public DateTime UltimaActualizacion { get; set; } = DateTime.UtcNow;
    }
}