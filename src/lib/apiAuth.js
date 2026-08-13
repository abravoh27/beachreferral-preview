// Verificación compartida del header x-api-key para los endpoints que
// llama el sitio web externo (servidor a servidor).
export function checkApiKey(request) {
  const apiKey = request.headers.get('x-api-key');
  return !!process.env.WEB_BOOKING_API_KEY && apiKey === process.env.WEB_BOOKING_API_KEY;
}
