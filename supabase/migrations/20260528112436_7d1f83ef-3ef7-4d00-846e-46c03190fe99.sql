
CREATE TYPE public.roadmap_phase AS ENUM ('A', 'B', 'C', 'inbox');
CREATE TYPE public.roadmap_status AS ENUM ('todo', 'in_progress', 'done', 'deferred');

CREATE TABLE public.roadmap_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  phase public.roadmap_phase NOT NULL DEFAULT 'inbox',
  status public.roadmap_status NOT NULL DEFAULT 'todo',
  sort_order INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_items TO authenticated;
GRANT ALL ON public.roadmap_items TO service_role;

ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roadmap_select_authenticated"
  ON public.roadmap_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "roadmap_insert_admin"
  ON public.roadmap_items FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roadmap_update_admin"
  ON public.roadmap_items FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roadmap_delete_admin"
  ON public.roadmap_items FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_roadmap_items_updated_at
  BEFORE UPDATE ON public.roadmap_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_roadmap_phase_order ON public.roadmap_items(phase, sort_order);

INSERT INTO public.roadmap_items (title, phase, status, sort_order, completed_at, description) VALUES
  ('Threshold = 60 للـ missions', 'A', 'done', 10, now(), 'معيار النجاح متساهل لتشجيع التجربة'),
  ('2 محاولات + زرار "وريني نموذج إجابة"', 'A', 'done', 20, now(), 'توازن بين التعلم وسقف التكلفة'),
  ('AI evaluation عبر Gemini 2.5 Flash', 'A', 'done', 30, now(), 'Lovable AI Gateway بدون API key'),
  ('Mission gate يمنع الدرس التالي لحد النجاح', 'A', 'done', 40, now(), null),
  ('Server-side passed flag (مش الموديل)', 'A', 'done', 50, now(), 'منع تلاعب أو هلوسة'),
  ('3 reference missions (Builder/Creator/Automator m1)', 'A', 'done', 60, now(), null),
  ('Builder m2–m10 missions (26 mission)', 'B', 'todo', 10, null, null),
  ('Creator m2–m6 missions (17 mission)', 'B', 'todo', 20, null, null),
  ('Automator m2–m6 missions (16 mission)', 'B', 'todo', 30, null, null),
  ('Analyst كل الـ missions (12)', 'B', 'todo', 40, null, null),
  ('Business كل الـ missions (12)', 'B', 'todo', 50, null, null),
  ('Intro missions (7)', 'B', 'todo', 60, null, null),
  ('Mission cost cap على مستوى الـ user', 'C', 'todo', 10, null, 'سقف يومي/شهري لاستهلاك AI evaluation'),
  ('Payments activation check', 'C', 'todo', 20, null, 'التأكد إن الاشتراكات شغالة فعلاً'),
  ('Path integration / journey map', 'C', 'deferred', 30, null, 'مؤجل بقرار سابق');
