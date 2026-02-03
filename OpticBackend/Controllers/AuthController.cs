using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OpticBackend.Models;
using OpticBackend.Services;

namespace OpticBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly JwtService _jwtService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            JwtService jwtService,
            ILogger<AuthController> logger)
        {
            _userManager = userManager;
            _jwtService = jwtService;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<ActionResult> Login([FromBody] LoginRequest request)
        {
            _logger.LogInformation("🔐 Intento de login: {Email}", request.Email);

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                _logger.LogWarning("❌ Usuario no encontrado: {Email}", request.Email);
                return Unauthorized(new { message = "Usuario o contraseña incorrectos" });
            }

            var passwordValid = await _userManager.CheckPasswordAsync(user, request.Password);
            if (!passwordValid)
            {
                _logger.LogWarning("❌ Contraseña incorrecta para: {Email}", request.Email);
                return Unauthorized(new { message = "Usuario o contraseña incorrectos" });
            }

            // ✅ Obtener roles del usuario
            var roles = await _userManager.GetRolesAsync(user);

            // ✅ Generar JWT con tenant y roles en claims
            var token = _jwtService.GenerateToken(user.Id, user.Email!, user.NombreCompleto, user.NombreEsquema ?? "public", roles);
            
            _logger.LogInformation("✅ Login exitoso: {Email}, Schema: {Schema}, Roles: {Roles}", 
                user.Email, user.NombreEsquema, string.Join(",", roles));
            
            return Ok(new
            {
                token,
                email = user.Email,
                nombreCompleto = user.NombreCompleto,
                schema = user.NombreEsquema,
                roles = roles // Devolvemos roles al front también
            });
        }

        [HttpPost("logout")]
        [Authorize]
        public ActionResult Logout()
        {
            // Con JWT no hay sesión del lado del servidor
            // El cliente simplemente elimina el token
            return Ok(new { message = "Sesión cerrada" });
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
