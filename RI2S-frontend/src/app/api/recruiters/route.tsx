import { NextResponse } from 'next/server';
import { connectDB } from '@/models/connectDB';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();
    const recruiters = await User.find({
      role: { $in: ['coordinateur', 'assistant_coordinateur'] }
    });
    return NextResponse.json(recruiters);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}