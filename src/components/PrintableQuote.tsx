import React from 'react';
import type { QuoteApiResponse } from '../pages/QuoteAdmin';
import type { Client } from '../api/clients';
import type { Product } from '../api/products';
import type { Material } from '../api/material';
import type { Service } from '../api/services';

interface PrintableQuoteProps {
    quote: QuoteApiResponse;
    clients: Client[];
    products: Product[];
    materials: Material[];
    services: Service[];
    qrInfo?: any;
}

const PrintableQuote: React.FC<PrintableQuoteProps> = ({
    quote,
    clients,
    products,
    materials,
    services,
    qrInfo
}) => {
    const calculateTotal = () => {
        const itemsTotal = quote.QuoteItems.reduce((sum, item) => {
            const itemTotal = item.quantity * parseFloat(item.unitPrice);
            const materialsTotal = item.QuoteItemMaterials.reduce((matSum, mat) =>
                matSum + (mat.quantity * parseFloat(mat.unitPrice)), 0);
            return sum + itemTotal + materialsTotal;
        }, 0);

        const servicesTotal = quote.QuoteServices.reduce((sum, service) =>
            sum + parseFloat(service.price), 0);

        return itemsTotal + servicesTotal;
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
            {/* Encabezado de la empresa */}
            <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '15px' }}>
                <h1 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>IMPRENTA ICCSA</h1>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>Dirección: Barrio Alegre Jutiapa</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>Teléfono: (502) 1234-5678 | Email: infoiccsa@gmail.com</p>
            </div>

            {/* Información del pedido */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>ORDEN DE PEDIDO #{quote.id}</h2>
                    <p><strong>Estado:</strong> {quote.status}</p>
                    <p><strong>Fecha de Creación:</strong> {new Date(quote.createdAt || '').toLocaleDateString()}</p>
                    <p><strong>Fecha de Entrega:</strong> {new Date(quote.deliveryDate).toLocaleDateString()}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    {qrInfo && qrInfo.qr_url && (
                        <div>
                            <p><strong>Código QR:</strong></p>
                            <img
                                src={`http://localhost:3000${qrInfo.qr_url}`}
                                alt="Código QR"
                                style={{ width: '100px', height: '100px', border: '1px solid #ccc' }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Información del cliente */}
            <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>INFORMACIÓN DEL CLIENTE</h3>
                <p><strong>Nombre:</strong> {quote.Client?.name || 'Cliente no encontrado'}</p>
                <p><strong>Email:</strong> {quote.Client?.email || 'Email no disponible'}</p>
            </div>

            {/* Productos */}
            {quote.QuoteItems && quote.QuoteItems.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>PRODUCTOS</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f0f0f0' }}>
                                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Producto</th>
                                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Cantidad</th>
                                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>Precio Unit.</th>
                                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Materiales</th>
                                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quote.QuoteItems.map((item, index) => (
                                <tr key={index}>
                                    <td style={{ border: '1px solid #000', padding: '8px' }}>
                                        {item.Product?.name || products.find(p => p.id === item.productId)?.name || 'Producto no encontrado'}
                                    </td>
                                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                                        {item.quantity}
                                    </td>
                                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                                        Q{parseFloat(item.unitPrice).toFixed(2)}
                                    </td>
                                    <td style={{ border: '1px solid #000', padding: '8px' }}>
                                        {item.QuoteItemMaterials.map((mat, matIndex) => (
                                            <div key={matIndex} style={{ fontSize: '11px' }}>
                                                {mat.Material?.name || materials.find(m => m.id === mat.materialId)?.name}: {mat.quantity} x Q{parseFloat(mat.unitPrice).toFixed(2)}
                                            </div>
                                        ))}
                                    </td>
                                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                                        Q{(item.quantity * parseFloat(item.unitPrice) +
                                            item.QuoteItemMaterials.reduce((sum, mat) => sum + (mat.quantity * parseFloat(mat.unitPrice)), 0)).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Servicios */}
            {quote.QuoteServices && quote.QuoteServices.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>SERVICIOS</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f0f0f0' }}>
                                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Servicio</th>
                                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>Precio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quote.QuoteServices.map((service, index) => (
                                <tr key={index}>
                                    <td style={{ border: '1px solid #000', padding: '8px' }}>
                                        {service.Service?.name || services.find(s => s.id === service.serviceId)?.name || 'Servicio no encontrado'}
                                    </td>
                                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                                        Q{parseFloat(service.price).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Total */}
            <div style={{ textAlign: 'right', marginBottom: '30px' }}>
                <div style={{
                    display: 'inline-block',
                    padding: '15px',
                    backgroundColor: '#f0f0f0',
                    border: '2px solid #000',
                    fontSize: '16px',
                    fontWeight: 'bold'
                }}>
                    TOTAL: Q{calculateTotal().toFixed(2)}
                </div>
            </div>

            {/* Instrucciones de producción */}
            <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>INSTRUCCIONES DE PRODUCCIÓN</h3>
                <div style={{ minHeight: '50px', borderBottom: '1px solid #ccc', marginBottom: '10px' }}>
                    {/* Espacio para escribir instrucciones manualmente */}
                </div>
                <p style={{ fontSize: '11px', fontStyle: 'italic' }}>
                    * Verificar medidas y especificaciones antes de comenzar la producción<br />
                    * Notificar al cliente cualquier cambio o problema durante el proceso <br />
                    * Confirmar fecha de entrega y coordinar logística de envío<br />
                    * Agregar si se realizaron descuentos o ajustes especiales
                </p>
            </div>

            {/* Firmas */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
                <div style={{ textAlign: 'center', width: '45%' }}>
                    <br />
                    <br />
                    <div style={{ borderTop: '1px solid #000', paddingTop: '5px', marginBottom: '30px' }}></div>
                    <p><strong>Firma del Cliente</strong></p>
                    <br />
                    <br />
                    <br />
                    <br />

                    <p>Fecha: _______________</p>
                </div>
                <div style={{ textAlign: 'center', width: '45%' }}>
                    <br />
                    <br />
                    <div style={{ borderTop: '1px solid #000', paddingTop: '5px', marginBottom: '30px' }}></div>
                    <p><strong>Firma Responsable Producción</strong></p>
                    <br />
                    <br />
                    <br />
                    <br />
                    <p>Fecha: _______________</p>
                </div>
            </div>

            {/* Pie de página */}
            <div style={{
                position: 'absolute',
                bottom: '20px',
                width: '100%',
                textAlign: 'center',
                fontSize: '10px',
                borderTop: '1px solid #ccc',
                paddingTop: '10px'
            }}>
                <p>Este documento es una orden de producción interna - Conservar hasta entrega del pedido</p>
            </div>
        </div>
    );
};

export default PrintableQuote;