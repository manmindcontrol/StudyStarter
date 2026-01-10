import { NextResponse } from 'next/server';
import { checkBypass } from '@/lib/bypass';

export async function GET() {
  try {
    const hasBypass = await checkBypass();

    return NextResponse.json({ hasBypass });
  } catch (error) {
    console.error('Error checking bypass:', error);
    return NextResponse.json({ hasBypass: false });
  }
}
