using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpticBackend.Dtos.Sales;
using OpticBackend.Models;
using OpticBackend.Services.Interfaces;

namespace OpticBackend.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class SalesController : ControllerBase
    {
        private readonly ISalesService _salesService;
        private readonly ILogger<SalesController> _logger;

        public SalesController(ISalesService salesService, ILogger<SalesController> logger)
        {
            _salesService = salesService;
            _logger = logger;
        }

        // POST: api/sales
        [HttpPost]
        public async Task<ActionResult<Sale>> CreateSale(CreateSaleDto model)
        {
            try
            {
                var sale = await _salesService.CreateSaleAsync(model);
                return CreatedAtAction(nameof(GetSale), new { id = sale.Id }, sale);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating sale");
                // Note: Detailed error messages should be avoided in production for security, 
                // but kept here as requested for debugging context
                return StatusCode(500, new { message = $"Error al crear la venta: {ex.Message} {ex.InnerException?.Message ?? ""}" });
            }
        }

        // GET: api/sales/patient/{patientId}
        [HttpGet("patient/{patientId}")]
        public async Task<ActionResult<IEnumerable<Sale>>> GetSalesByPatient(Guid patientId)
        {
            var sales = await _salesService.GetSalesByPatientAsync(patientId);
            return Ok(sales);
        }

        // GET: api/sales/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Sale>> GetSale(Guid id)
        {
            var sale = await _salesService.GetSaleByIdAsync(id);

            if (sale == null) return NotFound();

            return Ok(sale);
        }
    }
}
