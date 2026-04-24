using System.Threading.Tasks;
using OpticBackend.Dtos.Reporting;

namespace OpticBackend.Services.Interfaces
{
    public interface IReportingService
    {
        Task<AdminSummaryDto> GetAdminSummaryAsync();
        Task<SellerSummaryDto> GetSellerSummaryAsync(string userId);
        Task<List<TenantSummaryDto>> GetRootCrossTenantSummaryAsync();
    }
}
