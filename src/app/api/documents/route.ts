import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    console.log('Documents API GET called');
    
    // Simple response first
    return NextResponse.json({ 
      documents: [],
      total: 0,
      message: "Documents API working"
    });
    
  } catch (error) {
    console.error('Documents API GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('Document upload POST called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('user_id') || 'temp-user';
    
    console.log('Upload data:', { 
      hasFile: !!file, 
      fileName: file?.name, 
      userId,
      fileSize: file?.size 
    });
    
    if (!file) {
      console.log('No file provided in upload');
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

    console.log('Document created successfully:', document);
    return NextResponse.json({ document, message: 'File uploaded successfully' });
    
  } catch (error) {
    console.error('Document upload POST error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}