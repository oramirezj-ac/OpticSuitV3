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
    var services = scope.ServiceProvider;
    var startupLogger = services.GetRequiredService<ILogger<Program>>();
    var context = services.GetRequiredService<ApplicationDbContext>();

    try
    {
        // ✅ Asegurar disponibilidad de la DB y aplicar cambios estructurales manuales
        await EnsureDatabaseReadyAsync(context, startupLogger);
        await ExecuteManualSchemaChangesAsync(context, startupLogger);

        // ✅ Seeding de usuarios y roles
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        await SeedDataAsync(userManager, roleManager, startupLogger);
    }
    catch (Exception ex)
    {
        startupLogger.LogCritical(ex, "Ocurrió un error fatal durante el inicio de la aplicación.");
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

// --- 4. HELPERS DE INICIO (ENCAPSULACIÓN) ---

async Task EnsureDatabaseReadyAsync(ApplicationDbContext context, ILogger logger)
{
    var maxRetries = 10;
    var retryCount = 0;
    while (retryCount < maxRetries)
    {
        try
        {
            logger.LogInformation("⏳ Verificando conexión a la base de datos (intento {Intento}/{Max})...", retryCount + 1, maxRetries);
            await context.Database.OpenConnectionAsync();
            await context.Database.CloseConnectionAsync();
            logger.LogInformation("✅ Conexión a la base de datos establecida.");
            return;
        }
        catch (Exception)
        {
            retryCount++;
            if (retryCount >= maxRetries) throw;
            logger.LogWarning("⚠️  Base de datos no disponible. Reintentando en 3 segundos...");
            await Task.Delay(3000);
        }
    }
}

async Task ExecuteManualSchemaChangesAsync(ApplicationDbContext context, ILogger logger)
{
    try
    {
        logger.LogInformation("🛠️ Ejecutando migraciones de esquema manuales...");
        await context.Database.ExecuteSqlRawAsync(@"
            DO $$
            DECLARE
                schema_record RECORD;
                table_exists BOOLEAN;
            BEGIN
                FOR schema_record IN 
                    SELECT schema_name 
                    FROM information_schema.schemata 
                    WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast') 
                      AND schema_name NOT LIKE 'pg_temp_%' 
                      AND schema_name NOT LIKE 'pg_toast_temp_%'
                LOOP
                    -- Agregamos paciente_id a ventas
                    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = schema_record.schema_name AND table_name = 'ventas') INTO table_exists;
                    IF table_exists THEN
                        EXECUTE format('ALTER TABLE %I.ventas ADD COLUMN IF NOT EXISTS paciente_id UUID;', schema_record.schema_name);
                    END IF;
                    
                    -- Agregamos fecha_actualizacion a pacientes
                    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = schema_record.schema_name AND table_name = 'pacientes') INTO table_exists;
                    IF table_exists THEN
                        EXECUTE format('ALTER TABLE %I.pacientes ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;', schema_record.schema_name);
                    END IF;

                    -- Modificaciones a consultas
                    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = schema_record.schema_name AND table_name = 'consultas') INTO table_exists;
                    IF table_exists THEN
                        EXECUTE format('ALTER TABLE %I.consultas ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;', schema_record.schema_name);
                        EXECUTE format('ALTER TABLE %I.consultas ADD COLUMN IF NOT EXISTS tipo_consulta VARCHAR(20) DEFAULT ''consulta_lentes'';', schema_record.schema_name);
                        EXECUTE format('UPDATE %I.consultas SET tipo_consulta = ''consulta_lentes'' WHERE tipo_consulta IS NULL;', schema_record.schema_name);
                    END IF;
                END LOOP;
            END;
            $$;
        ");
        logger.LogInformation("✅ Migraciones de esquema manuales completadas.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "⚠️ No se pudieron ejecutar todas las migraciones manuales.");
    }
}

async Task SeedDataAsync(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, ILogger logger)
{
    logger.LogInformation("🌱 Iniciando seeding de datos...");

    // 1. Roles
    string[] roles = { "Root", "Admin", "Vendedor" };
    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role)) await roleManager.CreateAsync(new IdentityRole(role));
    }

    // 2. Usuarios Base
    var seeds = new[] {
        new { Email = "admin@opticsuit.com", Nombre = "Admin Maestro", Esquema = "public", Rol = "Root" },
        new { Email = "test@opticsuit.com", Nombre = "Usuario de Prueba", Esquema = "sandbox", Rol = "Admin" },
        new { Email = "admin@sangabriel.com", Nombre = "Admin San Gabriel", Esquema = "sangabriel", Rol = "Admin" },
        new { Email = "vendedor@sangabriel.com", Nombre = "Vendedor San Gabriel", Esquema = "sangabriel", Rol = "Vendedor" },
        new { Email = "admin@galileo.com", Nombre = "Admin Galileo", Esquema = "galileo", Rol = "Admin" },
        new { Email = "vendedor@galileo.com", Nombre = "Vendedor Galileo", Esquema = "galileo", Rol = "Vendedor" }
    };

    foreach (var s in seeds)
    {
        var user = await userManager.FindByEmailAsync(s.Email);
        if (user == null)
        {
            user = new ApplicationUser { 
                UserName = s.Email, Email = s.Email, NombreCompleto = s.Nombre, 
                NombreEsquema = s.Esquema, EmailConfirmed = true, EstaActivo = true 
            };
            await userManager.CreateAsync(user, "Password123!");
        }
        if (!await userManager.IsInRoleAsync(user, s.Rol)) await userManager.AddToRoleAsync(user, s.Rol);
    }
    
    logger.LogInformation("✅ Seeding completado.");
}