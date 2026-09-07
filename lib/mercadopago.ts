
import { supabase } from './supabase';

export const MERCADOPAGO_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

export interface MercadoPagoPaymentResponse {
    id: string;
    status: string;
    qr_code: string;
    qr_code_base64: string;
    external_resource_url: string;
}

/**
 * Esta função chama uma Edge Function do Supabase para criar um pagamento via PIX.
 * O Access Token do Mercado Pago fica seguro no servidor do Supabase.
 */
export async function createPixPayment(amount: number, description: string, userEmail: string, userId: string, credits: number): Promise<MercadoPagoPaymentResponse> {
    try {
        const { data, error } = await supabase.functions.invoke('mercadopago-pix', {
            body: {
                transaction_amount: amount,
                description: description,
                payer: { email: userEmail },
                userId: userId,
                credits: credits
            },
        });

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Erro ao criar pagamento Mercado Pago:', err);
        throw err;
    }
}
