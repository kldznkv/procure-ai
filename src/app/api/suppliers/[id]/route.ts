export async function GET() {
  return new Response(JSON.stringify({ status: "ok", data: [] }), {
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function PUT() {
  return new Response(JSON.stringify({ status: "ok", data: [] }), {
    headers: { 'Content-Type': 'application/json' }
  })
}