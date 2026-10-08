-- ROLES
CREATE TYPE public.app_role AS ENUM ('teacher', 'student');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'teacher'));

-- auto profile + student role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- first signed-in user can claim the teacher role when none exists
CREATE OR REPLACE FUNCTION public.claim_teacher_role()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE existing INT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  SELECT count(*) INTO existing FROM public.user_roles WHERE role = 'teacher';
  IF existing > 0 THEN RETURN public.has_role(auth.uid(), 'teacher'); END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'teacher') ON CONFLICT DO NOTHING;
  RETURN TRUE;
END; $$;
GRANT EXECUTE ON FUNCTION public.claim_teacher_role() TO authenticated;

-- CONTENT
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.units TO authenticated;
GRANT ALL ON public.units TO service_role;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "units read" ON public.units FOR SELECT TO authenticated USING (true);
CREATE POLICY "units write" ON public.units FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teacher')) WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'video',
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  media_url TEXT,
  body TEXT,
  transcript TEXT,
  duration_label TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons read" ON public.lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "lessons write" ON public.lessons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teacher')) WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'mcq',
  prompt TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  answer TEXT NOT NULL,
  explanation TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks read" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "tasks write" ON public.tasks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teacher')) WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE TABLE public.vocab_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  part_of_speech TEXT NOT NULL DEFAULT '',
  meaning TEXT NOT NULL,
  example TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vocab_items TO authenticated;
GRANT ALL ON public.vocab_items TO service_role;
ALTER TABLE public.vocab_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vocab read" ON public.vocab_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "vocab write" ON public.vocab_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teacher')) WITH CHECK (public.has_role(auth.uid(), 'teacher'));

-- PROGRESS
CREATE TABLE public.attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  activity TEXT NOT NULL DEFAULT 'quiz',
  score INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.attempts TO authenticated;
GRANT ALL ON public.attempts TO service_role;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempts insert own" ON public.attempts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "attempts read" ON public.attempts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'teacher'));

-- SEED: Unit 4
INSERT INTO public.units (id, number, title, subtitle, sort_order) VALUES
('11111111-1111-4111-8111-111111111111', 4, 'Shops & the Weekend', 'Chain stores, shopping talk and where the British weekend began.', 1);

INSERT INTO public.lessons (id, unit_id, kind, title, subtitle, media_url, body, transcript, duration_label, sort_order) VALUES
('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111111', 'video', 'Global chain stores', 'Watch the clip about the shops on our high streets.', '/__l5e/assets-v1/6041e260-e487-4c82-9783-66a634d8f63c/unit4b-video.mp4', NULL,
'In most towns and cities around the world, the high streets are full of chain stores. Zara is a Spanish fashion chain and can create and distribute a new design in less than two weeks. H&M is a Swedish clothes chain that sells quality clothes at a very good price, and its employees always celebrate the opening of a new store with a dance. Uniqlo actually started in Japan in 1949 and sells 50 different colours of socks. Nike is an American chain that sells more than 900 million items every year, and its symbol is called the swoosh. The first Body Shop opened in Brighton, England in 1976; it was painted dark green because that was the only colour that could cover the mould. Apple launched a clothing line in 1986, which was not a success. Chains are popular because they are familiar.',
'3:30', 1),
('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111111', 'audio', 'Shopping interviews', 'Listen to Grace, Emilia and Leo talking about shopping.', '/__l5e/assets-v1/7a2257a2-9689-4e5f-81a1-6e0d7d270539/unit4-audio-4-14.mp3', NULL,
'Grace bought a long black skirt at H&M three weeks ago; it was cheap because it was in the sale and it suits her. Emilia went shopping at the weekend with friends in the city centre, on Princes Street. She tried on a few things in Zara but bought nothing there; the only thing she bought was a new phone case in the Apple store. Leo often buys things on the Uniqlo website. The last thing he bought was three T-shirts, at about £15 each, which he thinks are good value.',
'1:28', 2),
('22222222-2222-4222-8222-222222222203', '11111111-1111-4111-8111-111111111111', 'video', 'Where the weekend began', 'Karen in Manchester explains the story of the British weekend.', '/__l5e/assets-v1/33e49a22-9c03-4332-a9d3-36e6b64a1441/unit4c-video.mp4', NULL,
'Manchester was the first industrial city and the home of the cotton industry. Until 1843 people worked from Monday to Saturday and rested on Sunday. In the 1840s a group of men, including Robert Lowes, asked factory owners for an extra half day off on Saturday afternoon. They had three reasons: commercial (shops were shut on Sunday so people had no time to spend their money), religious (people were too tired to go to church) and economic (rested people work harder). In 1843 many Manchester factories closed at two o''clock on Saturday, and by the 1870s all workers had a one and a half day weekend. Manchester''s love of football began at this time: Newton Heath became Manchester United and St Mark''s became Manchester City. By the 1960s Britain had a two-day weekend, and in the 1990s the law changed so shops opened on Sundays. 71% of British workers think Britain would be a happier place with a three-day weekend.',
'4:57', 3),
('22222222-2222-4222-8222-222222222204', '11111111-1111-4111-8111-111111111111', 'reading', 'Reading: the high street today', 'Read the text, then answer the questions.', NULL,
'In most towns and cities around the world, the high streets are full of chain stores. Zara is a Spanish fashion chain and one of the biggest clothes companies in the world. It can create and distribute a new design in less than two weeks.

H&M is a Swedish clothes chain. It sells quality clothes at a very good price, and its employees always celebrate the opening of a new store with a dance.

A lot of people think that Uniqlo is quite a new clothing chain, but it actually started in Japan in 1949. It sells 50 different colours of socks.

Nike is an American chain that sells sports clothes and shoes. It sells more than 900 million items every year, and its famous symbol has its own name: the swoosh.

The first Body Shop opened in Brighton, England in 1976. It sells environmentally friendly products for the body, face, hair and home. The first shop was painted dark green - not to be more eco-friendly, but because the shop had a lot of mould and dark green was the only colour that could cover it.

Apple is an American technology company selling phones, tablets and computers. It even launched a clothing line in 1986, which did not have any success.

Chains are popular because they are familiar. If we go to a new town, or even to a different country, we know that we can find our favourite products in these shops.',
NULL, '4 min read', 4);

