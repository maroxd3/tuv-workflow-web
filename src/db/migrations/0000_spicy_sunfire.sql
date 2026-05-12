CREATE TABLE "fahrzeug" (
	"fahrzeug_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kennzeichen" text NOT NULL,
	"fin" text,
	"hersteller" text NOT NULL,
	"modell" text NOT NULL,
	"baujahr" integer,
	"farbe" text,
	"typ" text NOT NULL,
	"kilometerstand" integer,
	"hu_faellig" date,
	"halter_id" uuid NOT NULL,
	"erfasst_am" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fahrzeug_baujahr_check" CHECK ("fahrzeug"."baujahr" BETWEEN 1885 AND EXTRACT(YEAR FROM CURRENT_DATE)::int + 1),
	CONSTRAINT "fahrzeug_km_check" CHECK ("fahrzeug"."kilometerstand" BETWEEN 0 AND 3000000)
);
--> statement-breakpoint
CREATE TABLE "halter" (
	"halter_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"telefon" text,
	"email" text,
	"anschrift" text,
	"erfasst_am" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mangel" (
	"mangel_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"termin_id" uuid NOT NULL,
	"code_stvzo" text,
	"beschreibung" text NOT NULL,
	"kategorie_code" text NOT NULL,
	"behoben" boolean DEFAULT false NOT NULL,
	"erfasst_am" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mangel_kategorie" (
	"kategorie_code" text PRIMARY KEY NOT NULL,
	"bezeichnung" text NOT NULL,
	"blockiert_bestanden" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pruefart" (
	"prueft_code" text PRIMARY KEY NOT NULL,
	"bezeichnung" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pruefer" (
	"pruefer_kuerzel" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"qualifikation" text
);
--> statement-breakpoint
CREATE TABLE "status" (
	"status_code" text PRIMARY KEY NOT NULL,
	"bezeichnung" text NOT NULL,
	"ist_endzustand" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "termin" (
	"termin_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fahrzeug_id" uuid NOT NULL,
	"datum" date NOT NULL,
	"uhrzeit" time,
	"prueft_code" text NOT NULL,
	"pruefer_kuerzel" text,
	"status_code" text DEFAULT 'GEPLANT' NOT NULL,
	"notiz" text,
	"erfasst_am" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fahrzeug" ADD CONSTRAINT "fahrzeug_halter_id_halter_halter_id_fk" FOREIGN KEY ("halter_id") REFERENCES "public"."halter"("halter_id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "mangel" ADD CONSTRAINT "mangel_termin_id_termin_termin_id_fk" FOREIGN KEY ("termin_id") REFERENCES "public"."termin"("termin_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mangel" ADD CONSTRAINT "mangel_kategorie_code_mangel_kategorie_kategorie_code_fk" FOREIGN KEY ("kategorie_code") REFERENCES "public"."mangel_kategorie"("kategorie_code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "termin" ADD CONSTRAINT "termin_fahrzeug_id_fahrzeug_fahrzeug_id_fk" FOREIGN KEY ("fahrzeug_id") REFERENCES "public"."fahrzeug"("fahrzeug_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "termin" ADD CONSTRAINT "termin_prueft_code_pruefart_prueft_code_fk" FOREIGN KEY ("prueft_code") REFERENCES "public"."pruefart"("prueft_code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "termin" ADD CONSTRAINT "termin_pruefer_kuerzel_pruefer_pruefer_kuerzel_fk" FOREIGN KEY ("pruefer_kuerzel") REFERENCES "public"."pruefer"("pruefer_kuerzel") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "termin" ADD CONSTRAINT "termin_status_code_status_status_code_fk" FOREIGN KEY ("status_code") REFERENCES "public"."status"("status_code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "fahrzeug_kennzeichen_unique" ON "fahrzeug" USING btree ("kennzeichen");--> statement-breakpoint
CREATE UNIQUE INDEX "fahrzeug_fin_unique" ON "fahrzeug" USING btree ("fin") WHERE "fahrzeug"."fin" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "fahrzeug_hu_idx" ON "fahrzeug" USING btree ("hu_faellig") WHERE "fahrzeug"."hu_faellig" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "halter_email_unique" ON "halter" USING btree ("email");--> statement-breakpoint
CREATE INDEX "halter_name_idx" ON "halter" USING btree (LOWER("name"));--> statement-breakpoint
CREATE INDEX "mangel_termin_idx" ON "mangel" USING btree ("termin_id");--> statement-breakpoint
CREATE INDEX "mangel_kategorie_idx" ON "mangel" USING btree ("kategorie_code");--> statement-breakpoint
CREATE UNIQUE INDEX "termin_zeit_unique" ON "termin" USING btree ("fahrzeug_id","datum","uhrzeit");--> statement-breakpoint
CREATE INDEX "termin_datum_idx" ON "termin" USING btree ("datum","uhrzeit");--> statement-breakpoint
CREATE INDEX "termin_fahrzeug_idx" ON "termin" USING btree ("fahrzeug_id","datum");