CREATE TABLE "admin_actions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" varchar NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" varchar NOT NULL,
	"details" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bot_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bot_token" text NOT NULL,
	"bot_username" text NOT NULL,
	"start_link" text NOT NULL,
	"admin_telegram_ids" text[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "raffle_participants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"raffle_id" varchar NOT NULL,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "raffles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" varchar NOT NULL,
	"message_id" varchar NOT NULL,
	"forwarded_message_id" varchar,
	"request_number" integer NOT NULL,
	"prize_type" text NOT NULL,
	"prize_value" integer,
	"required_channels" text[] NOT NULL,
	"raffle_datetime" timestamp NOT NULL,
	"level_required" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"submitter_id" varchar NOT NULL,
	"reviewer_id" varchar,
	"rejection_reason" text,
	"participant_count" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"original_data" jsonb,
	"message_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_id" varchar NOT NULL,
	"referred_id" varchar NOT NULL,
	"points_earned" integer DEFAULT 50 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsor_channels" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" varchar NOT NULL,
	"channel_username" varchar,
	"channel_name" text NOT NULL,
	"channel_url" text NOT NULL,
	"description" text,
	"points_reward" integer DEFAULT 100 NOT NULL,
	"is_special" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"bot_has_access" boolean DEFAULT false NOT NULL,
	"last_access_check" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sponsor_channels_channel_id_unique" UNIQUE("channel_id")
);
--> statement-breakpoint
CREATE TABLE "user_seen_raffles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"raffle_id" varchar NOT NULL,
	"seen_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_sponsor_memberships" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"channel_id" varchar NOT NULL,
	"is_member" boolean DEFAULT false NOT NULL,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"joined_at" timestamp,
	"left_at" timestamp,
	"last_checked" timestamp DEFAULT now(),
	"check_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"telegram_id" varchar,
	"username" text,
	"first_name" text,
	"last_name" text,
	"email" varchar,
	"profile_image_url" varchar,
	"auth_method" text DEFAULT 'telegram' NOT NULL,
	"user_type" text DEFAULT 'regular' NOT NULL,
	"admin_level" integer DEFAULT 1,
	"points" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"referral_code" varchar,
	"referrer_id" varchar,
	"referral_reward" integer DEFAULT 50 NOT NULL,
	"is_sponsor_member" boolean DEFAULT false NOT NULL,
	"is_restricted" boolean DEFAULT false NOT NULL,
	"restriction_start" timestamp,
	"restriction_end" timestamp,
	"restriction_reason" text,
	"submission_count" integer DEFAULT 0 NOT NULL,
	"last_submission_at" timestamp,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_telegram_id_unique" UNIQUE("telegram_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");