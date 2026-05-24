-- PikaEarn Database Schema Migration SQL Script
-- Target: Supabase / PostgreSQL

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY, -- Telegram User ID
    username TEXT,
    balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    total_earned NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    ads_watched_today INT DEFAULT 0 NOT NULL,
    last_ad_watched_at TIMESTAMP WITH TIME ZONE,
    referred_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for referrals lookup
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);

-- 2. Create Withdrawals Table
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    method TEXT NOT NULL, -- 'TON Wallet', 'USDT TRC20', 'PayPal'
    target_address TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for withdrawal user lookups
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);


-- 3. Atomic Procedure: Get or Create User with Stats
-- Handles new registration, auto daily ads count reset, and invites statistics
CREATE OR REPLACE FUNCTION get_or_create_user(
    p_user_id BIGINT,
    p_username TEXT,
    p_referred_by BIGINT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_balance NUMERIC(10, 2);
    v_total_earned NUMERIC(10, 2);
    v_ads_watched_today INT;
    v_last_ad_watched_at TIMESTAMP WITH TIME ZONE;
    v_referred_by_actual BIGINT;
    v_current_time TIMESTAMP WITH TIME ZONE := NOW();
    v_friends_count INT;
    v_referral_earned NUMERIC(10, 2);
BEGIN
    -- Ensure user doesn't refer themselves
    IF p_referred_by IS NOT NULL AND p_referred_by = p_user_id THEN
        p_referred_by := NULL;
    END IF;
    
    -- Verify referrer exists in database
    IF p_referred_by IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_referred_by) THEN
            p_referred_by := NULL;
        END IF;
    END IF;

    -- Upsert user record
    INSERT INTO users (id, username, referred_by)
    VALUES (p_user_id, p_username, p_referred_by)
    ON CONFLICT (id) DO UPDATE
    SET username = COALESCE(p_username, users.username)
    RETURNING balance, total_earned, ads_watched_today, last_ad_watched_at, referred_by
    INTO v_balance, v_total_earned, v_ads_watched_today, v_last_ad_watched_at, v_referred_by_actual;

    -- Reset daily count if it's a new day (UTC timezone check)
    IF v_last_ad_watched_at IS NULL OR DATE(v_last_ad_watched_at AT TIME ZONE 'UTC') < DATE(v_current_time AT TIME ZONE 'UTC') THEN
        v_ads_watched_today := 0;
        UPDATE users SET ads_watched_today = 0 WHERE id = p_user_id;
    END IF;

    -- Fetch dynamic referrals stats (10% lifetime bonus from friend earnings)
    SELECT COUNT(*), COALESCE(SUM(total_earned), 0) * 0.10
    INTO v_friends_count, v_referral_earned
    FROM users
    WHERE referred_by = p_user_id;

    RETURN jsonb_build_object(
        'id', p_user_id,
        'username', p_username,
        'balance', v_balance,
        'total_earned', v_total_earned,
        'ads_watched_today', v_ads_watched_today,
        'last_ad_watched_at', v_last_ad_watched_at,
        'referred_by', v_referred_by_actual,
        'friends_count', v_friends_count,
        'referral_earned', v_referral_earned
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Atomic Procedure: watch_ad_and_credit
-- Enforces limits (20/day), cooldown (30s), credits balance (+$0.10), updates referrer (+$0.01)
CREATE OR REPLACE FUNCTION watch_ad_and_credit(
    p_user_id BIGINT,
    p_username TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_balance NUMERIC(10, 2);
    v_ads_watched_today INT;
    v_last_ad_watched_at TIMESTAMP WITH TIME ZONE;
    v_cooldown_seconds INT := 30;
    v_daily_limit INT := 20;
    v_reward NUMERIC(10, 2) := 0.10;
    v_referral_bonus NUMERIC(10, 2) := 0.01; -- 10% referral commission
    v_current_time TIMESTAMP WITH TIME ZONE := NOW();
    v_referred_by_actual BIGINT;
    v_friends_count INT;
    v_referral_earned NUMERIC(10, 2);
BEGIN
    -- Select user profile or raise if missing (should be registered through get_or_create_user first)
    SELECT balance, ads_watched_today, last_ad_watched_at, referred_by
    INTO v_balance, v_ads_watched_today, v_last_ad_watched_at, v_referred_by_actual
    FROM users
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        -- Fallback: create user if not yet present
        INSERT INTO users (id, username)
        VALUES (p_user_id, p_username)
        RETURNING balance, ads_watched_today, last_ad_watched_at, referred_by
        INTO v_balance, v_ads_watched_today, v_last_ad_watched_at, v_referred_by_actual;
    END IF;

    -- Reset daily count if it's a new UTC day
    IF v_last_ad_watched_at IS NULL OR DATE(v_last_ad_watched_at AT TIME ZONE 'UTC') < DATE(v_current_time AT TIME ZONE 'UTC') THEN
        v_ads_watched_today := 0;
    END IF;

    -- Enforce absolute Daily Limit (20 Ads)
    IF v_ads_watched_today >= v_daily_limit THEN
        RETURN jsonb_build_object('success', false, 'error', 'Daily limit of 20 ads reached. Try again tomorrow!');
    END IF;

    -- Enforce Progressive Ad Cooldown (starts at 30s after 1st ad, increases by 30s for each subsequent ad watched today)
    IF v_last_ad_watched_at IS NOT NULL AND v_ads_watched_today > 0 THEN
        DECLARE
            v_dynamic_cooldown INT;
        BEGIN
            v_dynamic_cooldown := v_ads_watched_today * 30; -- 1st ad watched today -> 30s, 2nd watched -> 60s, etc.
            IF v_current_time < v_last_ad_watched_at + (v_dynamic_cooldown || ' seconds')::INTERVAL THEN
                DECLARE
                    v_seconds_left INT;
                BEGIN
                    v_seconds_left := CEIL(EXTRACT(EPOCH FROM (v_last_ad_watched_at + (v_dynamic_cooldown || ' seconds')::INTERVAL - v_current_time)));
                    RETURN jsonb_build_object('success', false, 'error', 'Cooldown active. Please wait ' || v_seconds_left || ' more seconds.');
                END;
            END IF;
        END;
    END IF;

    -- Update viewer balance, total earnings, count, and timestamp atomically
    UPDATE users
    SET 
        balance = balance + v_reward,
        total_earned = total_earned + v_reward,
        ads_watched_today = v_ads_watched_today + 1,
        last_ad_watched_at = v_current_time
    WHERE id = p_user_id
    RETURNING balance, ads_watched_today, last_ad_watched_at
    INTO v_balance, v_ads_watched_today, v_last_ad_watched_at;

    -- Credit referrer if set
    IF v_referred_by_actual IS NOT NULL AND v_referred_by_actual <> p_user_id THEN
        UPDATE users
        SET 
            balance = balance + v_referral_bonus,
            total_earned = total_earned + v_referral_bonus
        WHERE id = v_referred_by_actual;
    END IF;

    -- Get updated referral statistics for client state synchronization
    SELECT COUNT(*), COALESCE(SUM(total_earned), 0) * 0.10
    INTO v_friends_count, v_referral_earned
    FROM users
    WHERE referred_by = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'balance', v_balance,
        'ads_watched_today', v_ads_watched_today,
        'last_ad_watched_at', v_last_ad_watched_at,
        'friends_count', v_friends_count,
        'referral_earned', v_referral_earned
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Atomic Procedure: request_withdrawal
-- Verifies balance >= $5.00, deducts user balance, and inserts pending payout record
CREATE OR REPLACE FUNCTION request_withdrawal(
    p_user_id BIGINT,
    p_amount NUMERIC(10, 2),
    p_method TEXT,
    p_target_address TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_balance NUMERIC(10, 2);
    v_withdrawal_id UUID;
    v_friends_count INT;
    v_referral_earned NUMERIC(10, 2);
BEGIN
    -- Check user balance and lock row for update
    SELECT balance INTO v_balance FROM users WHERE id = p_user_id FOR UPDATE;

    IF v_balance IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User profile not found.');
    END IF;

    IF p_amount < 5.00 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Minimum withdrawal threshold is $5.00.');
    END IF;

    IF v_balance < p_amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance. You need at least $' || p_amount || ' in your account.');
    END IF;

    -- Deduct balance
    UPDATE users
    SET balance = balance - p_amount
    WHERE id = p_user_id
    RETURNING balance INTO v_balance;

    -- Record pending withdrawal transaction
    INSERT INTO withdrawals (user_id, amount, method, target_address, status)
    VALUES (p_user_id, p_amount, p_method, p_target_address, 'pending')
    RETURNING id INTO v_withdrawal_id;

    -- Fetch invite stats to maintain UI consistency
    SELECT COUNT(*), COALESCE(SUM(total_earned), 0) * 0.10
    INTO v_friends_count, v_referral_earned
    FROM users
    WHERE referred_by = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'withdrawal_id', v_withdrawal_id,
        'new_balance', v_balance,
        'friends_count', v_friends_count,
        'referral_earned', v_referral_earned
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
