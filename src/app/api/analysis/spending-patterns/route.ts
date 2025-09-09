export async function GET() {
  return new Response(JSON.stringify({ status: "ok", data: [] }), {
    headers: { 'Content-Type': 'application/json' }
  })
}