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

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// --- 1. CONFIGURACIÓN DE SERVICIOS ---

// Registrar servicios


builder.Services.AddScoped<TenantService>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<ISalesService, SalesService>(); // Register SalesService
builder.Services.AddScoped<IPatientDuplicationService, PatientDuplicationService>(); // Patient duplication service
builder.Services.AddScoped<IUserAuthorizationService, UserAuthorizationService>(); // User authorization service
builder.Services.AddScoped<IReportingService, ReportingService>(); // Reporting service
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

// --- 2. SEEDING Y MIGRACIONES AUTOMÁTICAS ---
using (var scope = app.Services.CreateScope())
{
    var startupLogger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var _context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    // ✅ ESPERAR A QUE LA BASE DE DATOS ESTÉ LISTA (resiliencia ante arranques en Docker)
    var maxRetries = 10;
    var retryCount = 0;
    var dbReady = false;
    while (!dbReady && retryCount < maxRetries)
    {
        try
        {
            startupLogger.LogInformation("⏳ Verificando conexión a la base de datos (intento {Intento}/{Max})...", retryCount + 1, maxRetries);
            await _context.Database.OpenConnectionAsync();
            await _context.Database.CloseConnectionAsync();
            dbReady = true;
            startupLogger.LogInformation("✅ Conexión a la base de datos establecida.");
        }
        catch (Exception)
        {
            retryCount++;
            if (retryCount >= maxRetries)
            {
                startupLogger.LogCritical("💥 No se pudo conectar a la base de datos tras {Max} intentos. El seeding no se ejecutará.", maxRetries);
                throw;
            }
            startupLogger.LogWarning("⚠️  Base de datos no disponible. Reintentando en 3 segundos...");
            await Task.Delay(3000);
        }
    }

    // Inyectar las columnas de actualización si no existen (PostgreSQL nativo)
    try
    {
            await _context.Database.ExecuteSqlRawAsync(@"
                ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
                ALTER TABLE consultas ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
                ALTER TABLE consultas ADD COLUMN IF NOT EXISTS tipo_consulta VARCHAR(20) DEFAULT 'consulta_lentes';
                UPDATE consultas SET tipo_consulta = 'consulta_lentes' WHERE tipo_consulta IS NULL;
            ");
    }
    catch (Exception ex)
    {
        startupLogger.LogWarning(ex, "Could not run automatic migrations for modification dates.");
    }

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
            NombreEsquema = "sandbox", 
            EmailConfirmed = true 
        };
        await userManager.CreateAsync(testUser, "Password123!");
    }
    // Asegurar rol Admin
    if (!await userManager.IsInRoleAsync(testUser, "Admin"))
    {
        await userManager.AddToRoleAsync(testUser, "Admin");
    }

    // 4. Test users dynamically added for Galileo and San Gabriel
    var testUserConfigs = new[] {
        new { Email = "admin@sangabriel.com", Nombre = "Admin San Gabriel", Esquema = "sangabriel", Rol = "Admin" },
        new { Email = "vendedor@sangabriel.com", Nombre = "Vendedor San Gabriel", Esquema = "sangabriel", Rol = "Vendedor" },
        new { Email = "admin@galileo.com", Nombre = "Admin Galileo", Esquema = "galileo", Rol = "Admin" },
        new { Email = "vendedor@galileo.com", Nombre = "Vendedor Galileo", Esquema = "galileo", Rol = "Vendedor" }
    };

    foreach (var uc in testUserConfigs)
    {
        var u = await userManager.FindByEmailAsync(uc.Email);
        if (u == null)
        {
            u = new ApplicationUser { UserName = uc.Email, Email = uc.Email, NombreCompleto = uc.Nombre, NombreEsquema = uc.Esquema, EmailConfirmed = true, EstaActivo = true };
            await userManager.CreateAsync(u, "Password123!");
        }
        if (!await userManager.IsInRoleAsync(u, uc.Rol)) await userManager.AddToRoleAsync(u, uc.Rol);
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