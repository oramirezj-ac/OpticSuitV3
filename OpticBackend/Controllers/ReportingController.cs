using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpticBackend.Services.Interfaces;
using System.Security.Claims;

namespace OpticBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportingController : ControllerBase
    {
        private readonly IReportingService _reportingService;
        private readonly ILogger<ReportingController> _logger;

        public ReportingController(IReportingService reportingService, ILogger<ReportingController> logger)
        {
            _reportingService = reportingService;
            _logger = logger;
        }

        [HttpGet("admin-summary")]
        [Authorize(Roles = "Root,Admin")]
        public async Task<ActionResult> GetAdminSummary()
        {
            try
            {
                var summary = await _reportingService.GetAdminSummaryAsync();
                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching admin summary");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("seller-summary")]
        public async Task<ActionResult> GetSellerSummary()
        {
            try
            {
                // Get User ID from JWT claims
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var summary = await _reportingService.GetSellerSummaryAsync(userId);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching seller summary");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
