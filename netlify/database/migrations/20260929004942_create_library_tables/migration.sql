CREATE TABLE "book_copies" (
	"id" serial PRIMARY KEY,
	"book_id" integer NOT NULL,
	"copy_number" integer NOT NULL,
	"code" text NOT NULL UNIQUE,
	"status" text DEFAULT 'AVAILABLE' NOT NULL,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"isbn" text UNIQUE,
	"published_year" integer,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debts" (
	"id" serial PRIMARY KEY,
	"loan_id" integer NOT NULL UNIQUE,
	"user_id" integer NOT NULL,
	"days_late" integer NOT NULL,
	"daily_fee_cents" integer NOT NULL,
	"amount_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" serial PRIMARY KEY,
	"copy_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"loaned_at" timestamp with time zone NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"returned_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"phone" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "book_copies_book_copy_number_idx" ON "book_copies" ("book_id","copy_number");--> statement-breakpoint
CREATE INDEX "book_copies_status_idx" ON "book_copies" ("book_id","status");--> statement-breakpoint
CREATE INDEX "debts_user_idx" ON "debts" ("user_id");--> statement-breakpoint
CREATE INDEX "loans_user_idx" ON "loans" ("user_id");--> statement-breakpoint
CREATE INDEX "loans_copy_idx" ON "loans" ("copy_id");--> statement-breakpoint
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_book_id_books_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "debts_loan_id_loans_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id");--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "debts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_copy_id_book_copies_id_fkey" FOREIGN KEY ("copy_id") REFERENCES "book_copies"("id");--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");