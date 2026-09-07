
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")

serve(async (req) => {
    // Configuração de CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            }
        })
    }

    try {
        const { transaction_amount, description, payer, userId, credits } = await req.json()

        const response = await fetch("https://api.mercadopago.com/v1/payments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
                "X-Idempotency-Key": crypto.randomUUID(), // Evita pagamentos duplicados
            },
            body: JSON.stringify({
                transaction_amount,
                description: `${description} | CREDITS:${credits}`,
                payment_method_id: "pix",
                external_reference: userId, // Link do pagamento ao usuário
                payer: {
                    email: payer.email,
                },
                notification_url: "https://vhtbnptfxilcukytuoba.supabase.co/functions/v1/mercadopago-webhook",
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Erro ao criar pagamento no Mercado Pago')
        }

        // Retorna apenas o que o frontend precisa
        return new Response(
            JSON.stringify({
                id: data.id,
                status: data.status,
                qr_code: data.point_of_interaction.transaction_data.qr_code,
                qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64,
                external_resource_url: data.point_of_interaction.transaction_data.ticket_url,
            }),
            {
                headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
                status: 200
            },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
                status: 400
            },
        )
    }
})
