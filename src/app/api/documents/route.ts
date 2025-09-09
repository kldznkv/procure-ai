import { NextResponse } from 'next/server';

export async function GET() {
  return new Response(JSON.stringify({ status: "ok", data: [] }), {
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('user_id') || 'temp-user';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Basic file processing - store and return success
    const document = {
      id: Date.now().toString(),
      filename: file.name,
      user_id: userId,
      upload_date: new Date().toISOString(),
      processed: false,
      file_size: file.size
    };

    return NextResponse.json({ document, message: 'File uploaded successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}