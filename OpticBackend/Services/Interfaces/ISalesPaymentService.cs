using OpticBackend.Dtos.Sales;
using OpticBackend.Models;

namespace OpticBackend.Services.Interfaces
{
    public interface ISalesPaymentService
    {
        Task<Sale?> AddPaymentAsync(Guid saleId, CreatePaymentDto model);
        Task<Sale?> UpdatePaymentAsync(Guid saleId, Guid paymentId, UpdatePaymentDto model);
        Task<Sale?> DeletePaymentAsync(Guid saleId, Guid paymentId);
    }
}
