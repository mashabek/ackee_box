-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateTable
CREATE TABLE "Box" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "location" geography(Point, 4326) NOT NULL,
    "status" TEXT,

    CONSTRAINT "Box_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Box_code_key" ON "Box"("code");

-- Create spatial index
CREATE INDEX "Box_location_gix" ON "Box" USING GIST ("location");
