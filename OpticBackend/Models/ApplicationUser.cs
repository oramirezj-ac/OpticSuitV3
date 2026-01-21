using Microsoft.AspNetCore.Identity;

namespace OpticBackend.Models;

public class ApplicationUser : IdentityUser
{
    // Extendemos el usuario con campos que necesitas para la óptica
    public string NombreCompleto { get; set; } = string.Empty;
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public bool EstaActivo { get; set; } = true;
}