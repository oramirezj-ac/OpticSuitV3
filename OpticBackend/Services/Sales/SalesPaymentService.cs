using Microsoft.EntityFrameworkCore;
using OpticBackend.Data;
using OpticBackend.Dtos.Sales;
using OpticBackend.Models;
using OpticBackend.Services.Interfaces;

namespace OpticBackend.Services.Sales
{
    public class SalesPaymentService : ISalesPaymentService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SalesPaymentService> _logger;
        private readonly ISalesQueryService _queryService;

        public SalesPaymentService(ApplicationDbContext context, ILogger<SalesPaymentService> logger, ISalesQueryService queryService)
        {
            _context = context;
            _logger = logger;
            _queryService = queryService;
        }

        private async Task RecalculateSaleBalanceAsync(Guid saleId)
        {
            var sale = await _context.Ventas
                .Include(v => v.Abonos)
                .FirstOrDefaultAsync(v => v.Id == saleId);

            if (sale != null)
            {
                decimal totalAbonado = sale.Abonos?.Sum(a => a.Monto) ?? 0;
                sale.SaldoPendiente = sale.TotalVenta - totalAbonado;
                
                if (sale.SaldoPendiente < 0) sale.SaldoPendiente = 0;

                _context.Entry(sale).State = EntityState.Modified;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<Sale?> AddPaymentAsync(Guid saleId, CreatePaymentDto model)
        {
            var sale = await _context.Ventas.FindAsync(saleId);
            if (sale == null) return null;

            var payment = new Payment
            {
                VentaId = saleId,
                Monto = model.Monto,
                MetodoPago = model.MetodoPago,
                FechaPago = model.FechaPago.HasValue
                    ? (model.FechaPago.Value.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(model.FechaPago.Value, DateTimeKind.Utc) : model.FechaPago.Value.ToUniversalTime())
                    : DateTime.UtcNow,
                UsuarioId = model.UsuarioId
            };

            _context.Abonos.Add(payment);
            await _context.SaveChangesAsync();

            await RecalculateSaleBalanceAsync(saleId);

            return await _queryService.GetSaleByIdAsync(saleId);
        }

        public async Task<Sale?> UpdatePaymentAsync(Guid saleId, Guid paymentId, UpdatePaymentDto model)
        {
            var payment = await _context.Abonos.FirstOrDefaultAsync(p => p.Id == paymentId && p.VentaId == saleId);
            if (payment == null) return null;

            if (model.Monto.HasValue) payment.Monto = model.Monto.Value;
            if (!string.IsNullOrEmpty(model.MetodoPago)) payment.MetodoPago = model.MetodoPago;
            
            if (model.FechaPago.HasValue)
            {
                payment.FechaPago = model.FechaPago.Value.Kind == DateTimeKind.Unspecified 
                    ? DateTime.SpecifyKind(model.FechaPago.Value, DateTimeKind.Utc) 
                    : model.FechaPago.Value.ToUniversalTime();
            }

            _context.Entry(payment).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            await RecalculateSaleBalanceAsync(saleId);

            return await _queryService.GetSaleByIdAsync(saleId);
        }

        public async Task<Sale?> DeletePaymentAsync(Guid saleId, Guid paymentId)
        {
            var payment = await _context.Abonos.FirstOrDefaultAsync(p => p.Id == paymentId && p.VentaId == saleId);
            if (payment == null) return null;

            _context.Abonos.Remove(payment);
            await _context.SaveChangesAsync();

            await RecalculateSaleBalanceAsync(saleId);

            return await _queryService.GetSaleByIdAsync(saleId);
        }
    }
}
