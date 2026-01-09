CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    photo_url TEXT,
    whatsapp TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
CREATE TABLE IF NOT EXISTS rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_seats INTEGER NOT NULL CHECK (total_seats > 0),
    seats_available INTEGER NOT NULL CHECK (seats_available >= 0),
    creator_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    creator_name TEXT NOT NULL,
    creator_email TEXT NOT NULL,
    creator_whatsapp TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (seats_available <= total_seats)
);
CREATE TABLE IF NOT EXISTS ride_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (ride_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_rides_date ON rides(date);
CREATE INDEX IF NOT EXISTS idx_rides_creator ON rides(creator_id);
CREATE INDEX IF NOT EXISTS idx_participants_ride ON ride_participants(ride_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON ride_participants(user_id);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_read_all
ON user_profiles FOR SELECT USING (true);
CREATE POLICY profiles_insert_self
ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_self
ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY rides_read_all
ON rides FOR SELECT USING (true);
CREATE POLICY rides_insert_creator
ON rides FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY rides_update_creator
ON rides FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY rides_delete_creator
ON rides FOR DELETE USING (auth.uid() = creator_id);
CREATE POLICY participants_read_all
ON ride_participants FOR SELECT USING (true);
CREATE POLICY participants_insert_self
ON ride_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY participants_delete_self
ON ride_participants FOR DELETE USING (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION auto_join_creator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO ride_participants (ride_id, user_id)
    VALUES (NEW.id, NEW.creator_id);
    UPDATE rides
    SET seats_available = total_seats - 1
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_auto_join_creator ON rides;
CREATE TRIGGER trg_auto_join_creator
AFTER INSERT ON rides
FOR EACH ROW
EXECUTE FUNCTION auto_join_creator();
CREATE OR REPLACE FUNCTION join_ride_transaction(
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
BEGIN
    IF EXISTS (
        SELECT 1 FROM ride_participants
        WHERE ride_id = p_ride_id AND user_id = p_user_id
    ) THEN
        RETURN FALSE;
    END IF;
    SELECT seats_available
    INTO seats_left
    FROM rides
    WHERE id = p_ride_id
    FOR UPDATE;
    IF seats_left IS NULL OR seats_left <= 0 THEN
        RETURN FALSE;
    END IF;
    INSERT INTO ride_participants (ride_id, user_id)
    VALUES (p_ride_id, p_user_id);
    UPDATE rides
    SET seats_available = seats_available - 1
    WHERE id = p_ride_id;
    RETURN TRUE;
END;
$$;
CREATE OR REPLACE FUNCTION leave_ride_transaction(
    p_ride_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM ride_participants
        WHERE ride_id = p_ride_id AND user_id = p_user_id
    ) THEN
        RETURN FALSE;
    END IF;
    DELETE FROM ride_participants
    WHERE ride_id = p_ride_id AND user_id = p_user_id;
    UPDATE rides
    SET seats_available = seats_available + 1
    WHERE id = p_ride_id;
    RETURN TRUE;
END;
$$;