INSERT INTO public.tasks (lesson_id, type, prompt, options, answer, explanation, sort_order) VALUES
-- Lesson 1: chain stores video
('22222222-2222-4222-8222-222222222201', 'mcq', 'How long does Zara need to create and distribute a new design?', '["Less than two weeks","About two months","Six weeks","One year"]', 'Less than two weeks', 'Zara can create and distribute a new design in less than two weeks.', 1),
('22222222-2222-4222-8222-222222222201', 'mcq', 'How do H&M employees celebrate the opening of a new store?', '["With a dance","With a free breakfast","With fireworks","With a football match"]', 'With a dance', 'H&M employees always celebrate a new store with a dance.', 2),
('22222222-2222-4222-8222-222222222201', 'tf', 'Uniqlo is a new company that started a few years ago.', '["True","False"]', 'False', 'Uniqlo started in Japan in 1949.', 3),
('22222222-2222-4222-8222-222222222201', 'mcq', 'Why was the first Body Shop painted dark green?', '["To cover the mould","To look eco-friendly","It was the owner''s favourite colour","To match the street"]', 'To cover the mould', 'The shop had a lot of mould and dark green was the only colour that could cover it.', 4),
('22222222-2222-4222-8222-222222222201', 'gap', 'The Nike symbol has its own name. It is called the ____ .', '[]', 'swoosh', 'The Nike symbol is called the swoosh.', 5),
('22222222-2222-4222-8222-222222222201', 'tf', 'Apple''s clothing line from 1986 was very successful.', '["True","False"]', 'False', 'The clothing line did not have any success.', 6),
-- Lesson 2: audio
('22222222-2222-4222-8222-222222222202', 'mcq', 'What did Grace buy at H&M?', '["A long black skirt","A pair of jeans","A winter coat","A white shirt"]', 'A long black skirt', 'Grace bought a long black skirt three weeks ago.', 1),
('22222222-2222-4222-8222-222222222202', 'tf', 'Grace paid full price for her skirt.', '["True","False"]', 'False', 'It was very cheap because it was in the sale.', 2),
('22222222-2222-4222-8222-222222222202', 'mcq', 'What did Emilia buy in the end?', '["A phone case","A dress from Zara","Nothing at all","A pair of shoes"]', 'A phone case', 'She tried things on in Zara but only bought a phone case in the Apple store.', 3),
('22222222-2222-4222-8222-222222222202', 'gap', 'Leo bought ____ T-shirts from Uniqlo. (write the number as a word)', '[]', 'three', 'Leo got three T-shirts, at about £15 each.', 4),
('22222222-2222-4222-8222-222222222202', 'mcq', 'How much did each of Leo''s T-shirts cost?', '["About £15","About £5","About £50","About £25"]', 'About £15', 'He said they were good value, about £15 each.', 5),
-- Lesson 3: weekend video
('22222222-2222-4222-8222-222222222203', 'mcq', 'Which city is the story of the weekend connected with?', '["Manchester","London","Liverpool","Brighton"]', 'Manchester', 'Karen tells the story of her hometown, Manchester.', 1),
('22222222-2222-4222-8222-222222222203', 'gap', 'Until ____ , people worked six days a week, from Monday to Saturday.', '[]', '1843', 'The change happened in 1843.', 2),
('22222222-2222-4222-8222-222222222203', 'mcq', 'Which was NOT one of the three reasons for the half day off?', '["Political","Commercial","Religious","Economic"]', 'Political', 'The three reasons were commercial, religious and economic.', 3),
('22222222-2222-4222-8222-222222222203', 'tf', 'Newton Heath Football Club became Manchester City.', '["True","False"]', 'False', 'Newton Heath became Manchester United; St Mark''s became Manchester City.', 4),
('22222222-2222-4222-8222-222222222203', 'mcq', 'When did Britain get a two-day weekend?', '["By the 1960s","In 1843","By the 1870s","In the 1990s"]', 'By the 1960s', 'By the 1960s Britain had a two-day weekend.', 5),
('22222222-2222-4222-8222-222222222203', 'mcq', 'What percentage of British workers would like a three-day weekend?', '["71%","31%","54%","88%"]', '71%', '71% think Britain would be a happier place with a three-day weekend.', 6),
-- Lesson 4: reading
('22222222-2222-4222-8222-222222222204', 'tf', 'Zara is a Spanish company.', '["True","False"]', 'True', 'Zara is a Spanish fashion chain.', 1),
('22222222-2222-4222-8222-222222222204', 'mcq', 'How many items does Nike sell every year?', '["More than 900 million","More than 90 million","About 9 million","About 900 thousand"]', 'More than 900 million', 'Nike sells more than 900 million items every year.', 2),
('22222222-2222-4222-8222-222222222204', 'gap', 'The Body Shop sells environmentally ____ products for the body, face, hair and home.', '[]', 'friendly', 'The text says "environmentally friendly products".', 3),
('22222222-2222-4222-8222-222222222204', 'mcq', 'Why are chain stores popular, according to the text?', '["They are familiar","They are always cheapest","They are always local","They are new"]', 'They are familiar', 'We know we can find our favourite products in them anywhere.', 4),
('22222222-2222-4222-8222-222222222204', 'tf', 'Uniqlo is a Japanese company.', '["True","False"]', 'True', 'Uniqlo started in Japan in 1949.', 5);

