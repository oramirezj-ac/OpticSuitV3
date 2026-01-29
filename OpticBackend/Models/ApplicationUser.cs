using Microsoft.AspNetCore.Identity;

namespace OpticBackend.Models;

public class ApplicationUser : IdentityUser
{
    // Propiedad vital para el Multi-tenant
    public string? NombreEsquema { get; set; }
    // Extendemos el usuario con campos que necesitas para la óptica
    public string NombreCompleto { get; set; } = string.Empty;
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public bool EstaActivo { get; set; } = true;
}