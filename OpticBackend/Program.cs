using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpticBackend.Data;
using OpticBackend.Models;
using OpticBackend.Services;
using OpticBackend.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using OpticBackend.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// --- 1. CONFIGURACIÓN DE SERVICIOS ---

// Registrar servicios


builder.Services.AddScoped<TenantService>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<ISalesService, SalesService>(); // Register SalesService
builder.Services.AddScoped<IPatientDuplicationService, PatientDuplicationService>(); // Patient duplication service
builder.Services.AddScoped<IUserAuthorizationService, UserAuthorizationService>(); // User authorization service
builder.Services.AddHttpContextAccessor(); // ✅ Necesario para TenantInterceptor

builder.Services.AddDbContext<ApplicationDbContext>((serviceProvider, options) =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseNpgsql(connectionString);
    
    var httpContextAccessor = serviceProvider.GetRequiredService<IHttpContextAccessor>();
    var logger = serviceProvider.GetRequiredService<ILogger<TenantInterceptor>>();
    options.AddInterceptors(new TenantInterceptor(httpContextAccessor, logger));
});

// Identity sin endpoints de API (usaremos nuestro propio AuthController)
builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// ✅ JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var key = Encoding.UTF8.GetBytes(
        builder.Configuration["Jwt:Key"] ?? "OpticSuitV3-SecretKey-ChangeInProduction-MinLength32Characters");
    
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "OpticSuitV3",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "OpticSuitV3",
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});

builder.Services.AddAuthorization();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://optica-v3.local", "http://srv-optica-v3.local")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddOpenApi();

var app = builder.Build();

// --- 2. SEEDING (USUARIOS y ROLES MAESTROS) ---
using (var scope = app.Services.CreateScope())
{
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    
    // 1. Crear Roles si no existen
    string[] roles = { "Root", "Admin", "Vendedor" };
    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole(role));
        }
    }
    
    // 2. Usuario Root (Global) - schema public
    var adminEmail = "admin@opticsuit.com"; 
    var rootUser = await userManager.FindByEmailAsync(adminEmail);
    if (rootUser == null)
    {
        rootUser = new ApplicationUser 
        { 
            UserName = adminEmail, 
            Email = adminEmail, 
            NombreCompleto = "Administrador Maestro",
            NombreEsquema = "public", 
            EmailConfirmed = true 
        };
        await userManager.CreateAsync(rootUser, "Password123!");
    }
    // Asegurar rol Root
    if (!await userManager.IsInRoleAsync(rootUser, "Root"))
    {
        await userManager.AddToRoleAsync(rootUser, "Root");
    }
    
    // 3. Usuario Test (Admin de Óptica) - schema public_test
    var testEmail = "test@opticsuit.com";
    var testUser = await userManager.FindByEmailAsync(testEmail);
    if (testUser == null)
    {
        testUser = new ApplicationUser 
        { 
            UserName = testEmail, 
            Email = testEmail, 
            NombreCompleto = "Usuario de Prueba",
            NombreEsquema = "public_test", 
            EmailConfirmed = true 
        };
        await userManager.CreateAsync(testUser, "Password123!");
    }
    // Asegurar rol Admin
    if (!await userManager.IsInRoleAsync(testUser, "Admin"))
    {
        await userManager.AddToRoleAsync(testUser, "Admin");
    }
}

// --- 3. MIDDLEWARES (EL ORDEN ES LEY) ---

app.UseCors("AllowFrontend"); 

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// 1. Autenticación (¿Quién eres?)
app.UseAuthentication();
// 2. Autorización (¿Tienes permiso?)
app.UseAuthorization();

// 3. TU MIDDLEWARE (Ahora que sé quién eres, busco tu esquema)
app.UseMiddleware<TenantMiddleware>();

app.MapControllers();

app.Run();