CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  photo_url TEXT,
  whatsapp TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;

CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL,
  destination TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_seats INTEGER NOT NULL CHECK (total_seats > 0),
  seats_available INTEGER NOT NULL CHECK (seats_available >= 0),
  creator_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  creator_name TEXT NOT NULL,
  creator_email TEXT NOT NULL,
  creator_whatsapp TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (seats_available <= total_seats)
);

CREATE TABLE IF NOT EXISTS public.ride_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ride_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_rides_date ON public.rides(date);
CREATE INDEX IF NOT EXISTS idx_rides_creator ON public.rides(creator_id);
CREATE INDEX IF NOT EXISTS idx_participants_ride ON public.ride_participants(ride_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON public.ride_participants(user_id);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_read_all ON public.user_profiles;
DROP POLICY IF EXISTS profiles_insert_self ON public.user_profiles;
DROP POLICY IF EXISTS profiles_update_self ON public.user_profiles;

DROP POLICY IF EXISTS rides_read_all ON public.rides;
DROP POLICY IF EXISTS rides_insert_creator ON public.rides;
DROP POLICY IF EXISTS rides_update_creator ON public.rides;
DROP POLICY IF EXISTS rides_delete_creator ON public.rides;

DROP POLICY IF EXISTS participants_read_all ON public.ride_participants;
DROP POLICY IF EXISTS participants_insert_self ON public.ride_participants;
DROP POLICY IF EXISTS participants_delete_self ON public.ride_participants;

CREATE POLICY profiles_read_all
ON public.user_profiles
FOR SELECT
USING (true);

CREATE POLICY profiles_insert_self
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update_self
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY rides_read_all
ON public.rides
FOR SELECT
USING (true);

CREATE POLICY rides_insert_creator
ON public.rides
FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY rides_update_creator
ON public.rides
FOR UPDATE
USING (auth.uid() = creator_id);

CREATE POLICY rides_delete_creator
ON public.rides
FOR DELETE
USING (auth.uid() = creator_id);

CREATE POLICY participants_read_all
ON public.ride_participants
FOR SELECT
USING (true);

CREATE POLICY participants_insert_self
ON public.ride_participants
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY participants_delete_self
ON public.ride_participants
FOR DELETE
USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_auto_join_creator ON public.rides;
DROP FUNCTION IF EXISTS public.auto_join_creator();

CREATE OR REPLACE FUNCTION public.join_ride_transaction(
  p_ride_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seats_left INTEGER;
  ride_creator UUID;
BEGIN
  SELECT creator_id, seats_available
  INTO ride_creator, seats_left
  FROM public.rides
  WHERE id = p_ride_id
  FOR UPDATE;

  IF ride_creator IS NULL THEN
    RETURN FALSE;
  END IF;

  IF ride_creator = p_user_id THEN
    RETURN FALSE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.ride_participants
    WHERE ride_id = p_ride_id AND user_id = p_user_id
  ) THEN
    RETURN FALSE;
  END IF;

  IF seats_left <= 0 THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.ride_participants (ride_id, user_id)
  VALUES (p_ride_id, p_user_id);

  UPDATE public.rides
  SET seats_available = seats_available - 1
  WHERE id = p_ride_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_ride_transaction(
  p_ride_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ride_creator UUID;
BEGIN
  SELECT creator_id
  INTO ride_creator
  FROM public.rides
  WHERE id = p_ride_id;

  IF ride_creator IS NULL THEN
    RETURN FALSE;
  END IF;

  IF ride_creator = p_user_id THEN
    RETURN FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.ride_participants
    WHERE ride_id = p_ride_id AND user_id = p_user_id
  ) THEN
    RETURN FALSE;
  END IF;

  DELETE FROM public.ride_participants
  WHERE ride_id = p_ride_id AND user_id = p_user_id;

  UPDATE public.rides
  SET seats_available = seats_available + 1
  WHERE id = p_ride_id;

  RETURN TRUE;
END;
$$;
