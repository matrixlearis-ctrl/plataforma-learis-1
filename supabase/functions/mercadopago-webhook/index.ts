
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

serve(async (req) => {
    // Apenas POST é permitido
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 })
    }

    try {
        const body = await req.json()
        console.log('Webhook recebido:', body)

        // Verificamos se é uma notificação de pagamento
        if (body.type === 'payment' && body.data?.id) {
            const paymentId = body.data.id

            // 1. Consultar o Mercado Pago para confirmar o status
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                    "Authorization": `Bearer ${MP_ACCESS_TOKEN}`
                }
            })

            if (!mpResponse.ok) {
                console.error('Erro ao consultar Mercado Pago:', await mpResponse.text())
                return new Response('Error fetching MP', { status: 400 })
            }

            const paymentData = await mpResponse.json()
            console.log('Status do pagamento:', paymentData.status)

            // 2. Se o status for "approved"
            if (paymentData.status === 'approved') {
                const userId = paymentData.external_reference
                // Extraímos os créditos da descrição (ex: "Créditos Samej - Pack Teste | CREDITS:5")
                const description = paymentData.description || ""
                const creditsMatch = description.match(/CREDITS:(\d+)/)
                const creditsToAdd = creditsMatch ? parseInt(creditsMatch[1]) : 0

                console.log(`Tentando adicionar ${creditsToAdd} créditos ao usuário ${userId}`)

                if (userId && creditsToAdd > 0) {
                    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

                    // 3. Buscar perfil atual
                    const { data: profile, error: fetchError } = await supabase
                        .from('profiles')
                        .select('credits')
                        .eq('id', userId)
                        .single()

                    if (fetchError) {
                        console.error('Erro ao buscar perfil:', fetchError)
                        return new Response('Profile not found', { status: 404 })
                    }

                    // 4. Atualizar créditos
                    const currentCredits = profile.credits || 0
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ credits: currentCredits + creditsToAdd })
                        .eq('id', userId)

                    if (updateError) {
                        console.error('Erro ao atualizar créditos:', updateError)
                        return new Response('Update error', { status: 500 })
                    }

                    console.log(`Sucesso! ${creditsToAdd} créditos adicionados ao usuário ${userId}`)
                }
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200
        })

    } catch (error) {
        console.error('Erro no Webhook:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 400
        })
    }
})
