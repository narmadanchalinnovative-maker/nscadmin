import { NextResponse } from 'next/server';
import { lectureService } from '@/lib/services/lectures';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { courseId, subjectId, chapterId, title, description, videoUrl, videoPath, order, userId } = data;

    if (!courseId || !title) {
      return NextResponse.json(
        { error: 'courseId and title are required' },
        { status: 400 }
      );
    }

    const newLecture = {
      courseId,
      subjectId: subjectId || '',
      chapterId: chapterId || '',
      title,
      description: description || '',
      videoUrl: videoUrl || '',
      videoPath: videoPath || '',
      status: 'active' as const,
      order: order || 0,
    };

    const result = await lectureService.create(newLecture, userId || 'admin');

    return NextResponse.json({ success: true, lecture: result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create lecture' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (courseId) {
      const result = await lectureService.listByCourse(courseId);
      // listDocuments typically returns { data, total, ... }
      return NextResponse.json({ success: true, lectures: result.data || result });
    }

    const result = await lectureService.list();
    return NextResponse.json({ success: true, lectures: result.data || result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lectures' },
      { status: 500 }
    );
  }
}
