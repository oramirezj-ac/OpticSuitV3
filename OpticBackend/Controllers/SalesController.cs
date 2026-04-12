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

        // GET: api/sales/recent
        [HttpGet("recent")]
        public async Task<ActionResult<IEnumerable<Sale>>> GetRecentSales([FromQuery] int count = 20)
        {
            var sales = await _salesService.GetRecentSalesAsync(count);
            return Ok(sales);
        }

        // GET: api/sales/search
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<Sale>>> SearchSales([FromQuery] string folio)
        {
            var sales = await _salesService.SearchSalesByFolioAsync(folio);
            return Ok(sales);
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

        // PUT: api/sales/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<Sale>> UpdateSale(Guid id, UpdateSaleDto model)
        {
            try
            {
                var sale = await _salesService.UpdateSaleAsync(id, model);

                if (sale == null) return NotFound();

                return Ok(sale);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating sale");
                return StatusCode(500, new { message = $"Error al actualizar la venta: {ex.Message}" });
            }
        }

        // DELETE: api/sales/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSale(Guid id)
        {
            try
            {
                var result = await _salesService.DeleteSaleAsync(id);
                if (!result) return NotFound(new { message = "Venta no encontrada" });

                return Ok(new { message = "Venta eliminada correctamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting sale");
                return StatusCode(500, new { message = "Ocurrió un error al eliminar la venta" });
            }
        }

        // --- ENDPOINTS DE ABONOS ---

        // POST: api/sales/{saleId}/payments
        [HttpPost("{saleId}/payments")]
        public async Task<ActionResult<Sale>> AddPayment(Guid saleId, CreatePaymentDto model)
        {
            try
            {
                var sale = await _salesService.AddPaymentAsync(saleId, model);
                if (sale == null) return NotFound(new { message = "Venta no encontrada" });
                return Ok(sale);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding payment");
                return StatusCode(500, new { message = $"Error al agregar el abono: {ex.Message}" });
            }
        }

        // PUT: api/sales/{saleId}/payments/{paymentId}
        [HttpPut("{saleId}/payments/{paymentId}")]
        public async Task<ActionResult<Sale>> UpdatePayment(Guid saleId, Guid paymentId, UpdatePaymentDto model)
        {
            try
            {
                var sale = await _salesService.UpdatePaymentAsync(saleId, paymentId, model);
                if (sale == null) return NotFound(new { message = "Venta o abono no encontrado" });
                return Ok(sale);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating payment");
                return StatusCode(500, new { message = $"Error al actualizar el abono: {ex.Message}" });
            }
        }

        // DELETE: api/sales/{saleId}/payments/{paymentId}
        [HttpDelete("{saleId}/payments/{paymentId}")]
        public async Task<ActionResult<Sale>> DeletePayment(Guid saleId, Guid paymentId)
        {
            try
            {
                var sale = await _salesService.DeletePaymentAsync(saleId, paymentId);
                if (sale == null) return NotFound(new { message = "Venta o abono no encontrado" });
                return Ok(sale);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting payment");
                return StatusCode(500, new { message = $"Error al eliminar el abono: {ex.Message}" });
            }
        }
    }
}
