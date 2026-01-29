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

            // ✅ Generar JWT con tenant en claims
            var token = _jwtService.GenerateToken(user.Email!, user.NombreCompleto, user.NombreEsquema ?? "public");
            
            _logger.LogInformation("✅ Login exitoso: {Email}, Schema: {Schema}", user.Email, user.NombreEsquema);
            
            return Ok(new
            {
                token,
                email = user.Email,
                nombreCompleto = user.NombreCompleto,
                schema = user.NombreEsquema
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
