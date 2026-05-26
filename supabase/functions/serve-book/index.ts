import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1) Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2) Parse request body
    const body = await req.json();
    const lessonId = body.lessonId as string | undefined;
    if (!lessonId) {
      return new Response(JSON.stringify({ error: 'lessonId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3) Use service role client for privileged queries
    const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

    // 4) Fetch the lesson
    const { data: lesson, error: lessonErr } = await adminClient
      .from('lessons')
      .select('id, document_path, document_type, total_pages, module_id')
      .eq('id', lessonId)
      .maybeSingle();

    if (lessonErr || !lesson) {
      console.error('Lesson query error:', lessonErr);
      return new Response(JSON.stringify({ error: 'Lesson not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4b) Get course_id from the module
    const { data: mod } = await adminClient
      .from('modules')
      .select('course_id')
      .eq('id', lesson.module_id)
      .maybeSingle();

    const courseId = mod?.course_id;
    if (!courseId) {
      return new Response(JSON.stringify({ error: 'Course not found for this lesson' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5) Check if user is admin (bypass enrollment check)
    const { data: roleRow } = await adminClient
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleRow) {
      // 6) Check enrollment
      const { data: enrollment } = await adminClient
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (!enrollment) {
        return new Response(JSON.stringify({ error: 'Not enrolled in this course' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 7) Check that a document exists
    const documentPath = lesson.document_path;
    if (!documentPath) {
      return new Response(JSON.stringify({ error: 'No document attached to this lesson' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 8) Download the file from private bucket using service role
    const { data: fileData, error: fileErr } = await adminClient
      .storage
      .from('books')
      .download(documentPath);

    if (fileErr || !fileData) {
      console.error('Storage download error:', fileErr);
      return new Response(JSON.stringify({ error: 'Failed to retrieve document' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 9) Determine content type
    const docType = lesson.document_type ?? 'pdf';
    const contentType = docType === 'epub'
      ? 'application/epub+zip'
      : 'application/pdf';

    // 10) Stream the file back to the client
    //     Headers prevent caching and discourage saving
    return new Response(fileData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': 'inline', // never 'attachment'
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
        'X-Total-Pages': String(lesson.total_pages ?? 0),
        'X-Document-Type': docType,
      },
    });

  } catch (err) {
    console.error('serve-book error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
