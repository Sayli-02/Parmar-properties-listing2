import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('[Parmar Properties Advisory] New Confidential Enquiry:', data);
    
    return NextResponse.json({
      success: true,
      message: 'Your advisory request has been received. Our senior residential director will contact you within 4 business hours.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to process enquiry.' },
      { status: 400 }
    );
  }
}
