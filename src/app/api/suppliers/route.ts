export async function GET() {
  return Response.json({ 
    suppliers: [],
    total: 0,
    message: "API working - mock data"
  })
}

export async function POST() {
  return Response.json({ 
    success: true,
    message: "API working - mock supplier created"
  })
}