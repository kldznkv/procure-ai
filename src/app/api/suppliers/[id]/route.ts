export async function GET() {
  return Response.json({ 
    success: true,
    data: { id: '1', name: 'Sample Supplier' },
    message: "API working - mock data"
  })
}

export async function PUT() {
  return Response.json({ 
    success: true,
    message: "API working - mock supplier updated"
  })
}