INSERT INTO public.vocab_items (unit_id, word, part_of_speech, meaning, example, sort_order) VALUES
('11111111-1111-4111-8111-111111111111', 'chain store', 'noun', 'one of many shops with the same name in different towns', 'The high street is full of chain stores.', 1),
('11111111-1111-4111-8111-111111111111', 'high street', 'noun', 'the main shopping street of a town', 'There are six cafés on our high street.', 2),
('11111111-1111-4111-8111-111111111111', 'sale', 'noun', 'a time when a shop sells things at lower prices', 'I bought it in the sale.', 3),
('11111111-1111-4111-8111-111111111111', 'try on', 'phrasal verb', 'to put clothes on in a shop to see if they fit', 'I tried on a few things in Zara.', 4),
('11111111-1111-4111-8111-111111111111', 'suit', 'verb', 'to look good on someone', 'That colour really suits you.', 5),
('11111111-1111-4111-8111-111111111111', 'good value', 'phrase', 'worth the money you pay', 'The T-shirts were good value.', 6),
('11111111-1111-4111-8111-111111111111', 'customer', 'noun', 'a person who buys something in a shop', 'The shop was full of customers.', 7),
('11111111-1111-4111-8111-111111111111', 'shop assistant', 'noun', 'a person who works in a shop and helps customers', 'The shop assistant found my size.', 8),
('11111111-1111-4111-8111-111111111111', 'factory', 'noun', 'a building where things are made', 'The factories closed at two o''clock.', 9),
('11111111-1111-4111-8111-111111111111', 'weekend', 'noun', 'Saturday and Sunday, when most people do not work', 'Have a good weekend!', 10),
('11111111-1111-4111-8111-111111111111', 'industry', 'noun', 'the work of making things in factories', 'Manchester was the home of the cotton industry.', 11),
('11111111-1111-4111-8111-111111111111', 'persuade', 'verb', 'to make someone agree to do something', 'They persuaded the factory owners to close early.', 12);